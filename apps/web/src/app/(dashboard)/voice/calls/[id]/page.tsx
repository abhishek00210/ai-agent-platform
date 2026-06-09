"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileAudio, FileText, PhoneCall, Radio, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
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
            <FuturePanel icon={FileAudio} title="Recording" />
            <FuturePanel icon={FileText} title="Transcript" />
            <FuturePanel icon={Sparkles} title="AI Summary" />
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

function FuturePanel({ icon: Icon, title }: { icon: typeof FileAudio; title: string }) {
  return (
    <div className="rounded-md border border-dashed border-zinc-200 p-6 dark:border-zinc-800">
      <Icon className="h-5 w-5 text-zinc-400" aria-hidden="true" />
      <h2 className="mt-4 text-sm font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-zinc-500">Available in a later voice phase.</p>
    </div>
  );
}
