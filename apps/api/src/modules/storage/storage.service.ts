import { Injectable } from "@nestjs/common";
import type {
  StorageDownloadAccess,
  StorageUploadInput,
  StorageUploadResult,
} from "./storage.provider";
import { S3StorageProvider } from "./s3-storage.provider";

@Injectable()
export class StorageService {
  constructor(private readonly provider: S3StorageProvider) {}

  get providerName() {
    return this.provider.providerName;
  }

  isConfigured(): boolean {
    return this.provider.isConfigured();
  }

  bucketName(): string {
    return this.provider.bucketName();
  }

  upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    return this.provider.upload(input);
  }

  delete(key: string): Promise<void> {
    return this.provider.delete(key);
  }

  createDownloadUrl(key: string, fileName: string): Promise<StorageDownloadAccess> {
    return this.provider.createDownloadUrl(key, fileName);
  }

  capabilities() {
    return {
      provider: this.providerName,
      configured: this.isConfigured(),
      mode: "s3-compatible-ready",
    };
  }
}
