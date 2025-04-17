import createMiddleware from 'next-intl/middleware';

// Available locales
export const locales = ['en', 'fr', 'es', 'de', 'vi'];
export const defaultLocale = 'en';

// Get pathname for a given locale
export function getPathWithLocale(path: string, locale: string) {
  return `/${locale}${path}`;
}

export default createMiddleware({
  // A list of all locales that are supported
  locales,
  
  // Used when no locale matches
  defaultLocale,
  
  // If this locale is matched, pathnames work without a prefix (e.g. `/about`)
  localePrefix: 'always'
});

export const config = {
  // Match all pathnames except for
  // - ... files in the public folder
  // - ... files with extensions (e.g. favicon.ico)
  matcher: ['/((?!api|_next|.*\\..*).*)']
}; 