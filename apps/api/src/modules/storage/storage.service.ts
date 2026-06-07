import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { ObjectStorageProvider } from "./storage.provider";

@Injectable()
export class StorageService implements ObjectStorageProvider {
  providerName = "s3-compatible" as const;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>("storage.endpoint") &&
      this.config.get<string>("storage.bucket") &&
      this.config.get<string>("storage.accessKeyId"),
    );
  }

  capabilities() {
    return {
      provider: this.providerName,
      configured: this.isConfigured(),
      mode: "integration-structure-only",
    };
  }
}
