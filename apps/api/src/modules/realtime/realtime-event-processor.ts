import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Prisma } from "../../../generated/prisma";
import { RetrievalService } from "../rag/retrieval.service";
import { RealtimeAudioBridge } from "./realtime-audio-bridge";
import { RealtimeConnectionManager } from "./realtime-connection-manager";
import { RealtimeConversationService } from "./realtime-conversation.service";
import { RealtimeSessionService, voiceTenant } from "./realtime-session.service";
import type { OpenAiRealtimeEvent, RealtimeConnection } from "./realtime.types";

@Injectable()
export class RealtimeEventProcessor {
  private readonly logger = new Logger(RealtimeEventProcessor.name);
  private readonly assistantText = new Map<string, string>();
  private readonly sources = new Map<string, Prisma.InputJsonValue>();
  private readonly responseStartedAt = new Map<string, number>();

  constructor(
    private readonly config: ConfigService,
    private readonly connections: RealtimeConnectionManager,
    private readonly audioBridge: RealtimeAudioBridge,
    private readonly sessions: RealtimeSessionService,
    private readonly conversations: RealtimeConversationService,
    private readonly retrieval: RetrievalService,
  ) {}

  async process(connection: RealtimeConnection, event: OpenAiRealtimeEvent) {
    switch (event.type) {
      case "session.created":
        await this.sessions.connected(
          connection.realtimeSessionId,
          connection.context.organizationId,
          event.session?.id,
        );
        return;
      case "session.updated":
        return;
      case "response.created":
        this.responseStartedAt.set(connection.streamSid, Date.now());
        this.assistantText.set(connection.streamSid, "");
        return;
      case "conversation.item.input_audio_transcription.completed":
        await this.handleCallerTranscript(connection, event.transcript ?? "");
        return;
      case "input_audio_buffer.speech_started":
        connection.sendToTwilio({
          event: "clear",
          streamSid: connection.streamSid,
        });
        return;
      case "response.output_text.delta":
      case "response.output_audio_transcript.delta":
        this.appendAssistantText(connection.streamSid, event.delta ?? "");
        return;
      case "response.output_audio.delta":
      case "response.audio.delta":
        if (event.delta) {
          this.audioBridge.forwardOpenAiAudio({
            streamSid: connection.streamSid,
            realtimeSessionId: connection.realtimeSessionId,
            payload: event.delta,
            sendToTwilio: connection.sendToTwilio,
          });
        }
        return;
      case "response.completed":
      case "response.done":
        await this.persistAssistantResponse(connection, event);
        return;
      case "error":
        await this.handleError(connection, event);
        return;
      default:
        return;
    }
  }

  clear(streamSid: string) {
    this.assistantText.delete(streamSid);
    this.sources.delete(streamSid);
    this.responseStartedAt.delete(streamSid);
  }

  private async handleCallerTranscript(connection: RealtimeConnection, transcript: string) {
    const query = transcript.trim();
    if (!query) {
      return;
    }

    await this.conversations.storeUserTranscript(
      voiceTenant(connection.context.organizationId),
      connection.conversationId,
      query,
      {
        source: "realtime_voice",
        streamSid: connection.streamSid,
      },
    );

    let chunks: Awaited<ReturnType<RetrievalService["search"]>> = [];
    if (connection.context.knowledgeBaseIds.length > 0) {
      try {
        chunks = await this.retrieval.search({
          organizationId: connection.context.organizationId,
          knowledgeBaseIds: connection.context.knowledgeBaseIds,
          query,
        });
      } catch (error) {
        this.logger.warn(`Realtime RAG retrieval failed: ${readError(error)}`);
      }
    }

    const sourceMetadata = chunks.map((chunk) => ({
      chunkId: chunk.chunkId,
      sourceId: chunk.sourceId,
      sourceType: chunk.sourceType,
      sourceName: chunk.sourceName,
      relevanceScore: chunk.relevanceScore,
      knowledgeBaseId: chunk.knowledgeBaseId,
    }));
    this.sources.set(connection.streamSid, sourceMetadata as Prisma.InputJsonValue);

    if (chunks.length > 0) {
      this.connections.send(connection.streamSid, {
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "system",
          content: [
            {
              type: "input_text",
              text: buildKnowledgeContext(chunks),
            },
          ],
        },
      });
    }

    this.connections.send(connection.streamSid, {
      type: "response.create",
      response: {
        output_modalities: ["audio"],
      },
    });
  }

  private async persistAssistantResponse(
    connection: RealtimeConnection,
    event: OpenAiRealtimeEvent,
  ) {
    const content = this.assistantText.get(connection.streamSid)?.trim();
    if (!content) {
      return;
    }

    const responseTimeMs = this.responseStartedAt.has(connection.streamSid)
      ? Date.now() - (this.responseStartedAt.get(connection.streamSid) ?? Date.now())
      : 0;
    const usage = event.response?.usage;

    await this.conversations.storeAssistantTranscript(
      voiceTenant(connection.context.organizationId),
      connection.conversationId,
      content,
      {
        source: "realtime_voice",
        model: this.config.get<string>("openai.realtimeModel") ?? "gpt-realtime-2",
        responseTimeMs,
        promptTokens: usage?.input_tokens ?? 0,
        completionTokens: usage?.output_tokens ?? 0,
        totalTokens: usage?.total_tokens ?? 0,
        sources: this.sources.get(connection.streamSid) ?? [],
      },
    );
    await this.sessions.recordLatency(connection.realtimeSessionId, responseTimeMs);

    this.assistantText.delete(connection.streamSid);
    this.sources.delete(connection.streamSid);
    this.responseStartedAt.delete(connection.streamSid);
  }

  private async handleError(connection: RealtimeConnection, event: OpenAiRealtimeEvent) {
    const reason = event.error?.message ?? "OpenAI Realtime error.";
    this.logger.error(`OpenAI Realtime failure for ${connection.streamSid}: ${reason}`);
    throw new Error(reason);
  }

  private appendAssistantText(streamSid: string, delta: string) {
    if (!delta) {
      return;
    }
    this.assistantText.set(streamSid, `${this.assistantText.get(streamSid) ?? ""}${delta}`);
  }
}

function buildKnowledgeContext(chunks: Awaited<ReturnType<RetrievalService["search"]>>): string {
  const context = chunks
    .map((chunk, index) => `[Source ${index + 1}: ${chunk.sourceName}]\n${chunk.chunkText}`)
    .join("\n\n");

  return [
    "Use the following retrieved business knowledge when it is relevant.",
    "Do not mention this internal context block or invent facts beyond it.",
    context,
  ].join("\n\n");
}

function readError(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}
