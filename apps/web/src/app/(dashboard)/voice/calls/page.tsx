"use client";

import type { CallStatus } from "@ai-agent-platform/types";
import { useQuery } from "@tanstack/react-query";
import { Eye, PhoneCall, Search } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button, cn } from "@ai-agent-platform/ui";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonBlock } from "@/components/layout/page-loader";
import { authApi } from "@/lib/auth-api";
import { useCallStore } from "@/store/call-store";

const statuses: Array<"ALL" | CallStatus> = [
  "ALL",
  "RINGING",
  "ROUTING",
  "CONNECTED",
  "COMPLETED",
  "FAILED",
  "MISSED",
];

export default function CallsPage() {
  const { search, status, setCalls, setLoading, setSearch, setStatus } = useCallStore();
  const calls = useQuery({
    queryKey: ["voice-calls", { search, status }],
    queryFn: () =>
      authApi.calls({
        search: search || undefined,
        status: status === "ALL" ? undefined : status,
        limit: 50,
      }),
  });

  useEffect(() => {
    setCalls(calls.data ?? null);
    setLoading(calls.isLoading);
  }, [calls.data, calls.isLoading, setCalls, setLoading]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calls"
        description="Review inbound call webhooks, routing status, and assigned AI agents."
      />

      <section className="rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              className={inputClassName + " pl-9"}
              placeholder="Search caller, called number, or SID"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select
            className={inputClassName + " md:w-48"}
            value={status}
            onChange={(event) => setStatus(event.target.value as "ALL" | CallStatus)}
          >
            {statuses.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "All statuses" : formatStatus(option)}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-3 font-medium">Caller</th>
                <th className="px-6 py-3 font-medium">Called Number</th>
                <th className="px-6 py-3 font-medium">Assigned Agent</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Started</th>
                <th className="px-6 py-3 font-medium">Duration</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {calls.isLoading ? <RowsSkeleton /> : null}
              {calls.data?.data.map((call) => (
                <tr key={call.id}>
                  <td className="px-6 py-4">
                    <div className="font-medium">{call.callerNumber}</div>
                    <div className="mt-1 text-xs text-zinc-500">{call.twilioCallSid}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div>{call.calledNumber}</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {call.phoneNumber.friendlyName ?? call.phoneNumber.phoneNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4">{call.agent.name}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={call.status} />
                  </td>
                  <td className="px-6 py-4 text-zinc-500">
                    {new Date(call.startedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-zinc-500">
                    {call.durationSeconds ? `${call.durationSeconds}s` : "Pending"}
                  </td>
                  <td className="px-6 py-4">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/voice/calls/${call.id}`}>
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        View
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!calls.isLoading && calls.data?.data.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={PhoneCall}
              title="No calls yet"
              description="Inbound calls will appear here after Twilio sends voice webhooks."
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}

const inputClassName =
  "h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600";

function StatusBadge({ status }: { status: CallStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-1 text-xs font-medium",
        ["ROUTING", "CONNECTED"].includes(status) &&
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        ["RINGING"].includes(status) && "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
        ["FAILED", "MISSED"].includes(status) &&
          "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
        status === "COMPLETED" && "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300",
      )}
    >
      {formatStatus(status)}
    </span>
  );
}

function RowsSkeleton() {
  return Array.from({ length: 4 }).map((_, index) => (
    <tr key={index}>
      {Array.from({ length: 7 }).map((__, cell) => (
        <td key={cell} className="px-6 py-4">
          <SkeletonBlock className="h-5" />
        </td>
      ))}
    </tr>
  ));
}

function formatStatus(status: CallStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
