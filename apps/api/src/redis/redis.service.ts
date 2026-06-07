import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import type Redis from "ioredis";
import { REDIS_CLIENT } from "./redis.constants";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleInit(): Promise<void> {
    await this.redis.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
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
