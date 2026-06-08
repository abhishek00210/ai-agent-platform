import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ConversationRepository } from "../conversation/repositories/conversation.repository";
import { MessageRepository } from "../conversation/repositories/message.repository";
import { MemoryModule } from "../memory/memory.module";
import { OpenAiConfigService } from "../openai/openai-config.service";
import { OpenAiProvider } from "../openai/openai.provider";
import { PromptAssemblyService } from "../openai/prompt-assembly.service";
import { ConversationContextService } from "../openai/conversation-context.service";
import { ResponseGenerationService } from "../openai/response-generation.service";
import { RagModule } from "../rag/rag.module";
import { TenantModule } from "../tenant/tenant.module";
import { WidgetRepository } from "./repositories/widget.repository";
import { WidgetRateLimitService } from "./widget-rate-limit.service";
import { PublicWidgetController, WidgetController } from "./widget.controller";
import { WidgetService } from "./widget.service";

@Module({
  imports: [AuthModule, TenantModule, RagModule, MemoryModule],
  controllers: [WidgetController, PublicWidgetController],
  providers: [
    WidgetRepository,
    WidgetRateLimitService,
    WidgetService,
    OpenAiConfigService,
    OpenAiProvider,
    PromptAssemblyService,
    ConversationContextService,
    ResponseGenerationService,
    ConversationRepository,
    MessageRepository,
  ],
})
export class WidgetModule {}
