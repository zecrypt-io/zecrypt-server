"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { EnvContent } from "@/components/env-content";

export default function EnvironmentsPage() {
  return (
    <DashboardLayout locale="en">
      <EnvContent />
    </DashboardLayout>
  );
}
