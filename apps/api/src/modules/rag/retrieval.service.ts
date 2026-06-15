import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OpenAIEmbeddingProvider } from "../embedding/providers/openai-embedding.provider";
import { RagRepository } from "./repositories/rag.repository";
import { RealtimeMetricsService } from "../../common/metrics/realtime-metrics.service";

export type RagSourceType = "document" | "website" | "faq";

export interface RagRetrievedChunk {
  chunkId: string;
  knowledgeBaseId: string;
  knowledgeBaseName: string;
  sourceId: string;
  sourceType: RagSourceType;
  sourceName: string;
  chunkIndex: number;
  chunkText: string;
  tokenCount: number;
  relevanceScore: number;
}

@Injectable()
export class RetrievalService {
  constructor(
    private readonly repository: RagRepository,
    private readonly embeddingProvider: OpenAIEmbeddingProvider,
    private readonly config: ConfigService,
    private readonly metrics: RealtimeMetricsService,
  ) {}

  async search(input: {
    organizationId: string;
    knowledgeBaseIds: string[];
    query: string;
    topK?: number;
  }): Promise<RagRetrievedChunk[]> {
    const embeddingStartedAt = this.metrics.now();
    const queryEmbedding = await this.embeddingProvider.generate({ texts: [input.query] });
    this.metrics.observe("rag_embedding_ms", embeddingStartedAt);
    const vector = queryEmbedding.vectors[0] ?? [];
    const topK = input.topK ?? this.config.get<number>("rag.topK") ?? 5;
    const threshold = this.config.get<number>("rag.similarityThreshold") ?? 0.2;
    const searchStartedAt = this.metrics.now();
    const results = await this.repository.vectorSearch({
      organizationId: input.organizationId,
      knowledgeBaseIds: input.knowledgeBaseIds,
      vector,
      topK,
      threshold,
    });
    this.metrics.observe("rag_vector_search_ms", searchStartedAt);
    return results.map((result) => ({
      ...result,
      relevanceScore: Number(result.relevanceScore),
    }));
  }

  async assertKnowledgeBase(organizationId: string, knowledgeBaseId: string) {
    const knowledgeBase = await this.repository.findKnowledgeBase(organizationId, knowledgeBaseId);
    if (!knowledgeBase) {
      throw new NotFoundException("Knowledge base not found.");
    }
    return knowledgeBase;
  }

  async assertAgent(organizationId: string, agentId: string) {
    const agent = await this.repository.findAgentWithKnowledgeBases(organizationId, agentId);
    if (!agent) {
      throw new NotFoundException("Agent not found.");
    }
    return agent;
  }
}
