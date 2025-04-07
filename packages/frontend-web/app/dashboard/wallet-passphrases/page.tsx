import type { Metadata } from "next"
import { DashboardLayout } from "@/components/dashboard-layout"
import { WalletPassphrasesContent } from "@/components/wallet-passphrases-content"

export const metadata: Metadata = {
  title: "Wallet Passphrases | Zecrypt",
  description: "Securely store and manage your cryptocurrency wallet passphrases.",
}

export default function WalletPassphrasesPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-2 p-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Wallet Passphrases</h2>
          <p className="text-muted-foreground">Securely store and manage your cryptocurrency wallet passphrases.</p>
        </div>
        <WalletPassphrasesContent />
      </div>
    </DashboardLayout>
  )
}

