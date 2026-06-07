import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    const header = request.header("Authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    request.user = await this.jwtService.verifyAsync(token);
    return true;
  }
}
