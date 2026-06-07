import { ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import compression from "compression";
import helmet from "helmet";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { RequestIdInterceptor } from "./common/interceptors/request-id.interceptor";
import { SecurityHeadersMiddleware } from "./common/middleware/security-headers.middleware";
import type { ApiConfig } from "./config/env.schema";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const apiConfig = config.getOrThrow<ApiConfig>("api");

  app.useLogger(app.get(Logger));
  app.use(helmet());
  app.use(compression());
  app.use(new SecurityHeadersMiddleware().use);
  app.enableCors({
    origin: apiConfig.corsOrigins,
    credentials: true,
  });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new RequestIdInterceptor());

  await app.listen(apiConfig.port, apiConfig.host);
}

void bootstrap();
