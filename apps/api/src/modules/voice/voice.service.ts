import { Injectable } from "@nestjs/common";

@Injectable()
export class VoiceService {
  capabilities() {
    return {
      resource: "voice",
      realtime: "openai-structure-ready",
      telephony: "twilio-structure-ready",
    };
  }
}
