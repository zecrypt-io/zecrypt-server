import { DashboardLayout } from "@/components/dashboard-layout";
import { LicensesContent } from "@/components/licenses-content";

export default async function SoftwareLicensesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <DashboardLayout locale={locale}>
      <LicensesContent />
    </DashboardLayout>
  );
}