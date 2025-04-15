import { DashboardLayout } from "@/components/dashboard-layout";
import { AccountsContent } from "@/components/accounts-content";

export default function AccountsPage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <DashboardLayout locale={locale}>
      <AccountsContent />
    </DashboardLayout>
  );
} 