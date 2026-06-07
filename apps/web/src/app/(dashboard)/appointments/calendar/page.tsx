import { CalendarDays } from "lucide-react";
import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export default function CalendarPage() {
  return (
    <RoutePlaceholder
      title="Calendar"
      description="View future scheduled appointments and agent-assisted bookings."
      icon={CalendarDays}
      actionLabel="Calendar pending"
    />
  );
}
