import { Injectable, Logger } from "@nestjs/common";
import { RealtimeConnectionManager } from "./realtime-connection-manager";
import { RealtimeSessionService } from "./realtime-session.service";

@Injectable()
export class RealtimeAudioBridge {
  private readonly logger = new Logger(RealtimeAudioBridge.name);

  constructor(
    private readonly connections: RealtimeConnectionManager,
    private readonly sessions: RealtimeSessionService,
  ) {}

  forwardTwilioAudio(input: { streamSid: string; realtimeSessionId: string; payload: string }) {
    if (this.connections.sendAudio(input.streamSid, input.payload)) {
      void this.sessions.recordAudioSent(input.realtimeSessionId);
    }
  }

  forwardOpenAiAudio(input: {
    streamSid: string;
    realtimeSessionId: string;
    payload: string;
    sendToTwilio: (event: Record<string, unknown>) => boolean;
  }) {
    const accepted = input.sendToTwilio({
      event: "media",
      streamSid: input.streamSid,
      media: {
        payload: input.payload,
      },
    });
    if (accepted) {
      void this.sessions.recordAudioReceived(input.realtimeSessionId);
    } else {
      this.logger.warn(
        `Dropping stale OpenAI audio for ${input.streamSid}: Twilio backpressure.`,
      );
    }
  }
}
