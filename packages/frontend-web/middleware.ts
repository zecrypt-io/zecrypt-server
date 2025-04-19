import createMiddleware from 'next-intl/middleware';

// Available locales
export const locales = ['en', 'fr', 'es', 'de', 'vi', 'uk', 'zh-Hant', 'zh-CN', 'pt-BR', 'pt', 'ro', 'ru', 'sr', 'sv', 'tr', 'pl', 'no', 'nl', 'ko', 'ja', 'it', 'id', 'hu', 'he', 'fi', 'el', 'da', 'cs', 'ca', 'ar', 'af'];
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