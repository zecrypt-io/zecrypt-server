import { DashboardLayout } from "@/components/dashboard-layout";
// Adjust the import based on your actual content component
import { WalletPassphrasesContent } from "@/components/wallet-passphrases-content";

export default async function WalletPassphrasesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; // Await params

  return (
    <DashboardLayout locale={locale}>
      <WalletPassphrasesContent />
    </DashboardLayout>
  );
}