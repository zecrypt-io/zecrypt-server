import { DashboardLayout } from "@/components/dashboard-layout";
import { DriveContent } from "@/components/drive-content";

export default async function DrivePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  return (
    <DashboardLayout locale={locale}>
      <DriveContent />
    </DashboardLayout>
  );
}

