import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import type Redis from "ioredis";
import { REDIS_CLIENT } from "./redis.constants";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private available = false;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.redis.connect();
      this.available = true;
    } catch (error) {
      this.logger.warn(
        `Redis unavailable; cache and background queues are degraded: ${
          error instanceof Error ? error.message : "connection failed"
        }`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis.status === "ready" || this.redis.status === "connect") {
      await this.redis.quit();
    }
  }

  get isAvailable(): boolean {
    return this.available && this.redis.status === "ready";
  }

  get cache(): Redis {
    return this.redis;
  }

  get queueConnection(): Redis {
    return this.redis;
  }

  get sessionStore(): Redis {
    return this.redis;
  }

  get rateLimitStore(): Redis {
    return this.redis;
  }
}
