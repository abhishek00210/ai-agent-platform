import { Phone } from "lucide-react";
import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export default function PhoneNumbersPage() {
  return (
    <RoutePlaceholder
      title="Phone numbers"
      description="Manage future Twilio numbers and routing configuration for this tenant."
      icon={Phone}
      actionLabel="Number setup pending"
    />
  );
}
