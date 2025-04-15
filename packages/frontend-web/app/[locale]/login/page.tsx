import { LoginPage } from "@/components/login-page"

export default function LocalizedLoginPage({ params }: { params: { locale: string } }) {
  const locale = params.locale;
  return <LoginPage locale={locale} />
} 