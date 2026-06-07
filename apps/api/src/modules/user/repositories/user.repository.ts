import { Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";
import type { Prisma } from "../../../../generated/prisma";
import { PrismaService } from "../../../database/prisma.service";

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });
  }

  findById(userId: string) {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      include: {
        memberships: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });
  }

  createWithDefaultOrganization(input: {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const organizationName = `${input.firstName}'s Workspace`;
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug: `${slugify(organizationName)}-${cryptoRandomSuffix()}`,
        },
      });

      const user = await tx.user.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          passwordHash: input.passwordHash,
          status: "ACTIVE",
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: "OWNER",
        },
      });

      return { user, organization };
    });
  }

  updatePassword(userId: string, passwordHash: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;

    return client.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "workspace"
  );
}

function cryptoRandomSuffix(): string {
  return randomBytes(4).toString("hex");
}
