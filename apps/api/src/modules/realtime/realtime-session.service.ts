import { Injectable } from "@nestjs/common";
import type { Prisma } from "../../../generated/prisma";
import type { TenantContext } from "../tenant/tenant.service";
import { RealtimeConversationService } from "./realtime-conversation.service";
import type { RealtimeAgentContext } from "./realtime.types";
import { RealtimeSessionRepository } from "./repositories/realtime-session.repository";

@Injectable()
export class RealtimeSessionService {
  constructor(
    private readonly sessions: RealtimeSessionRepository,
    private readonly conversations: RealtimeConversationService,
  ) {}

  async create(context: RealtimeAgentContext, streamSid: string) {
    const tenant = voiceTenant(context.organizationId);
    const existing = await this.sessions.findByCallSessionId(context.callSessionId);
    if (existing?.conversationId) {
      return {
        session: existing,
        conversationId: existing.conversationId,
        tenant,
      };
    }

    const conversation = await this.conversations.create(tenant, context.agentId, streamSid);
    const session = await this.sessions.upsertConnecting({
      organizationId: context.organizationId,
      callId: context.callId,
      callSessionId: context.callSessionId,
      agentId: context.agentId,
      conversationId: conversation.id,
    });
    await this.audit(context.organizationId, "realtime.session_created", session.id, {
      callId: context.callId,
      callSessionId: context.callSessionId,
      streamSid,
    });
    return { session, conversationId: conversation.id, tenant };
  }

  async connected(realtimeSessionId: string, organizationId: string, openAiSessionId?: string) {
    const session = await this.sessions.markConnected(realtimeSessionId, openAiSessionId);
    await this.audit(organizationId, "realtime.session_connected", realtimeSessionId, {
      openAiSessionId: openAiSessionId ?? null,
    });
    return session;
  }

  async disconnected(realtimeSessionId: string, tenant: TenantContext, conversationId: string) {
    const result = await this.sessions.markClosedIfActive(realtimeSessionId, "DISCONNECTED");
    await this.conversations.close(tenant, conversationId);
    if (result.changed) {
      await this.audit(tenant.organizationId, "realtime.session_disconnected", realtimeSessionId);
    }
    return result.session;
  }

  async failed(
    realtimeSessionId: string,
    tenant: TenantContext,
    conversationId: string,
    reason: string,
  ) {
    const result = await this.sessions.markClosedIfActive(realtimeSessionId, "FAILED");
    await this.conversations.close(tenant, conversationId);
    if (result.changed) {
      await this.audit(tenant.organizationId, "realtime.session_failed", realtimeSessionId, {
        reason,
      });
    }
    return result.session;
  }

  recordAudioSent(realtimeSessionId: string) {
    return this.sessions.incrementAudioSent(realtimeSessionId);
  }

  recordAudioReceived(realtimeSessionId: string) {
    return this.sessions.incrementAudioReceived(realtimeSessionId);
  }

  recordLatency(realtimeSessionId: string, latencyMs: number) {
    return this.sessions.recordLatency(realtimeSessionId, latencyMs);
  }

  async listForCall(context: TenantContext, callId: string) {
    return this.sessions.findByCallId(context.organizationId, callId);
  }

  stats(context: TenantContext) {
    return this.sessions.stats(context.organizationId);
  }

  private audit(
    organizationId: string,
    action: string,
    entityId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.sessions.createAuditEvent({
      organizationId,
      action,
      entityType: "RealtimeSession",
      entityId,
      metadata,
    });
  }
}

export function voiceTenant(organizationId: string): TenantContext {
  return {
    organizationId,
    userId: "voice-call",
    email: "voice-call@system.local",
    role: "MEMBER",
  };
}
