"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { NotesContent } from "@/components/notes-content";

export default function NotesPage() {
  return (
    <DashboardLayout locale="en">
      <NotesContent />
    </DashboardLayout>
  );
}


