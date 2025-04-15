import { DashboardLayout } from "@/components/dashboard-layout";
import { NotificationsContent } from "@/components/notifications-content";

export default function NotificationsPage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <DashboardLayout locale={locale}>
      <NotificationsContent />
    </DashboardLayout>
  );
} 