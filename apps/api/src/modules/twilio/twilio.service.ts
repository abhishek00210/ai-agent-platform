import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { TelephonyAccount, TelephonyPhoneNumber, TelephonyProvider } from "./twilio.provider";

interface TwilioAccountResponse {
  sid: string;
  friendly_name?: string | null;
  status?: string | null;
}

interface TwilioIncomingPhoneNumbersResponse {
  incoming_phone_numbers?: TwilioIncomingPhoneNumber[];
}

interface TwilioIncomingPhoneNumber {
  sid: string;
  phone_number: string;
  friendly_name?: string | null;
  iso_country?: string | null;
  capabilities?: {
    voice?: boolean;
    sms?: boolean;
    mms?: boolean;
  };
  voice_url?: string | null;
  sms_url?: string | null;
}

@Injectable()
export class TwilioService implements TelephonyProvider {
  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.accountSid && this.authSecret);
  }

  describe() {
    return {
      provider: "twilio" as const,
      configured: this.isConfigured(),
      accountSid: this.accountSid || null,
    };
  }

  async validateConnection(): Promise<TelephonyAccount> {
    const account = await this.request<TwilioAccountResponse>(
      `/2010-04-01/Accounts/${this.accountSid}.json`,
    );
    return {
      accountSid: account.sid,
      friendlyName: account.friendly_name ?? null,
      status: account.status ?? null,
    };
  }

  async listPhoneNumbers(): Promise<TelephonyPhoneNumber[]> {
    const result = await this.request<TwilioIncomingPhoneNumbersResponse>(
      `/2010-04-01/Accounts/${this.accountSid}/IncomingPhoneNumbers.json?PageSize=1000`,
    );
    return (result.incoming_phone_numbers ?? []).map((number) => ({
      providerSid: number.sid,
      phoneNumber: number.phone_number,
      friendlyName: number.friendly_name ?? null,
      country: number.iso_country ?? null,
      capabilities: {
        voice: Boolean(number.capabilities?.voice),
        sms: Boolean(number.capabilities?.sms),
        mms: Boolean(number.capabilities?.mms),
      },
      voiceWebhookUrl: number.voice_url ?? null,
      smsWebhookUrl: number.sms_url ?? null,
    }));
  }

  async assignNumber(
    phoneNumberSid: string,
    input: { voiceWebhookUrl?: string; smsWebhookUrl?: string },
  ): Promise<void> {
    const body = new URLSearchParams();
    if (input.voiceWebhookUrl) {
      body.set("VoiceUrl", input.voiceWebhookUrl);
    }
    if (input.smsWebhookUrl) {
      body.set("SmsUrl", input.smsWebhookUrl);
    }
    if (body.size === 0) {
      return;
    }
    await this.request(
      `/2010-04-01/Accounts/${this.accountSid}/IncomingPhoneNumbers/${phoneNumberSid}.json`,
      {
        method: "POST",
        body,
      },
    );
  }

  async removeNumber(phoneNumberSid: string): Promise<void> {
    const body = new URLSearchParams();
    body.set("VoiceUrl", "");
    body.set("SmsUrl", "");
    await this.request(
      `/2010-04-01/Accounts/${this.accountSid}/IncomingPhoneNumbers/${phoneNumberSid}.json`,
      {
        method: "POST",
        body,
      },
    );
  }

  private async request<T = unknown>(
    path: string,
    options: { method?: string; body?: URLSearchParams } = {},
  ): Promise<T> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException("Twilio credentials are not configured.");
    }

    const response = await fetch(`https://api.twilio.com${path}`, {
      method: options.method ?? "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.authUsername}:${this.authSecret}`).toString(
          "base64",
        )}`,
        ...(options.body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      },
      body: options.body,
    });

    if (!response.ok) {
      throw new ServiceUnavailableException(
        "Twilio request failed. Check credentials and account access.",
      );
    }

    return (await response.json()) as T;
  }

  private get accountSid(): string {
    return this.config.get<string>("twilio.accountSid") ?? "";
  }

  private get authUsername(): string {
    return this.config.get<string>("twilio.apiKey") || this.accountSid;
  }

  private get authSecret(): string {
    return (
      this.config.get<string>("twilio.apiSecret") ||
      this.config.get<string>("twilio.authToken") ||
      ""
    );
  }
}
