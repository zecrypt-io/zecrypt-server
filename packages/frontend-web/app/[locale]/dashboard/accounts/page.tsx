import { DashboardLayout } from "@/components/dashboard-layout";
import { AccountsContent } from "@/components/accounts-content";

export default function AccountsPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;
  
  return (
    <DashboardLayout locale={locale}>
      <AccountsContent />
    </DashboardLayout>
  );
} 