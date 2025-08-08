"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { LicensesContent } from "@/components/licenses-content";

export default function SoftwareLicensesPage() {
  return (
    <DashboardLayout locale="en">
      <LicensesContent />
    </DashboardLayout>
  );
}


