import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { TenantModule } from "../tenant/tenant.module";
import { MediaStreamModule } from "../media-stream/media-stream.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { TwilioModule } from "../twilio/twilio.module";
import { CallController } from "./call.controller";
import { CallRoutingService } from "./call-routing.service";
import { CallService } from "./call.service";
import { PhoneNumberController } from "./phone-number.controller";
import { PhoneNumberService } from "./phone-number.service";
import { CallRepository } from "./repositories/call.repository";
import { PhoneNumberRepository } from "./repositories/phone-number.repository";
import { IncomingCallController } from "./incoming-call.controller";
import { IncomingCallService } from "./incoming-call.service";
import { TwiMLResponseService } from "./twiml-response.service";
import { TwilioWebhookGuard } from "./twilio-webhook.guard";
import { VoiceWebhookUrlService } from "./voice-webhook-url.service";
import { VoiceController } from "./voice.controller";
import { VoiceService } from "./voice.service";

@Module({
  imports: [AuthModule, TenantModule, TwilioModule, MediaStreamModule, RealtimeModule],
  controllers: [VoiceController, PhoneNumberController, CallController, IncomingCallController],
  providers: [
    VoiceService,
    PhoneNumberService,
    PhoneNumberRepository,
    CallService,
    CallRepository,
    CallRoutingService,
    IncomingCallService,
    TwiMLResponseService,
    TwilioWebhookGuard,
    VoiceWebhookUrlService,
  ],
  exports: [VoiceService, PhoneNumberService, CallService],
})
export class VoiceModule {}
