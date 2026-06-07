import { PageHeader } from "@/components/layout/page-header";

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Agents"
        description="Agent creation, prompts, voices, and publishing will be implemented after the foundation is stable."
      />
      <PlaceholderTable labels={["Name", "Language", "Voice", "Status"]} />
    </div>
  );
}

function PlaceholderTable({ labels }: { labels: string[] }) {
  return (
    <div className="overflow-hidden rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="grid grid-cols-4 gap-4 border-b border-zinc-200 px-4 py-3 text-xs font-medium uppercase text-zinc-500 dark:border-zinc-800">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="px-4 py-10 text-center text-sm text-zinc-500">No agents yet.</div>
    </div>
  );
}
