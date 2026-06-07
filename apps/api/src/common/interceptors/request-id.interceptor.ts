import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { randomUUID } from "crypto";
import type { Request, Response } from "express";
import { Observable } from "rxjs";

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { requestId?: string }>();
    const response = context.switchToHttp().getResponse<Response>();
    const requestId = request.header("x-request-id") ?? randomUUID();

    request.requestId = requestId;
    response.setHeader("x-request-id", requestId);

    return next.handle();
  }
}
