import { LoginPage } from "@/components/login-page";

export default async function LocalizedLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LoginPage locale={locale} />;
}