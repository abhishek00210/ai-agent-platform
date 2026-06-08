import { Injectable } from "@nestjs/common";
import type { CallStatus, Prisma } from "../../../../generated/prisma";
import { PrismaService } from "../../../database/prisma.service";

export interface CallListOptions {
  organizationId: string;
  page: number;
  limit: number;
  search?: string;
  status?: CallStatus;
  agentId?: string;
  phoneNumberId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

@Injectable()
export class CallRepository {
  constructor(private readonly prisma: PrismaService) {}

  createInbound(input: {
    organizationId: string;
    agentId: string;
    phoneNumberId: string;
    twilioCallSid: string;
    callerNumber: string;
    calledNumber: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.call.upsert({
      where: { twilioCallSid: input.twilioCallSid },
      create: {
        ...input,
        direction: "INBOUND",
        status: "RINGING",
      },
      update: {
        metadata: input.metadata,
      },
      include: this.defaultInclude(),
    });
  }

  updateStatus(organizationId: string, callId: string, status: CallStatus) {
    return this.prisma.call.updateMany({
      where: { id: callId, organizationId },
      data: { status },
    });
  }

  async list(options: CallListOptions) {
    const where = this.buildScopedWhere(options);
    const skip = (options.page - 1) * options.limit;
    const [total, data] = await Promise.all([
      this.prisma.call.count({ where }),
      this.prisma.call.findMany({
        where,
        include: this.defaultInclude(),
        orderBy: { startedAt: "desc" },
        skip,
        take: options.limit,
      }),
    ]);
    return { total, data };
  }

  findById(organizationId: string, callId: string) {
    return this.prisma.call.findFirst({
      where: { id: callId, organizationId },
      include: this.defaultInclude(),
    });
  }

  async stats(organizationId: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const where: Prisma.CallWhereInput = { organizationId };
    const [totalCalls, todayCalls, failedCalls, recentCalls] = await Promise.all([
      this.prisma.call.count({ where }),
      this.prisma.call.count({ where: { ...where, startedAt: { gte: startOfToday } } }),
      this.prisma.call.count({ where: { ...where, status: "FAILED" } }),
      this.prisma.call.findMany({
        where,
        include: this.defaultInclude(),
        orderBy: { startedAt: "desc" },
        take: 5,
      }),
    ]);
    return { totalCalls, todayCalls, failedCalls, recentCalls };
  }

  createAuditEvent(input: {
    organizationId: string;
    actorUserId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.auditEvent.create({ data: input });
  }

  private buildScopedWhere(options: CallListOptions): Prisma.CallWhereInput {
    return {
      organizationId: options.organizationId,
      ...(options.status ? { status: options.status } : {}),
      ...(options.agentId ? { agentId: options.agentId } : {}),
      ...(options.phoneNumberId ? { phoneNumberId: options.phoneNumberId } : {}),
      ...(options.dateFrom || options.dateTo
        ? {
            startedAt: {
              ...(options.dateFrom ? { gte: options.dateFrom } : {}),
              ...(options.dateTo ? { lte: options.dateTo } : {}),
            },
          }
        : {}),
      ...(options.search
        ? {
            OR: [
              { callerNumber: { contains: options.search, mode: "insensitive" } },
              { calledNumber: { contains: options.search, mode: "insensitive" } },
              { twilioCallSid: { contains: options.search, mode: "insensitive" } },
              { agent: { name: { contains: options.search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };
  }

  private defaultInclude() {
    return {
      agent: { select: { id: true, name: true, status: true } },
      phoneNumber: { select: { id: true, phoneNumber: true, friendlyName: true } },
    } satisfies Prisma.CallInclude;
  }
}
