import { DashboardLayout } from "@/components/dashboard-layout";
import { NotificationsContent } from "@/components/notifications-content";

export default function NotificationsPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;
  
  return (
    <DashboardLayout locale={locale}>
      <NotificationsContent />
    </DashboardLayout>
  );
} 