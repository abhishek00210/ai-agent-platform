import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Prisma } from "../../../generated/prisma";
import { RetrievalService } from "../rag/retrieval.service";
import { RealtimeAudioBridge } from "./realtime-audio-bridge";
import { RealtimeConnectionManager } from "./realtime-connection-manager";
import { RealtimeConversationService } from "./realtime-conversation.service";
import { RealtimeSessionService, voiceTenant } from "./realtime-session.service";
import type { OpenAiRealtimeEvent, RealtimeConnection } from "./realtime.types";
import { DeferredPersistenceService } from "./deferred-persistence.service";
import { RealtimeMetricsService } from "../../common/metrics/realtime-metrics.service";

interface PlaybackState {
  itemId: string;
  audioSentMs: number;
  firstWriteAt?: number;
}

@Injectable()
export class RealtimeEventProcessor {
  private readonly logger = new Logger(RealtimeEventProcessor.name);
  private readonly assistantText = new Map<string, string>();
  private readonly sources = new Map<string, Prisma.InputJsonValue>();
  private readonly responseStartedAt = new Map<string, number>();
  private readonly speechStoppedAt = new Map<string, number>();
  private readonly turnStartedAt = new Map<string, number>();
  private readonly playback = new Map<string, PlaybackState>();

  constructor(
    private readonly config: ConfigService,
    private readonly connections: RealtimeConnectionManager,
    private readonly audioBridge: RealtimeAudioBridge,
    private readonly sessions: RealtimeSessionService,
    private readonly conversations: RealtimeConversationService,
    private readonly retrieval: RetrievalService,
    private readonly persistence: DeferredPersistenceService,
    private readonly metrics: RealtimeMetricsService,
  ) {}

  async process(connection: RealtimeConnection, event: OpenAiRealtimeEvent) {
    switch (event.type) {
      case "session.created":
        this.persistence.enqueue(() =>
          this.sessions.connected(
            connection.realtimeSessionId,
            connection.context.organizationId,
            event.session?.id,
          ),
        );
        return;
      case "session.updated":
        return;
      case "response.created":
        this.responseStartedAt.set(connection.streamSid, this.metrics.now());
        this.observeFrom("openai_response_created_ms", this.speechStoppedAt, connection.streamSid);
        this.assistantText.set(connection.streamSid, "");
        return;
      case "response.output_item.added":
      case "response.output_item.created":
        if (event.item?.id) {
          this.playback.set(connection.streamSid, {
            itemId: event.item.id,
            audioSentMs: 0,
          });
        }
        return;
      case "conversation.item.input_audio_transcription.completed":
        await this.handleCallerTranscript(connection, event.transcript ?? "");
        return;
      case "input_audio_buffer.speech_started":
        await this.handleBargeIn(connection);
        this.turnStartedAt.set(connection.streamSid, this.metrics.now());
        return;
      case "input_audio_buffer.speech_stopped":
        this.speechStoppedAt.set(connection.streamSid, this.metrics.now());
        this.observeFrom(
          "end_of_speech_detection_ms",
          this.turnStartedAt,
          connection.streamSid,
        );
        return;
      case "response.output_text.delta":
      case "response.output_audio_transcript.delta":
        this.appendAssistantText(connection.streamSid, event.delta ?? "");
        return;
      case "response.output_audio.delta":
      case "response.audio.delta":
        if (event.delta) {
          const playback = this.playback.get(connection.streamSid);
          if (playback) {
            playback.audioSentMs += pcmuDurationMs(event.delta);
          }
          const firstAudioStartedAt = this.metrics.now();
          this.audioBridge.forwardOpenAiAudio({
            streamSid: connection.streamSid,
            realtimeSessionId: connection.realtimeSessionId,
            payload: event.delta,
            sendToTwilio: connection.sendToTwilio,
          });
          if (playback && playback.firstWriteAt === undefined) {
            playback.firstWriteAt = this.metrics.now();
            this.metrics.observe("twilio_first_audio_write_ms", firstAudioStartedAt);
            this.observeFrom(
              "openai_first_audio_delta_ms",
              this.responseStartedAt,
              connection.streamSid,
            );
            this.observeFrom(
              "total_first_response_ms",
              this.speechStoppedAt,
              connection.streamSid,
            );
          }
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
    this.speechStoppedAt.delete(streamSid);
    this.turnStartedAt.delete(streamSid);
    this.playback.delete(streamSid);
  }

  private async handleCallerTranscript(connection: RealtimeConnection, transcript: string) {
    const query = transcript.trim();
    if (!query) {
      return;
    }

    this.persistence.enqueue(() =>
      this.conversations.storeUserTranscript(
        voiceTenant(connection.context.organizationId),
        connection.conversationId,
        query,
        {
          source: "realtime_voice",
          streamSid: connection.streamSid,
        },
      ),
    );

    let chunks: Awaited<ReturnType<RetrievalService["search"]>> = [];
    const ragStartedAt = this.metrics.now();
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
    this.metrics.observe("rag_total_ms", ragStartedAt);

    const sourceMetadata = chunks.map((chunk) => ({
      chunkId: chunk.chunkId,
      sourceId: chunk.sourceId,
      sourceType: chunk.sourceType,
      sourceName: chunk.sourceName,
      relevanceScore: chunk.relevanceScore,
      knowledgeBaseId: chunk.knowledgeBaseId,
    }));
    this.sources.set(connection.streamSid, sourceMetadata as Prisma.InputJsonValue);

    const configuredContextBudget = this.config.get<number>("rag.maxContextLength");
    const contextBudget =
      typeof configuredContextBudget === "number" && Number.isFinite(configuredContextBudget)
        ? configuredContextBudget
        : 6_000;
    this.connections.send(connection.streamSid, {
      type: "response.create",
      response: {
        output_modalities: ["audio"],
        ...(chunks.length > 0
          ? {
              instructions: buildKnowledgeContext(chunks, contextBudget),
            }
          : {}),
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
      ? this.metrics.now() -
        (this.responseStartedAt.get(connection.streamSid) ?? this.metrics.now())
      : 0;
    const usage = event.response?.usage;
    const responseSources = this.sources.get(connection.streamSid) ?? [];

    this.persistence.enqueue(async () => {
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
          sources: responseSources,
        },
      );
      await this.sessions.recordLatency(connection.realtimeSessionId, responseTimeMs);
    });

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

  private async handleBargeIn(connection: RealtimeConnection) {
    const startedAt = this.metrics.now();
    connection.sendToTwilio({ event: "clear", streamSid: connection.streamSid });
    this.metrics.observe("barge_in_clear_ms", startedAt);

    const playback = this.playback.get(connection.streamSid);
    if (!playback) {
      return;
    }
    this.connections.send(connection.streamSid, { type: "response.cancel" });
    const elapsedMs = playback.firstWriteAt
      ? Math.max(0, this.metrics.now() - playback.firstWriteAt)
      : 0;
    this.connections.send(connection.streamSid, {
      type: "conversation.item.truncate",
      item_id: playback.itemId,
      content_index: 0,
      audio_end_ms: Math.floor(Math.min(elapsedMs, playback.audioSentMs)),
    });
    this.playback.delete(connection.streamSid);
  }

  private observeFrom(
    name: Parameters<RealtimeMetricsService["observe"]>[0],
    source: Map<string, number>,
    streamSid: string,
  ) {
    const startedAt = source.get(streamSid);
    if (startedAt !== undefined) {
      this.metrics.observe(name, startedAt);
    }
  }
}

function pcmuDurationMs(base64Payload: string): number {
  return (Buffer.byteLength(base64Payload, "base64") / 8_000) * 1_000;
}

function buildKnowledgeContext(
  chunks: Awaited<ReturnType<RetrievalService["search"]>>,
  maxCharacters: number,
): string {
  let remaining = Math.max(0, maxCharacters);
  const sections: string[] = [];

  for (const [index, chunk] of chunks.entries()) {
    const header = `[Source ${index + 1}: ${chunk.sourceName}]\n`;
    if (remaining <= header.length) {
      break;
    }
    const text = chunk.chunkText.slice(0, remaining - header.length);
    sections.push(`${header}${text}`);
    remaining -= header.length + text.length + 2;
  }

  return [
    "Use the following retrieved business knowledge when it is relevant.",
    "Do not mention this internal context block or invent facts beyond it.",
    sections.join("\n\n"),
  ].join("\n\n");
}

function readError(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}
