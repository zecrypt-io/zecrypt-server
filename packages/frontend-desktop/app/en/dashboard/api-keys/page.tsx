"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { ApiKeysContent } from "@/components/api-keys-content";

export default function ApiKeysPage() {
  return (
    <DashboardLayout locale="en">
      <ApiKeysContent />
    </DashboardLayout>
  );
}


