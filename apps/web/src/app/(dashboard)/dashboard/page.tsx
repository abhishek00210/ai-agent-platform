import { Button } from "@ai-agent-platform/ui";
import { Bot, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatusList } from "@/components/layout/status-list";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        description="Monitor the foundation services for voice agents, telephony, billing, and storage."
        action={
          <Button>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New agent
          </Button>
        }
      />
      <StatusList
        items={[
          { label: "Agents", value: "0", detail: "No business features yet" },
          { label: "Voice sessions", value: "0", detail: "Realtime structure ready" },
          { label: "API status", value: "Ready", detail: "Health endpoint configured" },
          { label: "Billing", value: "Stripe", detail: "Provider shell installed" },
        ]}
      />
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-md border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <Bot className="h-5 w-5 text-teal-700 dark:text-teal-300" />
            <h2 className="text-base font-semibold">Foundation checklist</h2>
          </div>
          <div className="mt-5 divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
            {[
              "Auth structure",
              "Prisma schema",
              "Redis connection",
              "Twilio boundary",
              "OpenAI Realtime boundary",
            ].map((item) => (
              <div key={item} className="flex items-center justify-between py-3">
                <span>{item}</span>
                <span className="text-xs font-medium text-teal-700 dark:text-teal-300">Ready</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-base font-semibold">Next implementation lane</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Start with organization membership and auth flows before introducing live voice calls.
          </p>
        </div>
      </section>
    </div>
  );
}
