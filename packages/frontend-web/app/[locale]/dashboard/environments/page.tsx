"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { EnvContentWrapper } from "@/components/env-content-wrapper";
import { use } from "react";

export default function EnvPage({ params }: { params: Promise<{ locale: string }> }) {
  // Properly unwrap the params Promise using React.use
  const { locale } = use(params);
  
  return (
    <DashboardLayout locale={locale}>
      <EnvContentWrapper />
    </DashboardLayout>
  );
} 