import { PhoneCall } from "lucide-react";
import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export default function CallsPage() {
  return (
    <RoutePlaceholder
      title="Calls"
      description="Monitor future inbound and outbound voice call sessions."
      icon={PhoneCall}
      actionLabel="Call logs pending"
    />
  );
}
