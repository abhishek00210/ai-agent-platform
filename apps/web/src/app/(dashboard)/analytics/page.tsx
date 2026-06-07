import { PageHeader } from "@/components/layout/page-header";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Reporting surfaces are reserved for call quality, agent performance, and billing events."
      />
      <div className="rounded-md border border-dashed border-zinc-300 p-10 text-sm text-zinc-500 dark:border-zinc-700">
        Analytics implementation placeholder.
      </div>
    </div>
  );
}
