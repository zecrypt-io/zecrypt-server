"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { SSHKeysContent } from "@/components/ssh-keys-content";

export default function SSHKeysPage() {
  return (
    <DashboardLayout locale="en">
      <SSHKeysContent />
    </DashboardLayout>
  );
}


