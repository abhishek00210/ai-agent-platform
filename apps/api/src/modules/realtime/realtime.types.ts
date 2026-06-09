export type RealtimeVoice = "alloy" | "echo" | "shimmer" | "verse" | "cedar" | "coral";

export interface RealtimeAgentContext {
  organizationId: string;
  callId: string;
  callSessionId: string;
  agentId: string;
  agentName: string;
  systemPrompt: string;
  language: string;
  voice: RealtimeVoice;
  knowledgeBaseIds: string[];
}

export interface RealtimeConnection {
  realtimeSessionId: string;
  streamSid: string;
  callSid: string;
  conversationId: string;
  context: RealtimeAgentContext;
  sendToTwilio: (event: Record<string, unknown>) => boolean;
  closeTwilio: () => void;
}

export interface OpenAiRealtimeEvent {
  type: string;
  session?: { id?: string };
  delta?: string;
  transcript?: string;
  response?: {
    id?: string;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      total_tokens?: number;
    };
  };
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
}
