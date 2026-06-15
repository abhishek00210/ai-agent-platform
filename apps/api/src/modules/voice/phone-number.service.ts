import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { PhoneNumberStatus, Prisma } from "../../../generated/prisma";
import type { TenantContext } from "../tenant/tenant.service";
import { TwilioService } from "../twilio/twilio.service";
import type { AssignPhoneNumberAgentDto, ListPhoneNumbersQueryDto } from "./dto/phone-number.dto";
import { normalizeE164 } from "./e164";
import { PhoneNumberRepository } from "./repositories/phone-number.repository";
import { VoiceWebhookUrlService } from "./voice-webhook-url.service";
import { CallRoutingService } from "./call-routing.service";

@Injectable()
export class PhoneNumberService {
  constructor(
    private readonly phoneNumbers: PhoneNumberRepository,
    private readonly twilio: TwilioService,
    private readonly webhookUrls: VoiceWebhookUrlService,
    private readonly routing: CallRoutingService,
  ) {}

  async sync(context: TenantContext) {
    const numbers = await this.twilio.listPhoneNumbers();
    const synced = await Promise.all(
      numbers.map(async (number) => {
        const phoneNumber = normalizeE164(number.phoneNumber);
        const existing = await this.phoneNumbers.findByPhoneNumber(phoneNumber);
        if (existing && existing.organizationId !== context.organizationId) {
          throw new ConflictException("Phone number already belongs to another organization.");
        }
        return this.phoneNumbers.upsertFromProvider({
          organizationId: context.organizationId,
          phoneNumber,
          friendlyName: number.friendlyName,
          country: number.country,
          capabilities: number.capabilities as Prisma.InputJsonValue,
          twilioSid: number.providerSid,
          voiceWebhookUrl: this.webhookUrls.voiceUrl(),
          smsWebhookUrl: this.webhookUrls.smsUrl(),
        });
      }),
    );
    numbers.forEach((number) => this.routing.invalidate(number.phoneNumber));

    await this.audit(context, "phone_number.synced", undefined, {
      provider: "TWILIO",
      count: synced.length,
    });

    return {
      total: synced.length,
      data: synced.map(toPhoneNumberResponse),
    };
  }

  async list(context: TenantContext, query: ListPhoneNumbersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    if (query.agentId) {
      await this.assertAgent(context.organizationId, query.agentId);
    }
    const result = await this.phoneNumbers.list({
      organizationId: context.organizationId,
      page,
      limit,
      search: normalizeOptionalText(query.search) ?? undefined,
      status: query.status as PhoneNumberStatus | undefined,
      agentId: query.agentId,
    });

    return {
      total: result.total,
      page,
      limit,
      data: result.data.map(toPhoneNumberResponse),
    };
  }

  async getById(context: TenantContext, phoneNumberId: string) {
    const phoneNumber = await this.getScopedPhoneNumber(context.organizationId, phoneNumberId);
    return toPhoneNumberResponse(phoneNumber);
  }

  async assignAgent(
    context: TenantContext,
    phoneNumberId: string,
    input: AssignPhoneNumberAgentDto,
  ) {
    const phoneNumber = await this.getScopedPhoneNumber(context.organizationId, phoneNumberId);
    const agent = await this.assertAgent(context.organizationId, input.agentId);
    if (phoneNumber.twilioSid) {
      await this.twilio.assignNumber(phoneNumber.twilioSid, {
        voiceWebhookUrl: this.webhookUrls.voiceUrl(),
        smsWebhookUrl: this.webhookUrls.smsUrl(),
      });
    }
    await this.phoneNumbers.assignAgent(context.organizationId, phoneNumberId, agent.id);
    this.routing.invalidate(phoneNumber.phoneNumber);
    await this.audit(context, "phone_number.assigned", phoneNumber.id, {
      agentId: agent.id,
      phoneNumber: phoneNumber.phoneNumber,
    });
    return this.getById(context, phoneNumberId);
  }

  async unassign(context: TenantContext, phoneNumberId: string) {
    const phoneNumber = await this.getScopedPhoneNumber(context.organizationId, phoneNumberId);
    await this.phoneNumbers.unassignAgent(context.organizationId, phoneNumberId);
    this.routing.invalidate(phoneNumber.phoneNumber);
    await this.audit(context, "phone_number.unassigned", phoneNumber.id, {
      previousAgentId: phoneNumber.agentId,
      phoneNumber: phoneNumber.phoneNumber,
    });
    return this.getById(context, phoneNumberId);
  }

  async enable(context: TenantContext, phoneNumberId: string) {
    const phoneNumber = await this.getScopedPhoneNumber(context.organizationId, phoneNumberId);
    const status: PhoneNumberStatus = phoneNumber.agentId ? "ACTIVE" : "UNASSIGNED";
    await this.phoneNumbers.updateStatus(context.organizationId, phoneNumberId, status);
    this.routing.invalidate(phoneNumber.phoneNumber);
    await this.audit(context, "phone_number.enabled", phoneNumber.id, { status });
    return this.getById(context, phoneNumberId);
  }

  async disable(context: TenantContext, phoneNumberId: string) {
    const phoneNumber = await this.getScopedPhoneNumber(context.organizationId, phoneNumberId);
    if (phoneNumber.twilioSid) {
      await this.twilio.removeNumber(phoneNumber.twilioSid);
    }
    await this.phoneNumbers.updateStatus(context.organizationId, phoneNumberId, "INACTIVE");
    this.routing.invalidate(phoneNumber.phoneNumber);
    await this.audit(context, "phone_number.disabled", phoneNumber.id, {
      phoneNumber: phoneNumber.phoneNumber,
    });
    return this.getById(context, phoneNumberId);
  }

  async analytics(context: TenantContext) {
    return this.phoneNumbers.stats(context.organizationId);
  }

  async getRoutableByPhoneNumber(phoneNumber: string) {
    const routable = await this.phoneNumbers.findRoutableByPhoneNumber(normalizeE164(phoneNumber));
    return routable ? toPhoneNumberResponse(routable) : null;
  }

  private async getScopedPhoneNumber(organizationId: string, phoneNumberId: string) {
    const phoneNumber = await this.phoneNumbers.findById(organizationId, phoneNumberId);
    if (!phoneNumber) {
      throw new NotFoundException("Phone number not found.");
    }
    return phoneNumber;
  }

  private async assertAgent(organizationId: string, agentId: string) {
    const agent = await this.phoneNumbers.agentExists(organizationId, agentId);
    if (!agent) {
      throw new NotFoundException("Agent not found.");
    }
    return agent;
  }

  private audit(
    context: TenantContext,
    action: string,
    entityId?: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.phoneNumbers.createAuditEvent({
      organizationId: context.organizationId,
      actorUserId: context.userId,
      action,
      entityType: "PhoneNumber",
      entityId,
      metadata,
    });
  }
}

function toPhoneNumberResponse(phoneNumber: {
  id: string;
  organizationId: string;
  agentId: string | null;
  phoneNumber: string;
  friendlyName: string | null;
  country: string | null;
  capabilities: Prisma.JsonValue;
  provider: string;
  status: string;
  twilioSid: string | null;
  voiceWebhookUrl: string | null;
  smsWebhookUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  agent: { id: string; name: string; status: string; language: string } | null;
}) {
  return {
    id: phoneNumber.id,
    organizationId: phoneNumber.organizationId,
    agentId: phoneNumber.agentId,
    agent: phoneNumber.agent,
    phoneNumber: phoneNumber.phoneNumber,
    friendlyName: phoneNumber.friendlyName,
    country: phoneNumber.country,
    capabilities: phoneNumber.capabilities,
    provider: phoneNumber.provider,
    status: phoneNumber.status,
    twilioSid: phoneNumber.twilioSid,
    voiceWebhookUrl: phoneNumber.voiceWebhookUrl,
    smsWebhookUrl: phoneNumber.smsWebhookUrl,
    createdAt: phoneNumber.createdAt,
    updatedAt: phoneNumber.updatedAt,
  };
}

function normalizeOptionalText(value?: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
