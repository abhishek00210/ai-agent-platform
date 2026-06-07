import { PageHeader } from "@/components/layout/page-header";
import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Organization, profile, security, and integration settings will land here."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/settings/organization"
          className="rounded-md border border-zinc-200 bg-white p-5 transition-colors hover:border-teal-600 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <h2 className="text-sm font-semibold">Organization</h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Manage tenant details and members.
          </p>
        </Link>
        {["Security", "Integrations", "Team"].map((item) => (
          <div
            key={item}
            className="rounded-md border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <h2 className="text-sm font-semibold">{item}</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Placeholder route section.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
