import { DashboardLayout } from "@/components/dashboard-layout";
import { FavouritesContent } from "@/components/favourites-content";

export default function FavouritesPage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <DashboardLayout locale={locale}>
      <FavouritesContent />
    </DashboardLayout>
  );
} 