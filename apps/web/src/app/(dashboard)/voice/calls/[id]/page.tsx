"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Download,
  FileAudio,
  FileText,
  PhoneCall,
  Radio,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@ai-agent-platform/ui";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonBlock } from "@/components/layout/page-loader";
import { authApi } from "@/lib/auth-api";
import { useCallSessionStore } from "@/store/call-session-store";
import { useCallStore } from "@/store/call-store";
import { useRealtimeSessionStore } from "@/store/realtime-session-store";

export default function CallDetailsPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const call = useQuery({
    queryKey: ["voice-call", params.id],
    queryFn: () => authApi.call(params.id),
  });
  const sessions = useQuery({
    queryKey: ["voice-call-sessions", params.id],
    queryFn: () => authApi.callSessions(params.id),
  });
  const realtimeSessions = useQuery({
    queryKey: ["voice-call-realtime-sessions", params.id],
    queryFn: () => authApi.callRealtimeSessions(params.id),
    refetchInterval: (query) =>
      query.state.data?.some((session) => ["CONNECTING", "CONNECTED"].includes(session.status))
        ? 3000
        : false,
  });
  const recordings = useQuery({
    queryKey: ["voice-call-recordings", params.id],
    queryFn: () => authApi.callRecordings({ callId: params.id }),
    refetchInterval: (query) =>
      query.state.data?.data.some((recording) =>
        ["PENDING", "RECORDING", "PROCESSING"].includes(recording.status),
      )
        ? 3000
        : false,
  });
  const transcript = useQuery({
    queryKey: ["voice-call-transcript", params.id],
    queryFn: () => authApi.callTranscriptByCall(params.id),
    refetchInterval: (query) =>
      ["PENDING", "PROCESSING"].includes(query.state.data?.status ?? "") ? 3000 : false,
  });
  const deleteRecording = useMutation({
    mutationFn: authApi.deleteCallRecording,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["voice-call-recordings", params.id] });
      void queryClient.invalidateQueries({ queryKey: ["voice-recordings"] });
      void queryClient.invalidateQueries({ queryKey: ["voice-dashboard"] });
    },
  });
  const setSelectedCall = useCallStore((state) => state.setSelectedCall);
  const setSessions = useCallSessionStore((state) => state.setSessions);
  const setRealtimeSessions = useRealtimeSessionStore((state) => state.setSessions);

  useEffect(() => {
    setSelectedCall(call.data ?? null);
  }, [call.data, setSelectedCall]);

  useEffect(() => {
    setSessions(sessions.data ?? []);
  }, [sessions.data, setSessions]);

  useEffect(() => {
    setRealtimeSessions(realtimeSessions.data ?? []);
  }, [realtimeSessions.data, setRealtimeSessions]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Call Details"
        description="Inspect the inbound Twilio call and its routing assignment."
        action={
          <Button asChild variant="outline">
            <Link href="/voice/calls">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </Link>
          </Button>
        }
      />

      {call.isLoading ? (
        <SkeletonBlock className="h-80" />
      ) : call.data ? (
        <>
          <section className="rounded-md border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-3">
              <PhoneCall className="h-5 w-5 text-zinc-500" aria-hidden="true" />
              <div>
                <h2 className="text-base font-semibold">{call.data.callerNumber}</h2>
                <p className="mt-1 text-sm text-zinc-500">{call.data.status}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <Detail label="Call SID" value={call.data.twilioCallSid} />
              <Detail label="Caller Number" value={call.data.callerNumber} />
              <Detail label="Called Number" value={call.data.calledNumber} />
              <Detail label="Assigned Agent" value={call.data.agent.name} />
              <Detail label="Direction" value={call.data.direction} />
              <Detail label="Started" value={new Date(call.data.startedAt).toLocaleString()} />
              <Detail
                label="Duration"
                value={call.data.durationSeconds ? `${call.data.durationSeconds}s` : "Pending"}
              />
              <Detail
                label="Phone Number"
                value={call.data.phoneNumber.friendlyName ?? call.data.phoneNumber.phoneNumber}
              />
              <Detail label="Created" value={new Date(call.data.createdAt).toLocaleString()} />
            </div>
          </section>

          <section className="rounded-md border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-zinc-500" aria-hidden="true" />
              <div>
                <h2 className="text-base font-semibold">OpenAI Realtime Sessions</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  AI voice connection state and bidirectional audio transport metrics.
                </p>
              </div>
            </div>

            <div className="mt-6">
              {realtimeSessions.isLoading ? <SkeletonBlock className="h-28" /> : null}
              {!realtimeSessions.isLoading && realtimeSessions.data?.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title="No AI voice session yet"
                  description="A realtime session appears when Twilio starts streaming an active call."
                />
              ) : null}
              <div className="space-y-3">
                {realtimeSessions.data?.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{session.agent.name}</p>
                        <p className="mt-1 break-all text-xs text-zinc-500">
                          {session.openAiSessionId ?? "OpenAI session pending"}
                        </p>
                      </div>
                      <span className="rounded-full border border-zinc-200 px-2 py-1 text-xs font-medium dark:border-zinc-800">
                        {session.status}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                      <Detail label="Audio In" value={String(session.audioPacketsSent)} />
                      <Detail label="Audio Out" value={String(session.audioPacketsReceived)} />
                      <Detail
                        label="Latency"
                        value={
                          session.lastLatencyMs === null ? "Pending" : `${session.lastLatencyMs}ms`
                        }
                      />
                      <Detail
                        label="Connected"
                        value={
                          session.connectedAt
                            ? new Date(session.connectedAt).toLocaleString()
                            : "Pending"
                        }
                      />
                      <Detail
                        label="Disconnected"
                        value={
                          session.disconnectedAt
                            ? new Date(session.disconnectedAt).toLocaleString()
                            : "Active"
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-md border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-3">
              <Radio className="h-5 w-5 text-zinc-500" aria-hidden="true" />
              <div>
                <h2 className="text-base font-semibold">Media Stream Information</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Realtime Twilio Media Stream sessions for this call.
                </p>
              </div>
            </div>

            <div className="mt-6">
              {sessions.isLoading ? <SkeletonBlock className="h-24" /> : null}
              {!sessions.isLoading && sessions.data?.length === 0 ? (
                <EmptyState
                  icon={Radio}
                  title="No media streams yet"
                  description="Twilio stream sessions will appear here after the webhook connects."
                />
              ) : null}
              <div className="space-y-3">
                {sessions.data?.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="break-all text-sm font-medium">
                        {session.streamSid ?? "Connecting"}
                      </p>
                      <span className="rounded-full border border-zinc-200 px-2 py-1 text-xs font-medium dark:border-zinc-800">
                        {session.status}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <Detail label="Packet Count" value={String(session.packetCount)} />
                      <Detail
                        label="Connected"
                        value={
                          session.connectedAt
                            ? new Date(session.connectedAt).toLocaleString()
                            : "Pending"
                        }
                      />
                      <Detail
                        label="Disconnected"
                        value={
                          session.disconnectedAt
                            ? new Date(session.disconnectedAt).toLocaleString()
                            : "Active"
                        }
                      />
                      <Detail label="Duration" value={formatDuration(session)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-3">
            <RecordingPanel
              loading={recordings.isLoading}
              recordings={recordings.data?.data ?? []}
              onDelete={(recordingId) => deleteRecording.mutate(recordingId)}
              deleting={deleteRecording.isPending}
            />
            <TranscriptPanel loading={transcript.isLoading} transcript={transcript.data ?? null} />
          </section>
        </>
      ) : (
        <EmptyState
          icon={PhoneCall}
          title="Call not found"
          description="This call may belong to another workspace or no longer be available."
        />
      )}
    </div>
  );
}

function RecordingPanel({
  loading,
  recordings,
  onDelete,
  deleting,
}: {
  loading: boolean;
  recordings: Array<{
    id: string;
    fileName: string;
    status: string;
    durationSeconds: number | null;
    fileSizeBytes: number | null;
    recordingCompletedAt: string | null;
    createdAt: string;
  }>;
  onDelete: (recordingId: string) => void;
  deleting: boolean;
}) {
  const download = useMutation({
    mutationFn: authApi.callRecordingDownload,
    onSuccess: (access) => {
      window.open(access.url, "_blank", "noopener,noreferrer");
    },
  });

  return (
    <div className="rounded-md border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-3">
        <FileAudio className="h-5 w-5 text-zinc-500" aria-hidden="true" />
        <div>
          <h2 className="text-base font-semibold">Recording</h2>
          <p className="mt-1 text-sm text-zinc-500">Asynchronous playback and storage status.</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {loading ? <SkeletonBlock className="h-24" /> : null}
        {!loading && recordings.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No recording has been finalized for this call yet.
          </p>
        ) : null}
        {recordings.map((recording) => (
          <div key={recording.id} className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{recording.fileName}</p>
                <p className="mt-1 text-xs text-zinc-500">{recording.status}</p>
              </div>
              <div className="flex items-center gap-2">
                <PlaybackButton recordingId={recording.id} disabled={recording.status !== "AVAILABLE"} />
                <Button
                  variant="outline"
                  size="icon"
                  disabled={recording.status !== "AVAILABLE" || download.isPending}
                  onClick={() => download.mutate(recording.id)}
                  aria-label="Download recording"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={deleting || recording.status === "DELETED"}
                  onClick={() => {
                    if (window.confirm("Delete this recording?")) {
                      onDelete(recording.id);
                    }
                  }}
                  aria-label="Delete recording"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <Detail label="Duration" value={formatRecordingDuration(recording.durationSeconds)} />
              <Detail label="Size" value={formatBytes(recording.fileSizeBytes)} />
              <Detail
                label="Completed"
                value={
                  recording.recordingCompletedAt
                    ? new Date(recording.recordingCompletedAt).toLocaleString()
                    : "Processing"
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlaybackButton({ recordingId, disabled }: { recordingId: string; disabled: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  const access = useMutation({
    mutationFn: authApi.callRecordingDownload,
    onSuccess: (result) => setUrl(result.url),
  });

  if (url) {
    return <audio controls src={url} className="h-9 w-44" />;
  }

  return (
    <Button variant="outline" disabled={disabled || access.isPending} onClick={() => access.mutate(recordingId)}>
      Play
    </Button>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-zinc-500">{label}</p>
      <p className="mt-1 break-all text-sm font-medium">{value}</p>
    </div>
  );
}

function formatDuration(session: { connectedAt: string | null; disconnectedAt: string | null }) {
  if (!session.connectedAt) {
    return "Pending";
  }

  const end = session.disconnectedAt ? new Date(session.disconnectedAt) : new Date();
  const started = new Date(session.connectedAt);
  return `${Math.max(0, Math.round((end.getTime() - started.getTime()) / 1000))}s`;
}

function formatRecordingDuration(value: number | null) {
  return value === null ? "Pending" : `${value}s`;
}

function formatBytes(value: number | null) {
  if (value === null) {
    return "Pending";
  }
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function TranscriptPanel({
  loading,
  transcript,
}: {
  loading: boolean;
  transcript: Awaited<ReturnType<typeof authApi.callTranscriptByCall>> | null;
}) {
  if (loading) {
    return <SkeletonBlock className="h-48 md:col-span-2" />;
  }

  return (
    <div className="rounded-md border border-zinc-200 p-6 dark:border-zinc-800 md:col-span-2">
      <div className="flex items-center justify-between gap-4">
        <div>
          <FileText className="h-5 w-5 text-zinc-400" aria-hidden="true" />
          <h2 className="mt-3 text-sm font-semibold">Transcript and Summary</h2>
        </div>
        {transcript ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/voice/transcripts/${transcript.id}`}>View transcript</Link>
          </Button>
        ) : null}
      </div>
      {transcript ? (
        <>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500">
            <span>{transcript.status}</span>
            <span>{transcript.wordCount.toLocaleString()} words</span>
            <span>{transcript.segmentCount} segments</span>
          </div>
          <p className="mt-4 line-clamp-5 whitespace-pre-wrap text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {transcript.summary ??
              (transcript.status === "FAILED"
                ? transcript.failureReason
                : "Transcription is processing in the background.")}
          </p>
        </>
      ) : (
        <p className="mt-4 text-sm text-zinc-500">
          A transcript will appear automatically after the recording is uploaded.
        </p>
      )}
    </div>
  );
}
