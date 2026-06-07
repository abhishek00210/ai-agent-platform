import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { BillingProvider } from "./billing.provider";

@Injectable()
export class BillingService implements BillingProvider {
  providerName = "stripe" as const;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>("stripe.secretKey"));
  }

  capabilities() {
    return {
      provider: this.providerName,
      configured: this.isConfigured(),
      mode: "integration-structure-only",
    };
  }
}
