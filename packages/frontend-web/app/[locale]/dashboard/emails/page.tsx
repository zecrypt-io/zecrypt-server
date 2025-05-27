import { DashboardLayout } from "@/components/dashboard-layout";
import { EmailsContent } from "@/components/emails-content";

export default async function EmailsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  return (
    <DashboardLayout locale={locale}>
      <EmailsContent />
    </DashboardLayout>
  );
} 