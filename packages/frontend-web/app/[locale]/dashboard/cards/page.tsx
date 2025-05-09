import { DashboardLayout } from "@/components/dashboard-layout";
import { CardsContent } from "@/components/cards-content";

export default async function CardsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <DashboardLayout locale={locale}>
      <CardsContent />
    </DashboardLayout>
  );
}