import { Transform, Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export enum CallStatusDto {
  RINGING = "RINGING",
  ROUTING = "ROUTING",
  CONNECTED = "CONNECTED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  MISSED = "MISSED",
}

export class ListCallsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsEnum(CallStatusDto)
  status?: CallStatusDto;

  @IsOptional()
  @IsUUID()
  agentId?: string;

  @IsOptional()
  @IsUUID()
  phoneNumberId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
