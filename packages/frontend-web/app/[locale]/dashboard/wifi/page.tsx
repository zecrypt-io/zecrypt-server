import { DashboardLayout } from "@/components/dashboard-layout";
import { WifiContent } from "@/components/wifi-content";

export default async function WifiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <DashboardLayout locale={locale}>
      <WifiContent />
    </DashboardLayout>
  );
}