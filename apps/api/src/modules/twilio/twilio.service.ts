import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { TwilioVoiceProvider } from "./twilio.provider";

@Injectable()
export class TwilioService implements TwilioVoiceProvider {
  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>("twilio.accountSid") &&
      this.config.get<string>("twilio.authToken") &&
      this.config.get<string>("twilio.phoneNumber"),
    );
  }

  describe() {
    return {
      provider: "twilio" as const,
      configured: this.isConfigured(),
    };
  }
}
