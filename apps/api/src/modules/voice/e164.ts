import { BadRequestException } from "@nestjs/common";

export function normalizeE164(value: string): string {
  const normalized = value.trim().replace(/[\s().-]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
    throw new BadRequestException("Phone number must be in E.164 format.");
  }
  return normalized;
}
