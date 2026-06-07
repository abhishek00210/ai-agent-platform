export interface ObjectStorageProvider {
  isConfigured(): boolean;
  providerName: "s3-compatible";
}
