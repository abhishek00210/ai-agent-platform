import { Controller, Get } from "@nestjs/common";
import { BillingService } from "./billing.service";

@Controller("billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get("capabilities")
  capabilities() {
    return this.billingService.capabilities();
  }
}
