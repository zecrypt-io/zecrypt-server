import { DashboardLayout } from "@/components/dashboard-layout";
import { LocalizedOverviewContent } from "@/components/localized-overview-content";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; // Await params
  
  return (
    <DashboardLayout locale={locale}>
      <LocalizedOverviewContent />
    </DashboardLayout>
  );
}