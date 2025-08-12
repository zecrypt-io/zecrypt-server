// Offline locale configuration for desktop app
// Temporarily restrict to English only; keep structure for future locales
export const locales = ['en'] as const;
export const defaultLocale = 'en';

export type Locale = typeof locales[number];

export function getLocalizedRoute(locale: string, route: string): string {
  // For offline desktop app, we'll use English only
  return route;
}