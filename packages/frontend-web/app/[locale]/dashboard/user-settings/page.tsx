import { UserSettingsContent } from "@/components/user-settings-content";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function UserSettingsPage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <DashboardLayout locale={locale}>
      <UserSettingsContent />
    </DashboardLayout>
  );
} 