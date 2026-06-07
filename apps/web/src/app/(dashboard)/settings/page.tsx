import { PageHeader } from "@/components/layout/page-header";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Organization, profile, security, and integration settings will land here."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {["Organization", "Security", "Integrations", "Team"].map((item) => (
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
