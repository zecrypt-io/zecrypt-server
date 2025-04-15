import { DashboardLayout } from "@/components/dashboard-layout";
import { WalletPassphrasesContent } from "@/components/wallet-passphrases-content";

export default function WalletPassphrasesPage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <DashboardLayout locale={locale}>
      <WalletPassphrasesContent />
    </DashboardLayout>
  );
} 