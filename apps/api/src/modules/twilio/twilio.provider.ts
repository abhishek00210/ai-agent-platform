export interface TelephonyAccount {
  accountSid: string;
  friendlyName: string | null;
  status: string | null;
}

export interface TelephonyPhoneNumber {
  providerSid: string;
  phoneNumber: string;
  friendlyName: string | null;
  country: string | null;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
  voiceWebhookUrl: string | null;
  smsWebhookUrl: string | null;
}

export interface TelephonyProvider {
  isConfigured(): boolean;
  validateConnection(): Promise<TelephonyAccount>;
  listPhoneNumbers(): Promise<TelephonyPhoneNumber[]>;
  assignNumber(
    phoneNumberSid: string,
    input: { voiceWebhookUrl?: string; smsWebhookUrl?: string },
  ): Promise<void>;
  removeNumber(phoneNumberSid: string): Promise<void>;
}
