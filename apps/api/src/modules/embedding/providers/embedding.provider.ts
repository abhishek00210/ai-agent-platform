export interface GenerateEmbeddingsInput {
  texts: string[];
  user?: string;
}

export interface GenerateEmbeddingsResult {
  model: string;
  dimensions: number;
  vectors: number[][];
}

export interface EmbeddingProvider {
  generate(input: GenerateEmbeddingsInput): Promise<GenerateEmbeddingsResult>;
}
