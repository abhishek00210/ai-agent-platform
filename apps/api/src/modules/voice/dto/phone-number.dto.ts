import { IsEnum, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";
import { Transform } from "class-transformer";

export enum PhoneNumberStatusDto {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  UNASSIGNED = "UNASSIGNED",
}

export class ListPhoneNumbersQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PhoneNumberStatusDto)
  status?: PhoneNumberStatusDto;

  @IsOptional()
  @IsUUID()
  agentId?: string;
}

export class AssignPhoneNumberAgentDto {
  @IsUUID()
  agentId!: string;
}
