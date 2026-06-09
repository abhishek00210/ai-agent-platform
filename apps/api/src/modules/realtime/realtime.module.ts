import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ConversationRepository } from "../conversation/repositories/conversation.repository";
import { MessageRepository } from "../conversation/repositories/message.repository";
import { MemoryModule } from "../memory/memory.module";
import { RagModule } from "../rag/rag.module";
import { TenantModule } from "../tenant/tenant.module";
import { TwilioModule } from "../twilio/twilio.module";
import { RealtimeAgentContextService } from "./realtime-agent-context.service";
import { RealtimeAudioBridge } from "./realtime-audio-bridge";
import { RealtimeConnectionManager } from "./realtime-connection-manager";
import { RealtimeConversationService } from "./realtime-conversation.service";
import { RealtimeController } from "./realtime.controller";
import { RealtimeEventProcessor } from "./realtime-event-processor";
import { RealtimeGateway } from "./realtime.gateway";
import { RealtimeSessionService } from "./realtime-session.service";
import { RealtimeSessionRepository } from "./repositories/realtime-session.repository";

@Module({
  imports: [AuthModule, TenantModule, RagModule, MemoryModule, TwilioModule],
  controllers: [RealtimeController],
  providers: [
    RealtimeGateway,
    RealtimeSessionService,
    RealtimeConnectionManager,
    RealtimeAudioBridge,
    RealtimeConversationService,
    RealtimeAgentContextService,
    RealtimeEventProcessor,
    RealtimeSessionRepository,
    ConversationRepository,
    MessageRepository,
  ],
  exports: [RealtimeGateway, RealtimeSessionService],
})
export class RealtimeModule {}
