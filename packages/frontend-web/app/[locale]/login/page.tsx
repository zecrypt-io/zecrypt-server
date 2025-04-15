import { LoginPage } from "@/components/login-page"

export default function LocalizedLoginPage({ params: { locale } }: { params: { locale: string } }) {
  return <LoginPage locale={locale} />
} 