import { Injectable } from "@nestjs/common";
import { VoiceWebhookUrlService } from "./voice-webhook-url.service";

@Injectable()
export class TwiMLResponseService {
  constructor(private readonly urls: VoiceWebhookUrlService) {}

  routing(): string {
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      "<Response>",
      "<Say>Please hold while we connect you.</Say>",
      "<Connect>",
      `<Stream url="${escapeXml(this.urls.mediaStreamUrl())}" />`,
      "</Connect>",
      "</Response>",
    ].join("");
  }

  unavailable(): string {
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      "<Response>",
      "<Say>We are unable to take your call at the moment.</Say>",
      "<Hangup/>",
      "</Response>",
    ].join("");
  }
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
