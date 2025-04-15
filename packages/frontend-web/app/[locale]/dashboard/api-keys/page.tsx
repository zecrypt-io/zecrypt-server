import { DashboardLayout } from "@/components/dashboard-layout";
import { ApiKeysContent } from "@/components/api-keys-content";

export default function ApiKeysPage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <DashboardLayout locale={locale}>
      <ApiKeysContent />
    </DashboardLayout>
  );
} 