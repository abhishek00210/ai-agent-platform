import { Injectable, NotFoundException } from "@nestjs/common";
import type { CallStatus, Prisma } from "../../../generated/prisma";
import type { TenantContext } from "../tenant/tenant.service";
import type { ListCallsQueryDto } from "./dto/call.dto";
import { CallRepository } from "./repositories/call.repository";

@Injectable()
export class CallService {
  constructor(private readonly calls: CallRepository) {}

  async list(context: TenantContext, query: ListCallsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const result = await this.calls.list({
      organizationId: context.organizationId,
      page,
      limit,
      search: normalizeOptionalText(query.search) ?? undefined,
      status: query.status as CallStatus | undefined,
      agentId: query.agentId,
      phoneNumberId: query.phoneNumberId,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
    });
    return {
      total: result.total,
      page,
      limit,
      data: result.data.map(toCallResponse),
    };
  }

  async getById(context: TenantContext, callId: string) {
    const call = await this.calls.findById(context.organizationId, callId);
    if (!call) {
      throw new NotFoundException("Call not found.");
    }
    return toCallResponse(call);
  }

  async stats(context: TenantContext) {
    const stats = await this.calls.stats(context.organizationId);
    return {
      totalCalls: stats.totalCalls,
      todayCalls: stats.todayCalls,
      failedCalls: stats.failedCalls,
      recentCalls: stats.recentCalls.map(toCallResponse),
    };
  }
}

export function toCallResponse(call: {
  id: string;
  organizationId: string;
  agentId: string;
  phoneNumberId: string;
  twilioCallSid: string;
  callerNumber: string;
  calledNumber: string;
  direction: string;
  status: string;
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number | null;
  metadata: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  agent: { id: string; name: string; status: string };
  phoneNumber: { id: string; phoneNumber: string; friendlyName: string | null };
}) {
  return {
    id: call.id,
    organizationId: call.organizationId,
    agentId: call.agentId,
    phoneNumberId: call.phoneNumberId,
    agent: call.agent,
    phoneNumber: call.phoneNumber,
    twilioCallSid: call.twilioCallSid,
    callerNumber: call.callerNumber,
    calledNumber: call.calledNumber,
    direction: call.direction,
    status: call.status,
    startedAt: call.startedAt,
    endedAt: call.endedAt,
    durationSeconds: call.durationSeconds,
    metadata: call.metadata,
    createdAt: call.createdAt,
    updatedAt: call.updatedAt,
  };
}

function normalizeOptionalText(value?: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
