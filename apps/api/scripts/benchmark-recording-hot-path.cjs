/* global Buffer, global, process, require */
/* eslint-disable @typescript-eslint/no-require-imports */
const { performance } = require("node:perf_hooks");
const {
  RecordingBufferService,
} = require("../dist/modules/recording/recording-buffer.service.js");
const { RealtimeAudioBridge } = require("../dist/modules/realtime/realtime-audio-bridge.js");

const packetsPerCall = Number(process.env.RECORDING_BENCHMARK_PACKETS_PER_CALL ?? 500);
const concurrencyLevels = (process.env.RECORDING_BENCHMARK_CONCURRENCY ?? "20,50,100")
  .split(",")
  .map(Number)
  .filter((value) => Number.isFinite(value) && value > 0);
const payload = Buffer.alloc(160, 0xff).toString("base64");

void main();

async function main() {
  const results = [];

  for (const concurrentCalls of concurrencyLevels) {
    global.gc?.();
    const heapBefore = process.memoryUsage().heapUsed;
    const writer = {
      append: async () => undefined,
      waitForPending: async () => undefined,
    };
    const buffers = new RecordingBufferService(writer);
    const connections = { sendAudio: () => true };
    const sessions = {
      recordAudioSent: () => undefined,
      recordAudioReceived: () => undefined,
    };
    const bridge = new RealtimeAudioBridge(connections, sessions, buffers);

    for (let call = 0; call < concurrentCalls; call += 1) {
      buffers.register({
        recordingId: `recording-${call}`,
        organizationId: `org-${call % 5}`,
        callId: `call-${call}`,
        callSessionId: `session-${call}`,
        twilioCallSid: `CA${call}`,
        streamSid: `MZ${call}`,
        rawPath: `/tmp/recording-benchmark-${process.pid}-${call}.ulaw`,
        startedAt: new Date().toISOString(),
      });
    }

    const baselineDurations = [];
    const recordingDurations = [];
    const totalPackets = concurrentCalls * packetsPerCall;

    for (let packet = 0; packet < totalPackets; packet += 1) {
      const startedAt = performance.now();
      connections.sendAudio(payload);
      baselineDurations.push((performance.now() - startedAt) * 1000);
    }

    for (let packet = 0; packet < packetsPerCall; packet += 1) {
      for (let call = 0; call < concurrentCalls; call += 1) {
        const startedAt = performance.now();
        bridge.forwardTwilioAudio({
          streamSid: `MZ${call}`,
          realtimeSessionId: `realtime-${call}`,
          payload,
        });
        recordingDurations.push((performance.now() - startedAt) * 1000);
      }
    }

    const bufferMetrics = buffers.metrics();
    const heapAtPeak = process.memoryUsage().heapUsed;
    await Promise.all(
      Array.from({ length: concurrentCalls }, (_, call) => buffers.close(`MZ${call}`)),
    );
    global.gc?.();
    const heapAfter = process.memoryUsage().heapUsed;

    results.push({
      concurrentCalls,
      packetsPerCall,
      totalPackets,
      baselineP95Microseconds: percentile(baselineDurations, 0.95),
      recordingP50Microseconds: percentile(recordingDurations, 0.5),
      recordingP95Microseconds: percentile(recordingDurations, 0.95),
      recordingP99Microseconds: percentile(recordingDurations, 0.99),
      incrementalP95Microseconds: Number(
        (
          percentile(recordingDurations, 0.95) -
          percentile(baselineDurations, 0.95)
        ).toFixed(3),
      ),
      activeCallsAtPeak: bufferMetrics.activeCalls,
      totalBufferedBytesAtPeak: bufferMetrics.totalBufferedBytes,
      maximumCallBufferedBytesAtPeak: bufferMetrics.maximumCallBufferedBytes,
      droppedBytes: bufferMetrics.droppedBytes,
      heapGrowthAtPeakBytes: heapAtPeak - heapBefore,
      heapRetainedAfterCloseBytes: heapAfter - heapBefore,
    });
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        scope:
          "Synthetic in-process Twilio-to-OpenAI send plus recording capture. Excludes network, database, Redis, disk, and S3 latency.",
        results,
      },
      null,
      2,
    )}\n`,
  );
}

function percentile(values, quantile) {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * quantile) - 1);
  return Number((sorted[Math.max(0, index)] ?? 0).toFixed(3));
}
