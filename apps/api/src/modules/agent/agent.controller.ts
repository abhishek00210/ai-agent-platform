import { Controller, Get } from "@nestjs/common";
import { AgentService } from "./agent.service";

@Controller("agents")
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Get("capabilities")
  capabilities() {
    return this.agentService.capabilities();
  }
}
