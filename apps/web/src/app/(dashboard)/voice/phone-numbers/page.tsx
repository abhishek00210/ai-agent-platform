"use client";

import type { PhoneNumberDetails, PhoneNumberStatus } from "@ai-agent-platform/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Phone, RefreshCcw, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button, cn } from "@ai-agent-platform/ui";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonBlock } from "@/components/layout/page-loader";
import { formatAgentStatus } from "@/lib/agent-options";
import { authApi } from "@/lib/auth-api";

const statuses: Array<"ALL" | PhoneNumberStatus> = ["ALL", "ACTIVE", "UNASSIGNED", "INACTIVE"];

export default function PhoneNumbersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | PhoneNumberStatus>("ALL");
  const [assigning, setAssigning] = useState<PhoneNumberDetails | null>(null);

  const phoneNumbers = useQuery({
    queryKey: ["phone-numbers", { search, status }],
    queryFn: () =>
      authApi.phoneNumbers({
        search: search || undefined,
        status: status === "ALL" ? undefined : status,
        limit: 50,
      }),
  });
  const agents = useQuery({
    queryKey: ["agents", "phone-number-options"],
    queryFn: () => authApi.agents({ limit: 100 }),
  });
  const activeAgents = useMemo(
    () => agents.data?.data.filter((agent) => agent.status !== "INACTIVE") ?? [],
    [agents.data?.data],
  );

  const sync = useMutation({
    mutationFn: authApi.syncPhoneNumbers,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["phone-numbers"] });
      void queryClient.invalidateQueries({ queryKey: ["voice-dashboard"] });
    },
  });
  const assign = useMutation({
    mutationFn: (input: { phoneNumberId: string; agentId: string }) =>
      authApi.assignPhoneNumberAgent(input.phoneNumberId, { agentId: input.agentId }),
    onSuccess: () => {
      setAssigning(null);
      void queryClient.invalidateQueries({ queryKey: ["phone-numbers"] });
      void queryClient.invalidateQueries({ queryKey: ["voice-dashboard"] });
    },
  });
  const unassign = useMutation({
    mutationFn: authApi.unassignPhoneNumber,
    onSuccess: () => {
      setAssigning(null);
      void queryClient.invalidateQueries({ queryKey: ["phone-numbers"] });
      void queryClient.invalidateQueries({ queryKey: ["voice-dashboard"] });
    },
  });
  const enable = useMutation({
    mutationFn: authApi.enablePhoneNumber,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["phone-numbers"] });
      void queryClient.invalidateQueries({ queryKey: ["voice-dashboard"] });
    },
  });
  const disable = useMutation({
    mutationFn: authApi.disablePhoneNumber,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["phone-numbers"] });
      void queryClient.invalidateQueries({ queryKey: ["voice-dashboard"] });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phone Numbers"
        description="Sync Twilio numbers, manage status, and assign numbers to AI agents."
        action={
          <Button disabled={sync.isPending} onClick={() => sync.mutate()}>
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Sync Twilio Numbers
          </Button>
        }
      />

      <section className="rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              className={inputClassName + " pl-9"}
              placeholder="Search number, name, or country"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select
            className={inputClassName + " md:w-48"}
            value={status}
            onChange={(event) => setStatus(event.target.value as "ALL" | PhoneNumberStatus)}
          >
            {statuses.map((option) => (
              <option key={option} value={option}>
                {option === "ALL" ? "All statuses" : formatStatus(option)}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-3 font-medium">Phone Number</th>
                <th className="px-6 py-3 font-medium">Assigned Agent</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Country</th>
                <th className="px-6 py-3 font-medium">Capabilities</th>
                <th className="px-6 py-3 font-medium">Created</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {phoneNumbers.isLoading ? <RowsSkeleton /> : null}
              {phoneNumbers.data?.data.map((number) => (
                <tr key={number.id}>
                  <td className="px-6 py-4">
                    <div className="font-medium">{number.phoneNumber}</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {number.friendlyName ?? number.twilioSid}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {number.agent ? (
                      <div>
                        <div className="font-medium">{number.agent.name}</div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {formatAgentStatus(number.agent.status)} · {number.agent.language}
                        </div>
                      </div>
                    ) : (
                      <span className="text-zinc-500">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={number.status} />
                  </td>
                  <td className="px-6 py-4 text-zinc-500">{number.country ?? "Unknown"}</td>
                  <td className="px-6 py-4">
                    <Capabilities capabilities={number.capabilities} />
                  </td>
                  <td className="px-6 py-4 text-zinc-500">
                    {new Date(number.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/voice/phone-numbers/${number.id}`}>
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          View
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setAssigning(number)}>
                        Assign
                      </Button>
                      {number.status === "INACTIVE" ? (
                        <Button
                          size="sm"
                          disabled={enable.isPending}
                          onClick={() => enable.mutate(number.id)}
                        >
                          Enable
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={disable.isPending}
                          onClick={() => disable.mutate(number.id)}
                        >
                          Disable
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!phoneNumbers.isLoading && phoneNumbers.data?.data.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Phone}
              title="No phone numbers synced"
              description="Verify Twilio credentials, then sync numbers from your Twilio account."
            />
          </div>
        ) : null}
      </section>

      {assigning ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-md border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-base font-semibold">Assign Agent</h2>
            <p className="mt-1 text-sm text-zinc-500">{assigning.phoneNumber}</p>
            <div className="mt-5 space-y-3">
              {activeAgents.map((agent) => (
                <button
                  key={agent.id}
                  className="flex w-full items-center justify-between rounded-md border border-zinc-200 px-4 py-3 text-left transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                  onClick={() => assign.mutate({ phoneNumberId: assigning.id, agentId: agent.id })}
                >
                  <span>
                    <span className="block font-medium">{agent.name}</span>
                    <span className="mt-1 block text-xs text-zinc-500">
                      {formatAgentStatus(agent.status)} · {agent.language}
                    </span>
                  </span>
                  <span className="text-xs text-zinc-500">{agent.voice}</span>
                </button>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              {assigning.agentId ? (
                <Button
                  variant="outline"
                  disabled={unassign.isPending}
                  onClick={() => unassign.mutate(assigning.id)}
                >
                  Unassign
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => setAssigning(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const inputClassName =
  "h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600";

function StatusBadge({ status }: { status: PhoneNumberStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-1 text-xs font-medium",
        status === "ACTIVE" &&
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        status === "UNASSIGNED" &&
          "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
        status === "INACTIVE" && "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300",
      )}
    >
      {formatStatus(status)}
    </span>
  );
}

function Capabilities({ capabilities }: { capabilities: PhoneNumberDetails["capabilities"] }) {
  const items = [
    capabilities.voice ? "Voice" : null,
    capabilities.sms ? "SMS" : null,
    capabilities.mms ? "MMS" : null,
  ].filter(Boolean);
  return <span className="text-zinc-500">{items.length ? items.join(", ") : "None"}</span>;
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

function formatStatus(status: PhoneNumberStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
