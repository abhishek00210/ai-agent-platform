import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { TenantModule } from "../tenant/tenant.module";
import { AgentController } from "./agent.controller";
import { AgentService } from "./agent.service";
import { AgentRepository } from "./repositories/agent.repository";

@Module({
  imports: [AuthModule, TenantModule],
  controllers: [AgentController],
  providers: [AgentService, AgentRepository],
  exports: [AgentService],
})
export class AgentModule {}
