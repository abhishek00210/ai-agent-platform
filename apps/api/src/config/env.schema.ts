import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_HOST: z.string().default("0.0.0.0"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_CORS_ORIGINS: z.string().default("http://localhost:3000"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  HTTP_AUTO_LOGGING: z.enum(["true", "false"]).default("true"),
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(20),
  DATABASE_QUERY_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  REDIS_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  TWILIO_ACCOUNT_SID: z.string().optional().default(""),
  TWILIO_AUTH_TOKEN: z.string().optional().default(""),
  TWILIO_API_KEY: z.string().optional().default(""),
  TWILIO_API_SECRET: z.string().optional().default(""),
  TWILIO_PHONE_NUMBER: z.string().optional().default(""),
  VOICE_WEBHOOK_BASE_URL: z
    .preprocess((value) => (value === "" ? undefined : value), z.string().url().optional())
    .default(undefined),
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_MODEL: z.string().default("gpt-5.2"),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  OPENAI_REALTIME_MODEL: z.string().default("gpt-realtime-2"),
  OPENAI_REALTIME_TRANSCRIPTION_MODEL: z.string().default("gpt-4o-mini-transcribe"),
  OPENAI_TRANSCRIPTION_MODEL: z.string().default("gpt-4o-transcribe-diarize"),
  TRANSCRIPTION_WORKER_CONCURRENCY: z.coerce.number().int().positive().max(20).default(3),
  TRANSCRIPTION_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(5),
  REALTIME_MAX_BUFFERED_AUDIO_PACKETS: z.coerce.number().int().positive().default(100),
  REALTIME_MAX_BUFFERED_AUDIO_BYTES: z.coerce.number().int().positive().default(65536),
  REALTIME_PERSISTENCE_QUEUE_SIZE: z.coerce.number().int().positive().default(1000),
  REALTIME_VAD_THRESHOLD: z.coerce.number().min(0).max(1).default(0.5),
  REALTIME_VAD_PREFIX_PADDING_MS: z.coerce.number().int().nonnegative().default(300),
  REALTIME_VAD_SILENCE_DURATION_MS: z.coerce.number().int().positive().default(400),
  VOICE_ROUTING_CACHE_TTL_MS: z.coerce.number().int().positive().default(30000),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  OPENAI_EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(1536),
  OPENAI_RAG_MODEL: z.string().default("gpt-5.2"),
  RAG_TOP_K: z.coerce.number().int().positive().default(5),
  RAG_SIMILARITY_THRESHOLD: z.coerce.number().min(0).max(1).default(0.2),
  RAG_MAX_CONTEXT_LENGTH: z.coerce.number().int().positive().default(6000),
  STRIPE_SECRET_KEY: z.string().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
  S3_ENDPOINT: z.string().optional().default(""),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().optional().default(""),
  S3_ACCESS_KEY_ID: z.string().optional().default(""),
  S3_SECRET_ACCESS_KEY: z.string().optional().default(""),
});

export type RawEnv = z.infer<typeof envSchema>;

export interface ApiConfig {
  host: string;
  port: number;
  corsOrigins: string[];
  appUrl: string;
}

export function validateEnv(config: Record<string, unknown>): RawEnv {
  return envSchema.parse(config);
}

export const envConfig = () => {
  const env = envSchema.parse(process.env);

  return {
    env: env.NODE_ENV,
    api: {
      host: env.API_HOST,
      port: env.API_PORT,
      corsOrigins: env.API_CORS_ORIGINS.split(",").map((origin) => origin.trim()),
      appUrl: env.APP_URL,
    } satisfies ApiConfig,
    database: {
      url: env.DATABASE_URL,
      poolMax: env.DATABASE_POOL_MAX,
      queryTimeoutMs: env.DATABASE_QUERY_TIMEOUT_MS,
    },
    redis: {
      url: env.REDIS_URL,
    },
    jwt: {
      accessSecret: env.JWT_ACCESS_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
      refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
    twilio: {
      accountSid: env.TWILIO_ACCOUNT_SID,
      authToken: env.TWILIO_AUTH_TOKEN,
      apiKey: env.TWILIO_API_KEY,
      apiSecret: env.TWILIO_API_SECRET,
      phoneNumber: env.TWILIO_PHONE_NUMBER,
    },
    voice: {
      webhookBaseUrl: env.VOICE_WEBHOOK_BASE_URL || env.APP_URL,
      routingCacheTtlMs: env.VOICE_ROUTING_CACHE_TTL_MS,
    },
    openai: {
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
      timeoutMs: env.OPENAI_TIMEOUT_MS,
      realtimeModel: env.OPENAI_REALTIME_MODEL,
      realtimeTranscriptionModel: env.OPENAI_REALTIME_TRANSCRIPTION_MODEL,
      transcriptionModel: env.OPENAI_TRANSCRIPTION_MODEL,
      transcriptionWorkerConcurrency: env.TRANSCRIPTION_WORKER_CONCURRENCY,
      transcriptionMaxAttempts: env.TRANSCRIPTION_MAX_ATTEMPTS,
      realtimeMaxBufferedAudioPackets: env.REALTIME_MAX_BUFFERED_AUDIO_PACKETS,
      realtimeMaxBufferedAudioBytes: env.REALTIME_MAX_BUFFERED_AUDIO_BYTES,
      realtimePersistenceQueueSize: env.REALTIME_PERSISTENCE_QUEUE_SIZE,
      realtimeVadThreshold: env.REALTIME_VAD_THRESHOLD,
      realtimeVadPrefixPaddingMs: env.REALTIME_VAD_PREFIX_PADDING_MS,
      realtimeVadSilenceDurationMs: env.REALTIME_VAD_SILENCE_DURATION_MS,
      embeddingModel: env.OPENAI_EMBEDDING_MODEL,
      embeddingDimensions: env.OPENAI_EMBEDDING_DIMENSIONS,
      ragModel: env.OPENAI_RAG_MODEL,
    },
    rag: {
      topK: env.RAG_TOP_K,
      similarityThreshold: env.RAG_SIMILARITY_THRESHOLD,
      maxContextLength: env.RAG_MAX_CONTEXT_LENGTH,
    },
    stripe: {
      secretKey: env.STRIPE_SECRET_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    },
    storage: {
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      bucket: env.S3_BUCKET,
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  };
};
