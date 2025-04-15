import { redirect } from 'next/navigation';

export default function LocalePage({ params: { locale } }: { params: { locale: string } }) {
  // Redirect to the login page
  redirect(`/${locale}/login`);
} 