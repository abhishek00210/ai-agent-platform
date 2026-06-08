export interface StorageUploadInput {
  key: string;
  body: Buffer;
  contentType: string;
  contentLength: number;
  metadata?: Record<string, string>;
}

export interface StorageUploadResult {
  key: string;
  bucket: string;
  provider: string;
  etag?: string;
}

export interface StorageDownloadAccess {
  url: string;
  expiresInSeconds: number;
}

export interface StorageDownloadResult {
  body: Buffer;
  contentType?: string;
  contentLength?: number;
}

export interface StorageProvider {
  isConfigured(): boolean;
  providerName: "s3-compatible";
  bucketName(): string;
  upload(input: StorageUploadInput): Promise<StorageUploadResult>;
  download(key: string): Promise<StorageDownloadResult>;
  delete(key: string): Promise<void>;
  createDownloadUrl(key: string, fileName: string): Promise<StorageDownloadAccess>;
}
