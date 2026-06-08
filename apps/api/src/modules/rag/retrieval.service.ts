import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OpenAIEmbeddingProvider } from "../embedding/providers/openai-embedding.provider";
import { SimilarityService } from "./similarity.service";
import { RagRepository } from "./repositories/rag.repository";

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
    private readonly similarity: SimilarityService,
    private readonly config: ConfigService,
  ) {}

  async search(input: {
    organizationId: string;
    knowledgeBaseIds: string[];
    query: string;
    topK?: number;
  }): Promise<RagRetrievedChunk[]> {
    const queryEmbedding = await this.embeddingProvider.generate({ texts: [input.query] });
    const vector = queryEmbedding.vectors[0] ?? [];
    const topK = input.topK ?? this.config.get<number>("rag.topK") ?? 5;
    const threshold = this.config.get<number>("rag.similarityThreshold") ?? 0.2;
    const embeddings = await this.repository.findEmbeddings(
      input.organizationId,
      input.knowledgeBaseIds,
    );

    return embeddings
      .map((embedding) => ({
        embedding,
        score: this.similarity.cosineSimilarity(vector, embedding.embeddingVector),
      }))
      .filter((candidate) => candidate.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ embedding, score }) => {
        const chunk = embedding.chunk;
        const source = resolveSource(chunk);
        return {
          chunkId: chunk.id,
          knowledgeBaseId: chunk.knowledgeBaseId,
          knowledgeBaseName: chunk.knowledgeBase.name,
          sourceId: source.id,
          sourceType: source.type,
          sourceName: source.name,
          chunkIndex: chunk.chunkIndex,
          chunkText: chunk.chunkText,
          tokenCount: chunk.tokenCount,
          relevanceScore: score,
        };
      });
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

function resolveSource(chunk: {
  document?: { id: string; name: string; originalFileName: string | null } | null;
  websiteSource?: { id: string; title: string | null; url: string } | null;
  faqEntry?: { id: string; question: string } | null;
}): { id: string; type: RagSourceType; name: string } {
  if (chunk.document) {
    return {
      id: chunk.document.id,
      type: "document",
      name: chunk.document.name || chunk.document.originalFileName || "Document",
    };
  }

  if (chunk.websiteSource) {
    return {
      id: chunk.websiteSource.id,
      type: "website",
      name: chunk.websiteSource.title || chunk.websiteSource.url,
    };
  }

  if (chunk.faqEntry) {
    return { id: chunk.faqEntry.id, type: "faq", name: chunk.faqEntry.question };
  }

  return { id: "unknown", type: "document", name: "Unknown source" };
}
