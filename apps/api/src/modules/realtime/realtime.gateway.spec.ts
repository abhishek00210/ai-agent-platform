import { RealtimeGateway } from "./realtime.gateway";

describe("RealtimeGateway reliability", () => {
  const config = {
    get: jest.fn((key: string) =>
      key === "openai.realtimeTranscriptionModel" ? "gpt-4o-mini-transcribe" : undefined,
    ),
  };
  const agentContext = {
    load: jest.fn(),
    memoryInstructions: jest.fn().mockResolvedValue(""),
  };
  const connections = {
    connect: jest.fn().mockResolvedValue(undefined),
    send: jest.fn(),
    close: jest.fn(),
  };
  const sessions = {
    create: jest.fn(),
    failed: jest.fn(),
    disconnected: jest.fn(),
  };
  const audioBridge = {
    forwardTwilioAudio: jest.fn(),
  };
  const events = {
    process: jest.fn(),
    clear: jest.fn(),
  };
  const twilio = {
    endCallWithMessage: jest.fn().mockResolvedValue(undefined),
  };
  const gateway = new RealtimeGateway(
    config as never,
    agentContext as never,
    connections as never,
    sessions as never,
    audioBridge as never,
    events as never,
    twilio as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    connections.connect.mockResolvedValue(undefined);
    agentContext.memoryInstructions.mockResolvedValue("");
  });

  it("keeps 20 concurrent calls isolated by stream", async () => {
    agentContext.load.mockImplementation(async (streamSid: string) => contextFor(streamSid));
    sessions.create.mockImplementation(async (context: ReturnType<typeof contextFor>) => ({
      session: { id: `realtime-${context.callSessionId}` },
      conversationId: `conversation-${context.callSessionId}`,
      tenant: { organizationId: context.organizationId },
    }));

    const starts = Array.from({ length: 20 }, (_, index) => {
      const streamSid = `MZ${index}`;
      return gateway.start({
        streamSid,
        callSid: `CA${index}`,
        sendToTwilio: jest.fn().mockReturnValue(true),
        closeTwilio: jest.fn(),
      });
    });
    await Promise.all(starts);

    expect(connections.connect).toHaveBeenCalledTimes(20);
    for (let index = 0; index < 20; index += 1) {
      expect(gateway.has(`MZ${index}`)).toBe(true);
      gateway.media(`MZ${index}`, `audio-${index}`);
      expect(audioBridge.forwardTwilioAudio).toHaveBeenCalledWith({
        streamSid: `MZ${index}`,
        realtimeSessionId: `realtime-call-session-MZ${index}`,
        payload: `audio-${index}`,
      });
    }

    await Promise.all(Array.from({ length: 20 }, (_, index) => gateway.stop(`MZ${index}`)));
  });

  it("delivers a graceful fallback and cleans up once after OpenAI failure", async () => {
    agentContext.load.mockResolvedValue(contextFor("MZFAIL"));
    sessions.create.mockResolvedValue({
      session: { id: "realtime-fail" },
      conversationId: "conversation-fail",
      tenant: { organizationId: "org-MZFAIL" },
    });
    let failConnection: ((reason: string) => Promise<void>) | undefined;
    connections.connect.mockImplementation(
      async (
        _streamSid: string,
        _onEvent: unknown,
        _onClose: unknown,
        onFailure: (reason: string) => Promise<void>,
      ) => {
        failConnection = onFailure;
      },
    );
    const closeTwilio = jest.fn();

    await gateway.start({
      streamSid: "MZFAIL",
      callSid: "CAFAIL",
      sendToTwilio: jest.fn().mockReturnValue(true),
      closeTwilio,
    });
    await failConnection?.("OpenAI disconnected");
    await failConnection?.("duplicate failure");

    expect(twilio.endCallWithMessage).toHaveBeenCalledWith(
      "CAFAIL",
      "We're experiencing technical difficulties. Please try again later.",
    );
    expect(sessions.failed).toHaveBeenCalledTimes(1);
    expect(sessions.failed).toHaveBeenCalledWith(
      "realtime-fail",
      expect.objectContaining({ organizationId: "org-MZFAIL" }),
      "conversation-fail",
      "OpenAI disconnected",
    );
    expect(closeTwilio).toHaveBeenCalledTimes(1);
    expect(gateway.has("MZFAIL")).toBe(false);
  });
});

function contextFor(streamSid: string) {
  return {
    organizationId: `org-${streamSid}`,
    callId: `call-${streamSid}`,
    callSessionId: `call-session-${streamSid}`,
    agentId: `agent-${streamSid}`,
    agentName: "Reception",
    systemPrompt: "Be helpful.",
    language: "en-US",
    voice: "alloy" as const,
    knowledgeBaseIds: [],
  };
}
