import { redirect } from 'next/navigation';
import { defaultLocale } from '../middleware';

// Redirect to the login page with the default locale
export default function RootPage() {
  redirect(`/${defaultLocale}/login`);
}

