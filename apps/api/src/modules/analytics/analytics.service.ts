import { Injectable } from "@nestjs/common";

@Injectable()
export class AnalyticsService {
  capabilities() {
    return {
      resource: "analytics",
      mode: "placeholder",
      preparedFor: ["call-quality", "agent-performance", "billing-events"],
    };
  }
}
