import { DashboardLayout } from "@/components/dashboard-layout";
import { IdentityContent } from "@/components/identity-content";

export default async function IdentityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <DashboardLayout locale={locale}>
      <IdentityContent />
    </DashboardLayout>
  );
}