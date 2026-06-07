import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AgentModule } from "./modules/agent/agent.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BillingModule } from "./modules/billing/billing.module";
import { HealthModule } from "./modules/health/health.module";
import { MailModule } from "./modules/mail/mail.module";
import { OrganizationModule } from "./modules/organization/organization.module";
import { StorageModule } from "./modules/storage/storage.module";
import { TenantModule } from "./modules/tenant/tenant.module";
import { TwilioModule } from "./modules/twilio/twilio.module";
import { UserModule } from "./modules/user/user.module";
import { VoiceModule } from "./modules/voice/voice.module";
import { envConfig, validateEnv } from "./config/env.schema";
import { DatabaseModule } from "./database/database.module";
import { RedisModule } from "./redis/redis.module";
import { SecurityModule } from "./security/security.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
      load: [envConfig],
      validate: validateEnv,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        autoLogging: true,
        transport:
          process.env.NODE_ENV === "production"
            ? undefined
            : {
                target: "pino-pretty",
                options: { singleLine: true },
              },
      },
    }),
    DatabaseModule,
    RedisModule,
    TenantModule,
    SecurityModule,
    AuthModule,
    UserModule,
    OrganizationModule,
    AgentModule,
    VoiceModule,
    TwilioModule,
    MailModule,
    BillingModule,
    StorageModule,
    AnalyticsModule,
    HealthModule,
  ],
})
export class AppModule {}
