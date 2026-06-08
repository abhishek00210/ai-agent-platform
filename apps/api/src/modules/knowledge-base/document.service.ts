import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma, ProcessingStatus, UploadStatus } from "../../../generated/prisma";
import type { TenantContext } from "../tenant/tenant.service";
import type {
  CreateDocumentDto,
  ListDocumentsQueryDto,
  UpdateDocumentDto,
} from "./dto/document.dto";
import { DocumentRepository } from "./repositories/document.repository";

@Injectable()
export class DocumentService {
  constructor(private readonly documents: DocumentRepository) {}

  async create(context: TenantContext, input: CreateDocumentDto) {
    await this.assertKnowledgeBaseBelongsToTenant(context.organizationId, input.knowledgeBaseId);

    const document = await this.documents.create({
      organizationId: context.organizationId,
      knowledgeBaseId: input.knowledgeBaseId,
      name: input.name.trim(),
      description: normalizeOptionalText(input.description),
      uploadStatus: "PENDING",
      processingStatus: "PENDING",
    });

    await this.audit(context, "document.created", document.id, {
      name: document.name,
      knowledgeBaseId: document.knowledgeBaseId,
    });

    return this.toResponse(document);
  }

  async list(context: TenantContext, query: ListDocumentsQueryDto) {
    if (query.knowledgeBaseId) {
      await this.assertKnowledgeBaseBelongsToTenant(context.organizationId, query.knowledgeBaseId);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const result = await this.documents.list({
      organizationId: context.organizationId,
      page,
      limit,
      knowledgeBaseId: query.knowledgeBaseId,
      search: normalizeOptionalText(query.search) ?? undefined,
      uploadStatus: query.uploadStatus as UploadStatus | undefined,
      processingStatus: query.processingStatus as ProcessingStatus | undefined,
    });

    return {
      total: result.total,
      page,
      limit,
      data: result.data.map((document) => this.toResponse(document)),
    };
  }

  async getById(context: TenantContext, documentId: string) {
    const document = await this.getScopedDocument(context.organizationId, documentId);
    return this.toResponse(document);
  }

  async update(context: TenantContext, documentId: string, input: UpdateDocumentDto) {
    const existing = await this.getScopedDocument(context.organizationId, documentId);

    await this.documents.update(context.organizationId, documentId, {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined
        ? { description: normalizeOptionalText(input.description) }
        : {}),
      ...(input.uploadStatus !== undefined
        ? { uploadStatus: input.uploadStatus as UploadStatus }
        : {}),
      ...(input.processingStatus !== undefined
        ? { processingStatus: input.processingStatus as ProcessingStatus }
        : {}),
    });
    const document = await this.getScopedDocument(context.organizationId, documentId);

    await this.audit(context, "document.updated", document.id, {
      before: {
        name: existing.name,
        uploadStatus: existing.uploadStatus,
        processingStatus: existing.processingStatus,
      },
      after: {
        name: document.name,
        uploadStatus: document.uploadStatus,
        processingStatus: document.processingStatus,
      },
    });

    return this.toResponse(document);
  }

  async delete(context: TenantContext, documentId: string) {
    const document = await this.getScopedDocument(context.organizationId, documentId);
    await this.documents.softDelete(context.organizationId, documentId);
    await this.audit(context, "document.deleted", document.id, {
      name: document.name,
      knowledgeBaseId: document.knowledgeBaseId,
    });

    return { success: true };
  }

  private async getScopedDocument(organizationId: string, documentId: string) {
    const document = await this.documents.findById(organizationId, documentId);

    if (!document) {
      throw new NotFoundException("Document not found.");
    }

    return document;
  }

  private async assertKnowledgeBaseBelongsToTenant(
    organizationId: string,
    knowledgeBaseId: string,
  ) {
    const knowledgeBase = await this.documents.knowledgeBaseExists(organizationId, knowledgeBaseId);

    if (!knowledgeBase) {
      throw new NotFoundException("Knowledge base not found.");
    }
  }

  private toResponse(document: {
    id: string;
    organizationId: string;
    knowledgeBaseId: string;
    name: string;
    description: string | null;
    fileName: string | null;
    fileType: string | null;
    fileSize: number | null;
    storagePath: string | null;
    uploadStatus: UploadStatus;
    processingStatus: ProcessingStatus;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    knowledgeBase?: { id: string; name: string };
  }) {
    return {
      id: document.id,
      organizationId: document.organizationId,
      knowledgeBaseId: document.knowledgeBaseId,
      knowledgeBase: document.knowledgeBase,
      name: document.name,
      description: document.description,
      fileName: document.fileName,
      fileType: document.fileType,
      fileSize: document.fileSize,
      storagePath: document.storagePath,
      uploadStatus: document.uploadStatus,
      processingStatus: document.processingStatus,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }

  private audit(
    context: TenantContext,
    action: string,
    entityId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.documents.createAuditEvent({
      organizationId: context.organizationId,
      actorUserId: context.userId,
      action,
      entityType: "Document",
      entityId,
      metadata,
    });
  }
}

function normalizeOptionalText(value?: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
