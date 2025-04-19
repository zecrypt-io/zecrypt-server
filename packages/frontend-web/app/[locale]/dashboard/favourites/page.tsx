import { DashboardLayout } from "@/components/dashboard-layout";
import { FavouritesContent } from "@/components/favourites-content";

export default function FavouritesPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;
  
  return (
    <DashboardLayout locale={locale}>
      <FavouritesContent />
    </DashboardLayout>
  );
} 