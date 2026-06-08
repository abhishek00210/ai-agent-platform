import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import type { JwtPayload } from "../auth/auth.types";
import { TenantService } from "../tenant/tenant.service";
import { CallService } from "./call.service";
import { ListCallsQueryDto } from "./dto/call.dto";

@UseGuards(JwtAuthGuard)
@Controller("voice/calls")
export class CallController {
  constructor(
    private readonly calls: CallService,
    private readonly tenant: TenantService,
  ) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query() query: ListCallsQueryDto) {
    return this.calls.list(this.tenant.fromUser(user), query);
  }

  @Get(":id")
  details(@CurrentUser() user: JwtPayload, @Param("id", ParseUUIDPipe) callId: string) {
    return this.calls.getById(this.tenant.fromUser(user), callId);
  }
}
