import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";

@Injectable()
export class OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  listActive() {
    return this.prisma.organization.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }
}
