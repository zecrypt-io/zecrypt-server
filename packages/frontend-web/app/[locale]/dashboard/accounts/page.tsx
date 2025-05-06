import { DashboardLayout } from "@/components/dashboard-layout";
import { AccountsContent } from "@/components/accounts-content";

export default async function AccountsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; // Await params
  
  return (
    <DashboardLayout locale={locale}>
      <AccountsContent />
    </DashboardLayout>
  );
}