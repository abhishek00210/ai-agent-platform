import { Injectable } from "@nestjs/common";
import type { PhoneNumberStatus, Prisma } from "../../../../generated/prisma";
import { PrismaService } from "../../../database/prisma.service";

export interface PhoneNumberListOptions {
  organizationId: string;
  page: number;
  limit: number;
  search?: string;
  status?: PhoneNumberStatus;
  agentId?: string;
}

export interface SyncedPhoneNumberInput {
  organizationId: string;
  phoneNumber: string;
  friendlyName?: string | null;
  country?: string | null;
  capabilities: Prisma.InputJsonValue;
  twilioSid?: string | null;
  voiceWebhookUrl?: string | null;
  smsWebhookUrl?: string | null;
}

@Injectable()
export class PhoneNumberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(options: PhoneNumberListOptions) {
    const where = this.buildScopedWhere(options);
    const skip = (options.page - 1) * options.limit;
    const [total, data] = await Promise.all([
      this.prisma.phoneNumber.count({ where }),
      this.prisma.phoneNumber.findMany({
        where,
        include: this.defaultInclude(),
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: options.limit,
      }),
    ]);

    return { total, data };
  }

  findById(organizationId: string, phoneNumberId: string) {
    return this.prisma.phoneNumber.findFirst({
      where: { id: phoneNumberId, organizationId, deletedAt: null },
      include: this.defaultInclude(),
    });
  }

  async stats(organizationId: string) {
    const where: Prisma.PhoneNumberWhereInput = { organizationId, deletedAt: null };
    const [totalNumbers, assignedNumbers, unassignedNumbers, activeNumbers] = await Promise.all([
      this.prisma.phoneNumber.count({ where }),
      this.prisma.phoneNumber.count({ where: { ...where, agentId: { not: null } } }),
      this.prisma.phoneNumber.count({ where: { ...where, status: "UNASSIGNED" } }),
      this.prisma.phoneNumber.count({ where: { ...where, status: "ACTIVE" } }),
    ]);
    return { totalNumbers, assignedNumbers, unassignedNumbers, activeNumbers };
  }

  agentExists(organizationId: string, agentId: string) {
    return this.prisma.agent.findFirst({
      where: { id: agentId, organizationId, status: "ACTIVE", deletedAt: null },
      select: { id: true, name: true, status: true, language: true },
    });
  }

  findByPhoneNumber(phoneNumber: string) {
    return this.prisma.phoneNumber.findUnique({
      where: { phoneNumber },
      select: { id: true, organizationId: true, deletedAt: true },
    });
  }

  findRoutableByPhoneNumber(phoneNumber: string) {
    return this.prisma.phoneNumber.findFirst({
      where: {
        phoneNumber,
        status: "ACTIVE",
        deletedAt: null,
        agentId: { not: null },
        agent: {
          status: "ACTIVE",
          deletedAt: null,
        },
      },
      include: this.defaultInclude(),
    });
  }

  upsertFromProvider(input: SyncedPhoneNumberInput) {
    return this.prisma.phoneNumber.upsert({
      where: {
        phoneNumber: input.phoneNumber,
      },
      create: {
        ...input,
        provider: "TWILIO",
        status: "UNASSIGNED",
      },
      update: {
        friendlyName: input.friendlyName,
        country: input.country,
        capabilities: input.capabilities,
        twilioSid: input.twilioSid,
        voiceWebhookUrl: input.voiceWebhookUrl,
        smsWebhookUrl: input.smsWebhookUrl,
        deletedAt: null,
      },
      include: this.defaultInclude(),
    });
  }

  assignAgent(organizationId: string, phoneNumberId: string, agentId: string) {
    return this.prisma.phoneNumber.updateMany({
      where: { id: phoneNumberId, organizationId, deletedAt: null },
      data: { agentId, status: "ACTIVE" },
    });
  }

  unassignAgent(organizationId: string, phoneNumberId: string) {
    return this.prisma.phoneNumber.updateMany({
      where: { id: phoneNumberId, organizationId, deletedAt: null },
      data: { agentId: null, status: "UNASSIGNED" },
    });
  }

  updateStatus(organizationId: string, phoneNumberId: string, status: PhoneNumberStatus) {
    return this.prisma.phoneNumber.updateMany({
      where: { id: phoneNumberId, organizationId, deletedAt: null },
      data: {
        status,
        ...(status === "INACTIVE" ? { voiceWebhookUrl: null, smsWebhookUrl: null } : {}),
      },
    });
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

  private buildScopedWhere(options: PhoneNumberListOptions): Prisma.PhoneNumberWhereInput {
    return {
      organizationId: options.organizationId,
      deletedAt: null,
      ...(options.status ? { status: options.status } : {}),
      ...(options.agentId ? { agentId: options.agentId } : {}),
      ...(options.search
        ? {
            OR: [
              { phoneNumber: { contains: options.search, mode: "insensitive" } },
              { friendlyName: { contains: options.search, mode: "insensitive" } },
              { country: { contains: options.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
  }

  private defaultInclude() {
    return {
      agent: {
        select: {
          id: true,
          name: true,
          status: true,
          language: true,
        },
      },
    } satisfies Prisma.PhoneNumberInclude;
  }
}
