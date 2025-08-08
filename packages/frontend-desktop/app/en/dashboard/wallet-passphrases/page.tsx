"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { WalletPassphrasesContent } from "@/components/wallet-passphrases-content";

export default function WalletPassphrasesPage() {
  return (
    <DashboardLayout locale="en">
      <WalletPassphrasesContent />
    </DashboardLayout>
  );
}


