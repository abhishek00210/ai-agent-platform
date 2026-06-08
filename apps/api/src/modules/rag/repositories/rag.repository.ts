import { Injectable } from "@nestjs/common";
import type { Prisma } from "../../../../generated/prisma";
import { PrismaService } from "../../../database/prisma.service";

@Injectable()
export class RagRepository {
  constructor(private readonly prisma: PrismaService) {}

  findKnowledgeBase(organizationId: string, knowledgeBaseId: string) {
    return this.prisma.knowledgeBase.findFirst({
      where: { id: knowledgeBaseId, organizationId, deletedAt: null },
      select: { id: true, name: true },
    });
  }

  findAgentWithKnowledgeBases(organizationId: string, agentId: string) {
    return this.prisma.agent.findFirst({
      where: { id: agentId, organizationId, deletedAt: null },
      include: {
        knowledgeBases: {
          where: { organizationId, deletedAt: null },
          select: { id: true, name: true },
        },
      },
    });
  }

  findEmbeddings(organizationId: string, knowledgeBaseIds: string[]) {
    return this.prisma.knowledgeEmbedding.findMany({
      where: {
        organizationId,
        chunk: {
          organizationId,
          knowledgeBaseId: { in: knowledgeBaseIds },
          OR: [
            { document: { deletedAt: null } },
            { websiteSource: { deletedAt: null, status: "COMPLETED" } },
            { faqEntry: { status: "ACTIVE", deletedAt: null } },
          ],
        },
      },
      include: {
        chunk: {
          include: {
            knowledgeBase: { select: { id: true, name: true } },
            document: { select: { id: true, name: true, originalFileName: true } },
            websiteSource: { select: { id: true, title: true, url: true } },
            faqEntry: { select: { id: true, question: true } },
          },
        },
      },
    });
  }

  createSearchEvent(input: {
    organizationId: string;
    knowledgeBaseId?: string | null;
    agentId?: string | null;
    query: string;
    source: "search" | "ask";
    resultCount: number;
    averageScore: number;
    responseTimeMs: number;
    failed?: boolean;
    usedDocumentChunks: number;
    usedWebsiteChunks: number;
    usedFaqChunks: number;
  }) {
    return this.prisma.ragSearchEvent.create({ data: input });
  }

  async analytics(organizationId: string, knowledgeBaseId: string) {
    const where: Prisma.RagSearchEventWhereInput = {
      organizationId,
      knowledgeBaseId,
    };
    const [totalSearches, events, topQueries, usage] = await Promise.all([
      this.prisma.ragSearchEvent.count({ where }),
      this.prisma.ragSearchEvent.findMany({ where, orderBy: { createdAt: "desc" }, take: 500 }),
      this.prisma.ragSearchEvent.groupBy({
        by: ["query"],
        where,
        _count: { _all: true },
        orderBy: { _count: { query: "desc" } },
        take: 10,
      }),
      this.prisma.ragSearchEvent.aggregate({
        where,
        _sum: {
          usedDocumentChunks: true,
          usedWebsiteChunks: true,
          usedFaqChunks: true,
        },
      }),
    ]);

    const averageRetrievalTime =
      events.length > 0
        ? Math.round(events.reduce((sum, event) => sum + event.responseTimeMs, 0) / events.length)
        : 0;
    const averageSimilarityScore =
      events.length > 0
        ? events.reduce((sum, event) => sum + event.averageScore, 0) / events.length
        : 0;

    return {
      totalSearches,
      averageRetrievalTime,
      averageSimilarityScore,
      failedRetrievals: events.filter((event) => event.failed).length,
      topQueries: topQueries.map((query) => ({
        query: query.query,
        count: query._count._all,
      })),
      knowledgeUsage: {
        documentChunks: usage._sum.usedDocumentChunks ?? 0,
        websiteChunks: usage._sum.usedWebsiteChunks ?? 0,
        faqChunks: usage._sum.usedFaqChunks ?? 0,
      },
    };
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
}
