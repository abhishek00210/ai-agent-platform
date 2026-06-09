import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { TenantModule } from "../tenant/tenant.module";
import { AudioPacketService } from "./audio-packet.service";
import { CallSessionController } from "./call-session.controller";
import { CallSessionService } from "./call-session.service";
import { MediaStreamGateway } from "./media-stream.gateway";
import { MediaStreamService } from "./media-stream.service";
import { CallSessionRepository } from "./repositories/call-session.repository";
import { StreamLifecycleService } from "./stream-lifecycle.service";

@Module({
  imports: [AuthModule, TenantModule, RealtimeModule],
  controllers: [CallSessionController],
  providers: [
    MediaStreamGateway,
    MediaStreamService,
    CallSessionService,
    CallSessionRepository,
    AudioPacketService,
    StreamLifecycleService,
  ],
  exports: [CallSessionService],
})
export class MediaStreamModule {}
