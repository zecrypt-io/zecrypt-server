import { DashboardLayout } from "@/components/dashboard-layout";
import { NotesContent } from "@/components/notes-content";

export default async function AccountsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; // Await params
  
  return (
    <DashboardLayout locale={locale}>
      <NotesContent />
    </DashboardLayout>
  );
}