import { Injectable } from "@nestjs/common";
import type { Prisma, ProcessingStatus, UploadStatus } from "../../../../generated/prisma";
import { PrismaService } from "../../../database/prisma.service";

export interface DocumentListOptions {
  organizationId: string;
  page: number;
  limit: number;
  knowledgeBaseId?: string;
  search?: string;
  uploadStatus?: UploadStatus;
  processingStatus?: ProcessingStatus;
}

export interface DocumentWriteInput {
  organizationId: string;
  knowledgeBaseId: string;
  name: string;
  description?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  storagePath?: string | null;
  uploadStatus?: UploadStatus;
  processingStatus?: ProcessingStatus;
}

@Injectable()
export class DocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(options: DocumentListOptions) {
    const where = this.buildScopedWhere(options);
    const skip = (options.page - 1) * options.limit;

    const [total, data] = await Promise.all([
      this.prisma.document.count({ where }),
      this.prisma.document.findMany({
        where,
        include: this.defaultInclude(),
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: options.limit,
      }),
    ]);

    return { total, data };
  }

  findById(organizationId: string, documentId: string) {
    return this.prisma.document.findFirst({
      where: {
        id: documentId,
        organizationId,
        deletedAt: null,
      },
      include: this.defaultInclude(),
    });
  }

  create(input: DocumentWriteInput) {
    return this.prisma.document.create({
      data: input,
      include: this.defaultInclude(),
    });
  }

  update(
    organizationId: string,
    documentId: string,
    input: Partial<Omit<DocumentWriteInput, "organizationId" | "knowledgeBaseId">>,
  ) {
    return this.prisma.document.updateMany({
      where: {
        id: documentId,
        organizationId,
        deletedAt: null,
      },
      data: input,
    });
  }

  softDelete(organizationId: string, documentId: string) {
    return this.prisma.document.updateMany({
      where: {
        id: documentId,
        organizationId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        uploadStatus: "FAILED",
        processingStatus: "FAILED",
      },
    });
  }

  knowledgeBaseExists(organizationId: string, knowledgeBaseId: string) {
    return this.prisma.knowledgeBase.findFirst({
      where: {
        id: knowledgeBaseId,
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
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

  private buildScopedWhere(options: DocumentListOptions): Prisma.DocumentWhereInput {
    return {
      organizationId: options.organizationId,
      deletedAt: null,
      ...(options.knowledgeBaseId ? { knowledgeBaseId: options.knowledgeBaseId } : {}),
      ...(options.uploadStatus ? { uploadStatus: options.uploadStatus } : {}),
      ...(options.processingStatus ? { processingStatus: options.processingStatus } : {}),
      ...(options.search
        ? {
            OR: [
              { name: { contains: options.search, mode: "insensitive" } },
              { description: { contains: options.search, mode: "insensitive" } },
              { fileName: { contains: options.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
  }

  private defaultInclude() {
    return {
      knowledgeBase: {
        select: {
          id: true,
          name: true,
        },
      },
    } satisfies Prisma.DocumentInclude;
  }
}
