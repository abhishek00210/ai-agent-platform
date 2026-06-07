export interface BillingProvider {
  isConfigured(): boolean;
  providerName: "stripe";
}
