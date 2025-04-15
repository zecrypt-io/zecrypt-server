import { DashboardLayout } from "@/components/dashboard-layout";
import { ApiKeysContent } from "@/components/api-keys-content";

export default function ApiKeysPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;
  
  return (
    <DashboardLayout locale={locale}>
      <ApiKeysContent />
    </DashboardLayout>
  );
} 