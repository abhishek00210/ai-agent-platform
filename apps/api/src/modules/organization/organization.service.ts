import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { MemberRole } from "@ai-agent-platform/types";
import type { Prisma } from "../../../generated/prisma";
import type { TenantContext } from "../tenant/tenant.service";
import { OrganizationRepository } from "./repositories/organization.repository";
import type {
  InviteMemberDto,
  UpdateMemberRoleDto,
  UpdateOrganizationDto,
} from "./dto/organization.dto";

@Injectable()
export class OrganizationService {
  constructor(private readonly organizations: OrganizationRepository) {}

  async getCurrent(context: TenantContext) {
    const organization = await this.organizations.findCurrent(context.organizationId);

    if (!organization) {
      throw new NotFoundException("Organization not found.");
    }

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      plan: organization.plan,
      status: organization.status,
      memberCount: organization._count.members,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }

  async updateCurrent(context: TenantContext, input: UpdateOrganizationDto) {
    this.assertCanManageOrganization(context.role);
    const organization = await this.organizations.updateCurrent(
      context.organizationId,
      input.name.trim(),
    );
    await this.audit(context, "organization.updated", "Organization", organization.id, {
      name: organization.name,
    });
    return organization;
  }

  async listMembers(context: TenantContext) {
    const members = await this.organizations.listMembers(context.organizationId);

    return members.map((member) => ({
      id: member.id,
      role: member.role,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
      user: {
        id: member.user.id,
        email: member.user.email,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        status: member.user.status,
      },
    }));
  }

  async inviteMember(context: TenantContext, input: InviteMemberDto) {
    this.assertCanManageMembers(context.role);

    if (input.role === "OWNER") {
      this.assertOwner(context.role);
    }

    const invitation = await this.organizations.createInvitation({
      organizationId: context.organizationId,
      email: input.email.trim().toLowerCase(),
      role: input.role,
      invitedById: context.userId,
    });

    await this.audit(context, "member.invited", "OrganizationInvitation", invitation.id, {
      email: invitation.email,
      role: invitation.role,
    });

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    };
  }

  async updateMemberRole(context: TenantContext, memberId: string, input: UpdateMemberRoleDto) {
    this.assertCanManageMembers(context.role);
    const member = await this.getScopedMember(context.organizationId, memberId);

    if (input.role === "OWNER") {
      this.assertOwner(context.role);
    }

    if (member.role === "OWNER" && input.role !== "OWNER") {
      await this.assertNotLastOwner(context.organizationId);
    }

    await this.organizations.updateMemberRole(context.organizationId, memberId, input.role);
    await this.audit(context, "member.role_changed", "OrganizationMember", memberId, {
      from: member.role,
      to: input.role,
    });

    return this.getScopedMember(context.organizationId, memberId);
  }

  async removeMember(context: TenantContext, memberId: string) {
    this.assertCanManageMembers(context.role);
    const member = await this.getScopedMember(context.organizationId, memberId);

    if (member.role === "OWNER") {
      throw new BadRequestException("Organization owners cannot be removed.");
    }

    await this.organizations.removeMember(context.organizationId, memberId);
    await this.audit(context, "member.removed", "OrganizationMember", memberId, {
      email: member.user.email,
      role: member.role,
    });

    return { success: true };
  }

  private async getScopedMember(organizationId: string, memberId: string) {
    const member = await this.organizations.findMember(organizationId, memberId);

    if (!member) {
      throw new NotFoundException("Organization member not found.");
    }

    return member;
  }

  private assertCanManageOrganization(role: MemberRole) {
    if (role !== "OWNER" && role !== "ADMIN") {
      throw new ForbiddenException("You do not have permission to manage this organization.");
    }
  }

  private assertCanManageMembers(role: MemberRole) {
    if (role !== "OWNER" && role !== "ADMIN") {
      throw new ForbiddenException("You do not have permission to manage members.");
    }
  }

  private assertOwner(role: MemberRole) {
    if (role !== "OWNER") {
      throw new ForbiddenException("Only organization owners can assign owner role.");
    }
  }

  private async assertNotLastOwner(organizationId: string) {
    const ownerCount = await this.organizations.countOwners(organizationId);

    if (ownerCount <= 1) {
      throw new BadRequestException("The last organization owner cannot be demoted.");
    }
  }

  private audit(
    context: TenantContext,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.organizations.createAuditEvent({
      organizationId: context.organizationId,
      actorUserId: context.userId,
      action,
      entityType,
      entityId,
      metadata,
    });
  }
}
