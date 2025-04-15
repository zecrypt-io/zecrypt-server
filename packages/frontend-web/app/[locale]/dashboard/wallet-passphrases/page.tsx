import { DashboardLayout } from "@/components/dashboard-layout";
import { WalletPassphrasesContent } from "@/components/wallet-passphrases-content";

export default function WalletPassphrasesPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;
  
  return (
    <DashboardLayout locale={locale}>
      <WalletPassphrasesContent />
    </DashboardLayout>
  );
} 