import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { match as matchLocale } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'

// List of supported locales
export const locales = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko']
export const defaultLocale = 'en'

// Get the preferred locale from the request
function getLocale(request: NextRequest): string {
  const negotiatorHeaders: Record<string, string> = {}
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value))

  const languages = new Negotiator({ headers: negotiatorHeaders }).languages()
  const locales = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko']
  
  try {
    return matchLocale(languages, locales, defaultLocale)
  } catch (error) {
    return defaultLocale
  }
}

// Check if the pathname starts with a locale
function pathnameHasLocale(pathname: string): boolean {
  return locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const searchParams = request.nextUrl.searchParams.toString()
  const pathnameIsMissingLocale = !pathnameHasLocale(pathname)

  // Get the preferred locale
  const locale = getLocale(request)

  // Handle locale redirects
  if (pathnameIsMissingLocale) {
    const newUrl = new URL(`/${locale}${pathname}`, request.url)
    if (searchParams) {
      newUrl.search = searchParams
    }
    return NextResponse.redirect(newUrl)
  }

  // Check if the path is a dashboard route
  const isDashboardRoute = pathname.includes('/dashboard')
  const isAuthRoute = pathname.includes('/login') || pathname.includes('/signup') || pathname.includes('/2fa')

  // Get the access token from cookies
  const accessToken = request.cookies.get('access_token')?.value

  // Handle authentication redirects
  if (isDashboardRoute && !accessToken) {
    // Redirect to login if trying to access dashboard without token
    const loginUrl = new URL(`/${locale}/login`, request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && accessToken) {
    // Redirect to dashboard if trying to access auth routes with token
    const dashboardUrl = new URL(`/${locale}/dashboard`, request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next|api|favicon.ico).*)',
  ],
} 