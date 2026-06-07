import { BookMarked } from "lucide-react";
import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export default function BookingsPage() {
  return (
    <RoutePlaceholder
      title="Bookings"
      description="Manage future appointment requests created from conversations."
      icon={BookMarked}
      actionLabel="Bookings pending"
    />
  );
}
