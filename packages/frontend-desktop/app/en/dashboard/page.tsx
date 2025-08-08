"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { OverviewContent } from "@/components/overview-content";

export default function DashboardHomePage() {
  return (
    <DashboardLayout locale="en">
      <OverviewContent />
    </DashboardLayout>
  );
}


