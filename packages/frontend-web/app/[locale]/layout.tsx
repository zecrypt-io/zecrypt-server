import type React from "react"
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "../../stack";
import { Inter } from "next/font/google"
import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';

const inter = Inter({ subsets: ["latin"] })

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'app' });
  
  return {
    title: t('title'),
    description: t('description'),
    generator: 'v0.dev'
  };
}

// Special Next.js function to set the locale
export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'fr' }, { locale: 'es' }];
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  // Load messages for the current locale
  let messages;
  try {
    messages = (await import(`../../messages/${locale}/common.json`)).default;
  } catch (error) {
    // Fallback to English if the locale's messages aren't available
    messages = (await import(`../../messages/en/common.json`)).default;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <NextIntlClientProvider locale={locale} messages={messages}>
        <StackProvider app={stackServerApp}>
          <StackTheme>
            <main className={inter.className}>
              {children}
            </main>
          </StackTheme>
        </StackProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  )
} 