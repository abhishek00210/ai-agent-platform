import { PageHeader } from "@/components/layout/page-header";
import { StatusList } from "@/components/layout/status-list";

export default function VoicePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Voice"
        description="Twilio and OpenAI Realtime integration boundaries are present for future call orchestration."
      />
      <StatusList
        items={[
          { label: "Twilio", value: "Stub", detail: "Config schema ready" },
          { label: "Realtime", value: "Stub", detail: "Model config ready" },
          { label: "Queues", value: "Prepared", detail: "Redis connection available" },
          { label: "Sessions", value: "Prepared", detail: "No call flows yet" },
        ]}
      />
    </div>
  );
}
