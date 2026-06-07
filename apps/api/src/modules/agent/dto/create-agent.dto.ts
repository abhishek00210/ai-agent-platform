import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";

export enum AgentStatusDto {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  ARCHIVED = "ARCHIVED",
}

export class CreateAgentDto {
  @IsUUID()
  organizationId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  language: string = "en-US";

  @IsString()
  voice: string = "alloy";

  @IsString()
  systemPrompt!: string;

  @IsEnum(AgentStatusDto)
  status: AgentStatusDto = AgentStatusDto.DRAFT;
}
