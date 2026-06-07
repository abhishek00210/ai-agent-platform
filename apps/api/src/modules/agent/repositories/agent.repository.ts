import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../database/prisma.service";

@Injectable()
export class AgentRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByOrganization(organizationId: string) {
    return this.prisma.agent.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
