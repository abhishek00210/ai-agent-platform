export interface TwilioVoiceProvider {
  isConfigured(): boolean;
  describe(): {
    provider: "twilio";
    configured: boolean;
  };
}
