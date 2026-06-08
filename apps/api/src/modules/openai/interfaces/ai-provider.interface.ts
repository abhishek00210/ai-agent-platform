export interface AiMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GenerateResponseInput {
  instructions: string;
  messages: AiMessage[];
  user?: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface GenerateResponseResult {
  content: string;
  model: string;
  tokenUsage: TokenUsage;
  raw: unknown;
}

export interface AiProvider {
  generateResponse(input: GenerateResponseInput): Promise<GenerateResponseResult>;
  generateEmbedding(input: { texts: string[]; user?: string }): Promise<{
    model: string;
    dimensions: number;
    vectors: number[][];
  }>;
}
