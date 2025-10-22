import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Available locales
export const locales = [
  'en', 'af', 'ar', 'ca', 'cs', 'da', 'de', 'el', 'es', 'fi', 
  'fr', 'he', 'hu', 'id', 'it', 'ja', 'ko', 'nl', 'no', 'pl', 
  'pt', 'pt-BR', 'ro', 'ru', 'sr', 'sv', 'tr', 'uk', 'vi', 
  'zh-CN', 'zh-Hant'
];
export const defaultLocale = 'en';

// Protected routes that require authentication
const protectedRoutes = ['/dashboard'];

// Get pathname for a given locale
export function getPathWithLocale(path: string, locale: string) {
  return `/${locale}${path}`;
}

// Create the internationalization middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export async function middleware(request: NextRequest) {
  // First, handle internationalization
  const response = await intlMiddleware(request);
  
  // Get the pathname without locale
  const pathname = request.nextUrl.pathname;
  const pathnameWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '');
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathnameWithoutLocale.startsWith(route)
  );

  // Get the access token from cookies
  const accessToken = request.cookies.get('access_token')?.value;
  
  // If it's a protected route and no access token, redirect to login
  if (isProtectedRoute && !accessToken) {
    const locale = pathname.split('/')[1];
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If user is logged in and tries to access login page, redirect to dashboard
  if (pathnameWithoutLocale === '/login' && accessToken) {
    const locale = pathname.split('/')[1];
    const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  // Match all pathnames except for
  // - ... files in the public folder
  // - ... files with extensions (e.g. favicon.ico)
  matcher: ['/((?!api|_next|.*\\..*).*)']
}; 