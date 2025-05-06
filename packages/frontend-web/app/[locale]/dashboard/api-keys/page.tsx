import { DashboardLayout } from "@/components/dashboard-layout";
import { ApiKeysContent } from "@/components/api-keys-content";

export default async function ApiKeysPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <DashboardLayout locale={locale}>
      <ApiKeysContent />
    </DashboardLayout>
  );
}