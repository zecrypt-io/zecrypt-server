import { DashboardLayout } from "@/components/dashboard-layout";
import { SSHKeysContent } from "@/components/ssh-keys-content";

export default async function SSHKeysPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  return (
    <DashboardLayout locale={locale}>
      <SSHKeysContent />
    </DashboardLayout>
  );
} 