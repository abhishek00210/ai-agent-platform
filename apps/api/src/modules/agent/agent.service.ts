import { Injectable } from "@nestjs/common";
import { AgentRepository } from "./repositories/agent.repository";

@Injectable()
export class AgentService {
  constructor(private readonly agents: AgentRepository) {}

  capabilities() {
    return { resource: "agents", mode: "repository-ready" };
  }
}
