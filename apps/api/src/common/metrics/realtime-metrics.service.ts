import { Injectable } from "@nestjs/common";
import { monitorEventLoopDelay, performance } from "node:perf_hooks";

export type RealtimeMetricName =
  | "webhook_processing_ms"
  | "db_lookup_ms"
  | "redis_lookup_ms"
  | "openai_connect_ms"
  | "end_of_speech_detection_ms"
  | "rag_embedding_ms"
  | "rag_vector_search_ms"
  | "rag_total_ms"
  | "openai_response_created_ms"
  | "openai_first_audio_delta_ms"
  | "twilio_first_audio_write_ms"
  | "barge_in_clear_ms"
  | "total_first_response_ms";

interface Distribution {
  values: number[];
  success: number;
  failure: number;
}

const MAX_SAMPLES = 10_000;

@Injectable()
export class RealtimeMetricsService {
  private readonly distributions = new Map<RealtimeMetricName, Distribution>();
  private readonly counters = new Map<string, number>();
  private readonly eventLoop = monitorEventLoopDelay({ resolution: 20 });

  constructor() {
    this.eventLoop.enable();
  }

  now(): number {
    return performance.now();
  }

  observe(name: RealtimeMetricName, startedAt: number, success = true): number {
    const duration = Math.max(0, performance.now() - startedAt);
    const distribution = this.distributions.get(name) ?? {
      values: [],
      success: 0,
      failure: 0,
    };
    distribution.values.push(duration);
    if (distribution.values.length > MAX_SAMPLES) {
      distribution.values.shift();
    }
    if (success) {
      distribution.success += 1;
    } else {
      distribution.failure += 1;
    }
    this.distributions.set(name, distribution);
    return duration;
  }

  increment(name: string, value = 1): void {
    this.counters.set(name, (this.counters.get(name) ?? 0) + value);
  }

  snapshot() {
    const counters = Object.fromEntries(this.counters);
    const routingHits = counters.routing_cache_hits ?? 0;
    const routingMisses = counters.routing_cache_misses ?? 0;
    return {
      distributions: Object.fromEntries(
        [...this.distributions.entries()].map(([name, distribution]) => [
          name,
          summarize(distribution),
        ]),
      ),
      counters,
      ratios: {
        routingCacheHit:
          routingHits + routingMisses === 0
            ? 0
            : Number((routingHits / (routingHits + routingMisses)).toFixed(4)),
      },
      eventLoopLagMs: {
        p50: nanosToMs(this.eventLoop.percentile(50)),
        p95: nanosToMs(this.eventLoop.percentile(95)),
        p99: nanosToMs(this.eventLoop.percentile(99)),
        max: nanosToMs(this.eventLoop.max),
      },
    };
  }
}

function summarize(distribution: Distribution) {
  const sorted = [...distribution.values].sort((a, b) => a - b);
  return {
    count: sorted.length,
    success: distribution.success,
    failure: distribution.failure,
    p50: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    p99: percentile(sorted, 0.99),
  };
}

function percentile(values: number[], quantile: number): number {
  if (values.length === 0) return 0;
  const index = Math.min(values.length - 1, Math.ceil(values.length * quantile) - 1);
  return Number((values[index] ?? 0).toFixed(3));
}

function nanosToMs(value: number): number {
  return Number((value / 1_000_000).toFixed(3));
}
