import { Injectable } from "@nestjs/common";
import type { MemberRole } from "@ai-agent-platform/types";
import type { Prisma } from "../../../../generated/prisma";
import { PrismaService } from "../../../database/prisma.service";

@Injectable()
export class OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCurrent(organizationId: string) {
    return this.prisma.organization.findFirst({
      where: {
        id: organizationId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            members: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });
  }

  updateCurrent(organizationId: string, name: string) {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data: { name },
    });
  }

  listMembers(organizationId: string) {
    return this.prisma.organizationMember.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      include: {
        user: true,
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    });
  }

  findMember(organizationId: string, memberId: string) {
    return this.prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId,
        deletedAt: null,
      },
      include: {
        user: true,
      },
    });
  }

  countOwners(organizationId: string) {
    return this.prisma.organizationMember.count({
      where: {
        organizationId,
        role: "OWNER",
        deletedAt: null,
      },
    });
  }

  async createInvitation(input: {
    organizationId: string;
    email: string;
    role: MemberRole;
    invitedById: string;
  }) {
    return this.prisma.organizationInvitation.upsert({
      where: {
        organizationId_email: {
          organizationId: input.organizationId,
          email: input.email,
        },
      },
      update: {
        role: input.role,
        invitedById: input.invitedById,
        acceptedAt: null,
        expiresAt: invitationExpiry(),
      },
      create: {
        organizationId: input.organizationId,
        email: input.email,
        role: input.role,
        invitedById: input.invitedById,
        expiresAt: invitationExpiry(),
      },
    });
  }

  updateMemberRole(organizationId: string, memberId: string, role: MemberRole) {
    return this.prisma.organizationMember.updateMany({
      where: {
        id: memberId,
        organizationId,
        deletedAt: null,
      },
      data: { role },
    });
  }

  removeMember(organizationId: string, memberId: string) {
    return this.prisma.organizationMember.updateMany({
      where: {
        id: memberId,
        organizationId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
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
    return this.prisma.auditEvent.create({
      data: input,
    });
  }
}

function invitationExpiry(): Date {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}
