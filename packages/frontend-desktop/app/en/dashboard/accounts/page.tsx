"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { AccountsContent } from "@/components/accounts-content";

export default function AccountsPage() {
  return (
    <DashboardLayout locale="en">
      <AccountsContent />
    </DashboardLayout>
  );
}


