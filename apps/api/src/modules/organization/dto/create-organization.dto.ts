import { IsEnum, IsString } from "class-validator";

export enum OrganizationPlanDto {
  FREE = "FREE",
  STARTER = "STARTER",
  GROWTH = "GROWTH",
  ENTERPRISE = "ENTERPRISE",
}

export class CreateOrganizationDto {
  @IsString()
  name!: string;

  @IsEnum(OrganizationPlanDto)
  plan: OrganizationPlanDto = OrganizationPlanDto.FREE;
}
