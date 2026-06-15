import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import type { JwtPayload } from "../auth/auth.types";
import { TenantService } from "../tenant/tenant.service";
import { RealtimeSessionService } from "./realtime-session.service";
import { RealtimeMetricsService } from "../../common/metrics/realtime-metrics.service";

@UseGuards(JwtAuthGuard)
@Controller("voice")
export class RealtimeController {
  constructor(
    private readonly sessions: RealtimeSessionService,
    private readonly tenant: TenantService,
    private readonly metrics: RealtimeMetricsService,
  ) {}

  @Get("calls/:callId/realtime-sessions")
  listForCall(@CurrentUser() user: JwtPayload, @Param("callId", ParseUUIDPipe) callId: string) {
    return this.sessions.listForCall(this.tenant.fromUser(user), callId);
  }

  @Get("realtime/stats")
  stats(@CurrentUser() user: JwtPayload) {
    return this.sessions.stats(this.tenant.fromUser(user));
  }

  @Get("realtime/metrics")
  metricsSnapshot() {
    return this.metrics.snapshot();
  }
}
