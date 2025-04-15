import { DashboardLayout } from "@/components/dashboard-layout"
import { LocalizedOverviewContent } from "@/components/localized-overview-content";

export default async function DashboardPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;
  
  return (
    <DashboardLayout locale={locale}>
      <LocalizedOverviewContent />
    </DashboardLayout>
  )
} 