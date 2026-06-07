import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import type { JwtPayload } from "../../modules/auth/auth.types";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    const header = request.header("Authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    request.user = await this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.config.getOrThrow<string>("jwt.accessSecret"),
    });
    return true;
  }
}
