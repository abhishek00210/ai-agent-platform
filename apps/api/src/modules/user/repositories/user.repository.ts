import { Injectable } from "@nestjs/common";
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
      const user = await tx.user.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          passwordHash: input.passwordHash,
          status: "ACTIVE",
        },
      });

      const organization = await tx.organization.create({
        data: {
          name: `${input.firstName}'s Organization`,
          members: {
            create: {
              userId: user.id,
              role: "OWNER",
            },
          },
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
