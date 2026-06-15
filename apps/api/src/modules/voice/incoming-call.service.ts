import { BadRequestException, Injectable } from "@nestjs/common";
import type { Prisma } from "../../../generated/prisma";
import { RealtimeMetricsService } from "../../common/metrics/realtime-metrics.service";
import { CallRoutingService } from "./call-routing.service";
import { normalizeE164 } from "./e164";
import { CallRepository } from "./repositories/call.repository";
import { PhoneNumberRepository } from "./repositories/phone-number.repository";
import { TwiMLResponseService } from "./twiml-response.service";

@Injectable()
export class IncomingCallService {
  constructor(
    private readonly routing: CallRoutingService,
    private readonly phoneNumbers: PhoneNumberRepository,
    private readonly calls: CallRepository,
    private readonly twiml: TwiMLResponseService,
    private readonly metrics: RealtimeMetricsService,
  ) {}

  async handle(payload: Record<string, unknown>): Promise<string> {
    const webhookStartedAt = this.metrics.now();
    const input = parseWebhook(payload);
    const calledNumber = normalizeE164(input.To);
    const lookupStartedAt = this.metrics.now();
    const route = await this.routing.resolve(calledNumber);
    this.metrics.observe("db_lookup_ms", lookupStartedAt, Boolean(route));
    if (!route || !route.agentId || !route.agent) {
      this.defer(() => this.auditRoutingFailure(calledNumber, input.CallSid));
      this.metrics.observe("webhook_processing_ms", webhookStartedAt, false);
      return this.twiml.unavailable();
    }

    const call = await this.calls.createInbound({
      organizationId: route.organizationId,
      agentId: route.agentId,
      phoneNumberId: route.id,
      twilioCallSid: input.CallSid,
      callerNumber: input.From,
      calledNumber,
      metadata: {
        twilioDirection: input.Direction ?? "inbound",
        timestamp: input.Timestamp ?? null,
      } satisfies Prisma.InputJsonObject,
    });

    this.defer(() =>
      Promise.all([
        this.audit(route.organizationId, "call.incoming_received", call.id, {
          twilioCallSid: input.CallSid,
          callerNumber: input.From,
          calledNumber,
        }),
        this.audit(route.organizationId, "call.record_created", call.id, {
          status: call.status,
        }),
        this.audit(route.organizationId, "call.routed", call.id, {
          agentId: route.agentId,
          phoneNumberId: route.id,
        }),
        this.calls.updateStatus(route.organizationId, call.id, "ROUTING"),
      ]),
    );

    this.metrics.observe("webhook_processing_ms", webhookStartedAt);
    return this.twiml.routing();
  }

  private async auditRoutingFailure(calledNumber: string, twilioCallSid: string) {
    const phoneNumber = await this.phoneNumbers.findByPhoneNumber(calledNumber);
    if (!phoneNumber) {
      return;
    }
    await this.audit(phoneNumber.organizationId, "call.routing_failed", undefined, {
      calledNumber,
      twilioCallSid,
    });
  }

  private audit(
    organizationId: string,
    action: string,
    entityId?: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.calls.createAuditEvent({
      organizationId,
      action,
      entityType: "Call",
      entityId,
      metadata,
    });
  }

  private defer(task: () => Promise<unknown>) {
    setImmediate(() => {
      void task().catch(() => {
        this.metrics.increment("deferred_persistence_failures");
      });
    });
  }
}

function parseWebhook(payload: Record<string, unknown>) {
  const CallSid = requiredString(payload.CallSid, "CallSid");
  const From = requiredString(payload.From, "From");
  const To = requiredString(payload.To, "To");
  return {
    CallSid,
    From,
    To,
    Direction: optionalString(payload.Direction),
    Timestamp: optionalString(payload.Timestamp),
  };
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new BadRequestException(`${field} is required.`);
  }
  return value.trim();
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
