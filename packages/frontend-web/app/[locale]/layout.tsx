import type React from "react";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "../../stack";
import { Inter } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import ReduxProvider from "../../libs/Redux/ReduxProvider";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app" });

  return {
    title: t("title"),
    description: t("description"),
    generator: "v0.dev",
  };
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "fr" }, { locale: "es" }];
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  let messages;
  try {
    messages = (await import(`../../messages/${locale}/common.json`)).default;
  } catch (error) {
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
              <ReduxProvider>
                {children}
              </ReduxProvider>
            </main>
          </StackTheme>
        </StackProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}