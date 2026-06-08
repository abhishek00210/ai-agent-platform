import { NotFoundException } from "@nestjs/common";
import { CallSessionService } from "./call-session.service";

describe("CallSessionService", () => {
  const repository = {
    findCallByTwilioSid: jest.fn(),
    upsertStarted: jest.fn(),
    incrementPacket: jest.fn(),
    updateStatus: jest.fn(),
    stats: jest.fn(),
    findByCallId: jest.fn(),
    createAuditEvent: jest.fn(),
  };
  const service = new CallSessionService(repository as never);

  beforeEach(() => {
    jest.clearAllMocks();
    repository.createAuditEvent.mockResolvedValue({});
  });

  it("starts a tenant-scoped session from a Twilio call SID", async () => {
    repository.findCallByTwilioSid.mockResolvedValue({
      id: "call-1",
      organizationId: "org-1",
      twilioCallSid: "CA123",
    });
    repository.upsertStarted.mockResolvedValue({
      id: "session-1",
      organizationId: "org-1",
      streamSid: "MZ123",
      packetCount: 0,
    });

    await service.start({ streamSid: "MZ123", twilioCallSid: "CA123" });

    expect(repository.upsertStarted).toHaveBeenCalledWith({
      callId: "call-1",
      organizationId: "org-1",
      twilioCallSid: "CA123",
      streamSid: "MZ123",
    });
    expect(repository.createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        action: "media_stream.started",
      }),
    );
  });

  it("rejects streams for unknown call SIDs", async () => {
    repository.findCallByTwilioSid.mockResolvedValue(null);

    await expect(service.start({ streamSid: "MZ123", twilioCallSid: "missing" })).rejects.toThrow(
      NotFoundException,
    );
  });

  it("increments packet metrics without storing raw audio", async () => {
    repository.incrementPacket.mockResolvedValue({ id: "session-1", packetCount: 2 });

    await service.recordPacket("MZ123");

    expect(repository.incrementPacket).toHaveBeenCalledWith("MZ123");
  });

  it("marks sessions disconnected on stop", async () => {
    repository.updateStatus.mockResolvedValue({
      id: "session-1",
      organizationId: "org-1",
      streamSid: "MZ123",
      packetCount: 3,
    });

    await service.stop("MZ123");

    expect(repository.updateStatus).toHaveBeenCalledWith("MZ123", "DISCONNECTED");
  });
});
