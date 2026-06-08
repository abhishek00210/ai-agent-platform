import { BadRequestException, Injectable } from "@nestjs/common";
import type { TwilioMediaEvent } from "./media-stream.types";
import { CallSessionService } from "./call-session.service";

@Injectable()
export class AudioPacketService {
  constructor(private readonly sessions: CallSessionService) {}

  async process(event: TwilioMediaEvent) {
    if (!event.streamSid) {
      throw new BadRequestException("Stream SID is required for media packets.");
    }

    if (!event.media?.payload) {
      throw new BadRequestException("Media payload is required.");
    }

    return this.sessions.recordPacket(event.streamSid);
  }
}
