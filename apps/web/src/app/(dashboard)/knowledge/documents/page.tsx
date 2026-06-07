import { FileText } from "lucide-react";
import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export default function DocumentsPage() {
  return (
    <RoutePlaceholder
      title="Documents"
      description="Prepare document-based knowledge sources for future voice agent retrieval workflows."
      icon={FileText}
      actionLabel="Upload flow pending"
    />
  );
}
