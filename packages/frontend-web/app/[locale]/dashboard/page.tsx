import { DashboardLayout } from "@/components/dashboard-layout"
import { LocalizedOverviewContent } from "@/components/localized-overview-content";

export default function DashboardPage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <DashboardLayout locale={locale}>
      <LocalizedOverviewContent />
    </DashboardLayout>
  )
} 