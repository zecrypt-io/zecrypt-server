"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { UserSettingsContent } from "@/components/user-settings-content";

export default function UserSettingsPage() {
  return (
    <DashboardLayout locale="en">
      <UserSettingsContent />
    </DashboardLayout>
  );
}


