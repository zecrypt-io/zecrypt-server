import type React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/libs/Redux/ReduxProvider";
import { MasterPasswordAuthProvider } from "@/libs/master-password-auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: 'Zecrypt Desktop',
  description: 'Secure your data with Zecrypt - Desktop Application',
  generator: 'Next.js'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ReduxProvider>
          <MasterPasswordAuthProvider>
            {children}
          </MasterPasswordAuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
