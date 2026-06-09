import { Injectable, NotFoundException } from "@nestjs/common";
import { MemoryService } from "../memory/memory.service";
import type { TenantContext } from "../tenant/tenant.service";
import type { RealtimeAgentContext, RealtimeVoice } from "./realtime.types";
import { RealtimeSessionRepository } from "./repositories/realtime-session.repository";

@Injectable()
export class RealtimeAgentContextService {
  constructor(
    private readonly sessions: RealtimeSessionRepository,
    private readonly memory: MemoryService,
  ) {}

  async load(streamSid: string) {
    const callSession = await this.sessions.findCallSessionByStreamSid(streamSid);
    if (
      !callSession ||
      callSession.organizationId !== callSession.call.organizationId ||
      callSession.call.agent.status !== "ACTIVE" ||
      callSession.call.agent.deletedAt
    ) {
      throw new NotFoundException("Active agent context not found for media stream.");
    }

    const agent = callSession.call.agent;
    const context: RealtimeAgentContext = {
      organizationId: callSession.organizationId,
      callId: callSession.callId,
      callSessionId: callSession.id,
      agentId: agent.id,
      agentName: agent.name,
      systemPrompt: agent.systemPrompt,
      language: agent.language,
      voice: mapRealtimeVoice(agent.voice),
      knowledgeBaseIds: agent.knowledgeBases.map((knowledgeBase) => knowledgeBase.id),
    };

    return context;
  }

  async memoryInstructions(context: TenantContext, conversationId: string) {
    const memory = await this.memory.getPromptMemory(context, conversationId);
    const facts = memory.facts.map((fact) => `${fact.factKey}: ${fact.factValue}`).join("\n");

    return [
      memory.summary ? `Conversation memory:\n${memory.summary}` : "",
      facts ? `Known facts:\n${facts}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }
}

export function mapRealtimeVoice(voice: string): RealtimeVoice {
  const normalized = voice.toLowerCase();
  if (
    normalized === "alloy" ||
    normalized === "echo" ||
    normalized === "shimmer" ||
    normalized === "verse" ||
    normalized === "cedar" ||
    normalized === "coral"
  ) {
    return normalized;
  }

  const legacyMap: Record<string, RealtimeVoice> = {
    fable: "verse",
    onyx: "cedar",
    nova: "coral",
  };
  return legacyMap[normalized] ?? "alloy";
}
