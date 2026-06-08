import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { AudioPacketService } from "./audio-packet.service";
import type {
  MediaStreamConnectionState,
  TwilioMediaStreamEvent,
  TwilioStartEvent,
  TwilioStopEvent,
} from "./media-stream.types";
import { StreamLifecycleService } from "./stream-lifecycle.service";

@Injectable()
export class MediaStreamService {
  private readonly logger = new Logger(MediaStreamService.name);
  private readonly connections = new Map<string, MediaStreamConnectionState>();

  constructor(
    private readonly lifecycle: StreamLifecycleService,
    private readonly audioPackets: AudioPacketService,
  ) {}

  registerConnection(connectionId: string) {
    this.connections.set(connectionId, {
      connectionId,
      connectedAt: new Date(),
    });
  }

  async handleEvent(connectionId: string, event: unknown) {
    const parsed = parseTwilioEvent(event);
    switch (parsed.event) {
      case "connected":
        this.registerConnection(connectionId);
        return { ok: true };
      case "start":
        return this.handleStart(connectionId, parsed);
      case "media":
        return this.audioPackets.process(parsed);
      case "stop":
        return this.handleStop(connectionId, parsed);
      default:
        return assertNever(parsed);
    }
  }

  async handleDisconnect(connectionId: string) {
    const connection = this.connections.get(connectionId);
    this.connections.delete(connectionId);
    await this.lifecycle.disconnect(connection?.streamSid);
  }

  private async handleStart(connectionId: string, event: TwilioStartEvent) {
    const session = await this.lifecycle.start(event);
    this.connections.set(connectionId, {
      connectionId,
      connectedAt: new Date(),
      streamSid: event.start.streamSid,
      twilioCallSid: event.start.callSid,
    });
    this.logger.debug(`Twilio media stream started: ${event.start.streamSid}`);
    return session;
  }

  private async handleStop(connectionId: string, event: TwilioStopEvent) {
    const result = await this.lifecycle.stop(event);
    this.connections.delete(connectionId);
    return result;
  }
}

function parseTwilioEvent(event: unknown): TwilioMediaStreamEvent {
  if (!event || typeof event !== "object" || !("event" in event)) {
    throw new BadRequestException("Malformed Twilio media event.");
  }

  const candidate = event as { event?: unknown };
  if (
    candidate.event !== "connected" &&
    candidate.event !== "start" &&
    candidate.event !== "media" &&
    candidate.event !== "stop"
  ) {
    throw new BadRequestException("Unsupported Twilio media event.");
  }

  return event as TwilioMediaStreamEvent;
}

function assertNever(value: never): never {
  throw new BadRequestException(`Unhandled Twilio media event: ${JSON.stringify(value)}`);
}
