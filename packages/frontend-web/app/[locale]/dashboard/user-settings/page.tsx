import { UserSettingsContent } from "@/components/user-settings-content";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function UserSettingsPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;
  
  return (
    <DashboardLayout locale={locale}>
      <UserSettingsContent />
    </DashboardLayout>
  );
} 