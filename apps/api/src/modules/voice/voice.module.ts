import { Module } from "@nestjs/common";
import { TwilioModule } from "../twilio/twilio.module";
import { VoiceController } from "./voice.controller";
import { VoiceService } from "./voice.service";

@Module({
  imports: [TwilioModule],
  controllers: [VoiceController],
  providers: [VoiceService],
  exports: [VoiceService],
})
export class VoiceModule {}
