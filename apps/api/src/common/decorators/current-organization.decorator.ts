import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { JwtPayload } from "../../modules/auth/auth.types";

export const CurrentOrganization = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | undefined => {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    return request.user?.organizationId;
  },
);
