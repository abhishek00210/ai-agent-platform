import { RealtimeEventProcessor } from "./realtime-event-processor";

describe("RealtimeEventProcessor", () => {
  const config = {
    get: jest.fn().mockReturnValue("gpt-realtime"),
  };
  const connections = {
    send: jest.fn(),
    close: jest.fn(),
  };
  const audioBridge = {
    forwardOpenAiAudio: jest.fn(),
  };
  const sessions = {
    connected: jest.fn(),
    failed: jest.fn(),
    recordLatency: jest.fn(),
  };
  const conversations = {
    storeUserTranscript: jest.fn(),
    storeAssistantTranscript: jest.fn(),
  };
  const retrieval = {
    search: jest.fn(),
  };
  const processor = new RealtimeEventProcessor(
    config as never,
    connections as never,
    audioBridge as never,
    sessions as never,
    conversations as never,
    retrieval as never,
  );
  const connection = {
    realtimeSessionId: "realtime-1",
    streamSid: "MZ123",
    callSid: "CA123",
    conversationId: "conversation-1",
    context: {
      organizationId: "org-1",
      callId: "call-1",
      callSessionId: "call-session-1",
      agentId: "agent-1",
      agentName: "Reception",
      systemPrompt: "Be helpful.",
      language: "en-US",
      voice: "alloy" as const,
      knowledgeBaseIds: ["kb-1"],
    },
    sendToTwilio: jest.fn().mockReturnValue(true),
    closeTwilio: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    processor.clear(connection.streamSid);
  });

  it("stores caller transcripts, injects tenant-scoped RAG context, and requests a response", async () => {
    retrieval.search.mockResolvedValue([
      {
        chunkId: "chunk-1",
        chunkText: "Office hours are 9 to 5.",
        sourceId: "document-1",
        sourceType: "PDF",
        sourceName: "Hours.pdf",
        relevanceScore: 0.91,
        knowledgeBaseId: "kb-1",
      },
    ]);

    await processor.process(connection, {
      type: "conversation.item.input_audio_transcription.completed",
      transcript: "When are you open?",
    });

    expect(retrieval.search).toHaveBeenCalledWith({
      organizationId: "org-1",
      knowledgeBaseIds: ["kb-1"],
      query: "When are you open?",
    });
    expect(connections.send).toHaveBeenCalledWith(
      "MZ123",
      expect.objectContaining({ type: "conversation.item.create" }),
    );
    expect(connections.send).toHaveBeenCalledWith("MZ123", {
      type: "response.create",
      response: { output_modalities: ["audio"] },
    });
  });

  it("continues response generation when retrieval returns no results", async () => {
    retrieval.search.mockResolvedValue([]);

    await processor.process(connection, {
      type: "conversation.item.input_audio_transcription.completed",
      transcript: "Hello",
    });

    expect(connections.send).toHaveBeenCalledTimes(1);
    expect(connections.send).toHaveBeenCalledWith("MZ123", {
      type: "response.create",
      response: { output_modalities: ["audio"] },
    });
  });

  it("clears buffered Twilio audio when the caller interrupts", async () => {
    await processor.process(connection, { type: "input_audio_buffer.speech_started" });

    expect(connection.sendToTwilio).toHaveBeenCalledWith({
      event: "clear",
      streamSid: "MZ123",
    });
  });
});
