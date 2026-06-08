import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import type { Prisma } from "../../../generated/prisma";
import { estimateTokenCount } from "../embedding/chunking.service";
import { ContextBuilderService } from "../rag/context-builder.service";
import { RetrievalService } from "../rag/retrieval.service";
import { SourceCitationService } from "../rag/source-citation.service";
import type { TenantContext } from "../tenant/tenant.service";
import type { SendChatMessageDto } from "./dto/chat.dto";
import { OpenAiProvider } from "./openai.provider";
import { PromptAssemblyService } from "./prompt-assembly.service";
import { ConversationContextService } from "./conversation-context.service";
import { ConversationRepository } from "../conversation/repositories/conversation.repository";
import { MessageRepository } from "../conversation/repositories/message.repository";
import { MemoryService } from "../memory/memory.service";

@Injectable()
export class ResponseGenerationService {
  constructor(
    private readonly contextService: ConversationContextService,
    private readonly retrieval: RetrievalService,
    private readonly contextBuilder: ContextBuilderService,
    private readonly citations: SourceCitationService,
    private readonly promptAssembly: PromptAssemblyService,
    private readonly provider: OpenAiProvider,
    private readonly conversations: ConversationRepository,
    private readonly messages: MessageRepository,
    private readonly memory: MemoryService,
  ) {}

  async send(context: TenantContext, input: SendChatMessageDto) {
    const startedAt = Date.now();
    const conversation = await this.contextService.load({
      organizationId: context.organizationId,
      conversationId: input.conversationId,
      agentId: input.agentId,
    });

    const userMessage = await this.messages.create({
      organizationId: context.organizationId,
      conversationId: input.conversationId,
      senderType: "USER",
      content: input.message.trim(),
      messageType: "TEXT",
      tokenCount: estimateTokenCount(input.message),
      metadata: { source: "chat_send" },
    });
    await this.conversations.touch(
      context.organizationId,
      input.conversationId,
      userMessage.createdAt,
    );
    await this.audit(context, "message.sent", userMessage.id, {
      conversationId: input.conversationId,
      agentId: input.agentId,
    });

    const knowledgeBaseIds = conversation.agent.knowledgeBases.map(
      (knowledgeBase) => knowledgeBase.id,
    );
    const retrievedChunks =
      knowledgeBaseIds.length > 0
        ? await this.retrieval.search({
            organizationId: context.organizationId,
            knowledgeBaseIds,
            query: input.message,
          })
        : [];
    const sources = this.citations.build(retrievedChunks);
    const knowledgeContext = this.contextBuilder.build(retrievedChunks);
    const promptMemory = await this.memory.getPromptMemory(context, input.conversationId);
    const response = await this.generateWithAudit(context, {
      conversationId: input.conversationId,
      agentId: input.agentId,
      instructions: this.promptAssembly.instructions({
        systemPrompt: conversation.agent.systemPrompt,
        memorySummary: promptMemory.summary,
        memoryFacts: promptMemory.facts,
        knowledgeContext,
      }),
      history: conversation.messages.map((message) => ({
        senderType: message.senderType,
        content: message.content,
      })),
      currentMessage: input.message,
    });
    const responseTime = Date.now() - startedAt;
    const assistantMessage = await this.messages.create({
      organizationId: context.organizationId,
      conversationId: input.conversationId,
      senderType: "ASSISTANT",
      content: response.content,
      messageType: "TEXT",
      tokenCount: response.tokenUsage.totalTokens || estimateTokenCount(response.content),
      metadata: {
        model: response.model,
        responseTime,
        tokenUsage: {
          promptTokens: response.tokenUsage.promptTokens,
          completionTokens: response.tokenUsage.completionTokens,
          totalTokens: response.tokenUsage.totalTokens,
        },
        sources: sources.map((source) => ({
          sourceId: source.sourceId,
          sourceType: source.sourceType,
          sourceName: source.sourceName,
          relevanceScore: source.relevanceScore,
          chunkReference: source.chunkReference,
          knowledgeBaseId: source.knowledgeBaseId,
          documentId: source.documentId,
          websiteSourceId: source.websiteSourceId,
          faqEntryId: source.faqEntryId,
        })),
        retrievalCount: retrievedChunks.length,
        knowledgeBaseIds,
      } satisfies Prisma.InputJsonObject,
    });
    await this.conversations.touch(
      context.organizationId,
      input.conversationId,
      assistantMessage.createdAt,
    );
    await this.audit(context, "ai.response_generated", assistantMessage.id, {
      conversationId: input.conversationId,
      agentId: input.agentId,
      model: response.model,
      retrievalCount: retrievedChunks.length,
      responseTime,
    });
    await this.memory.maybeEnqueueRefresh(context, input.conversationId);

    return {
      userMessage: toMessageResponse(userMessage),
      assistantMessage: toMessageResponse(assistantMessage),
      sources,
      tokenUsage: response.tokenUsage,
      responseTime,
      model: response.model,
      metadata: {
        retrievalCount: retrievedChunks.length,
        knowledgeBaseIds,
      },
    };
  }

  private audit(
    context: TenantContext,
    action: string,
    entityId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.conversations.createAuditEvent({
      organizationId: context.organizationId,
      actorUserId: context.userId,
      action,
      entityType: "Message",
      entityId,
      metadata,
    });
  }

  private async generateWithAudit(
    context: TenantContext,
    input: {
      conversationId: string;
      agentId: string;
      instructions: string;
      history: Array<{ senderType: string; content: string }>;
      currentMessage: string;
    },
  ) {
    try {
      return await this.provider.generateResponse({
        instructions: input.instructions,
        messages: this.promptAssembly.messages({
          history: input.history,
          currentMessage: input.currentMessage,
        }),
        user: context.userId,
      });
    } catch (error) {
      await this.audit(context, "openai.failure", input.conversationId, {
        conversationId: input.conversationId,
        agentId: input.agentId,
        message: error instanceof Error ? error.message : "OpenAI response generation failed.",
      });
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new ServiceUnavailableException("AI response generation failed. Please try again.");
    }
  }
}

function toMessageResponse(message: {
  id: string;
  organizationId: string;
  conversationId: string;
  senderType: string;
  content: string;
  messageType: string;
  tokenCount: number;
  metadata: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: message.id,
    organizationId: message.organizationId,
    conversationId: message.conversationId,
    senderType: message.senderType,
    content: message.content,
    messageType: message.messageType,
    tokenCount: message.tokenCount,
    metadata: message.metadata,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}
