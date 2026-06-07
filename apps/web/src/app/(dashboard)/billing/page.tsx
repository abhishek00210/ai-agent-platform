import { PageHeader } from "@/components/layout/page-header";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Stripe configuration and module boundaries are ready; subscriptions are not implemented yet."
      />
      <div className="rounded-md border border-zinc-200 bg-white p-6 text-sm dark:border-zinc-800 dark:bg-zinc-950">
        Current plan: Free foundation workspace
      </div>
    </div>
  );
}
