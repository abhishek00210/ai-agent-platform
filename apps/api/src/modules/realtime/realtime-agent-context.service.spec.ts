import { NotFoundException } from "@nestjs/common";
import { mapRealtimeVoice, RealtimeAgentContextService } from "./realtime-agent-context.service";

describe("RealtimeAgentContextService", () => {
  const sessions = {
    findCallSessionByStreamSid: jest.fn(),
  };
  const memory = {
    getPromptMemory: jest.fn(),
  };
  const service = new RealtimeAgentContextService(sessions as never, memory as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads tenant-scoped active agent context from the call session", async () => {
    sessions.findCallSessionByStreamSid.mockResolvedValue({
      id: "call-session-1",
      callId: "call-1",
      organizationId: "org-1",
      call: {
        organizationId: "org-1",
        agent: {
          id: "agent-1",
          name: "Reception",
          systemPrompt: "Be helpful.",
          language: "en-US",
          voice: "nova",
          status: "ACTIVE",
          deletedAt: null,
          knowledgeBases: [{ id: "kb-1" }],
        },
      },
    });

    await expect(service.load("MZ123")).resolves.toEqual(
      expect.objectContaining({
        organizationId: "org-1",
        callId: "call-1",
        agentId: "agent-1",
        voice: "coral",
        knowledgeBaseIds: ["kb-1"],
      }),
    );
  });

  it("rejects inactive agents and orphaned streams", async () => {
    sessions.findCallSessionByStreamSid.mockResolvedValue({
      organizationId: "org-1",
      call: {
        organizationId: "org-1",
        agent: { status: "INACTIVE", deletedAt: null },
      },
    });

    await expect(service.load("MZ123")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("maps legacy agent voices to supported realtime voices", () => {
    expect(mapRealtimeVoice("fable")).toBe("verse");
    expect(mapRealtimeVoice("onyx")).toBe("cedar");
    expect(mapRealtimeVoice("nova")).toBe("coral");
    expect(mapRealtimeVoice("unsupported")).toBe("alloy");
  });
});
