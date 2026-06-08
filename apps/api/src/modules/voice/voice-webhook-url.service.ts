import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class VoiceWebhookUrlService {
  constructor(private readonly config: ConfigService) {}

  voiceUrl(): string {
    return `${this.baseUrl}/api/v1/webhooks/twilio/voice`;
  }

  smsUrl(): string {
    return `${this.baseUrl}/api/v1/webhooks/twilio/sms`;
  }

  mediaStreamUrl(): string {
    return `${this.websocketBaseUrl}/ws/twilio-media`;
  }

  private get baseUrl(): string {
    return this.config.getOrThrow<string>("voice.webhookBaseUrl").replace(/\/$/, "");
  }

  private get websocketBaseUrl(): string {
    const baseUrl = this.baseUrl;
    if (baseUrl.startsWith("https://")) {
      return baseUrl.replace(/^https:\/\//, "wss://");
    }

    if (baseUrl.startsWith("http://")) {
      return baseUrl.replace(/^http:\/\//, "ws://");
    }

    return baseUrl;
  }
}
