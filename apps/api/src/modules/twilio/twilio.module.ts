import { Module } from "@nestjs/common";
import { TenantModule } from "../tenant/tenant.module";
import { TwilioConnectionRepository } from "./repositories/twilio-connection.repository";
import { TwilioConnectionService } from "./twilio-connection.service";
import { TwilioController } from "./twilio.controller";
import { TwilioSignatureService } from "./twilio-signature.service";
import { TwilioService } from "./twilio.service";

@Module({
  imports: [TenantModule],
  controllers: [TwilioController],
  providers: [
    TwilioService,
    TwilioConnectionService,
    TwilioConnectionRepository,
    TwilioSignatureService,
  ],
  exports: [TwilioService, TwilioConnectionService, TwilioSignatureService],
})
export class TwilioModule {}
