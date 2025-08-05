// Offline locale configuration for desktop app
export const locales = ['en'] as const;
export const defaultLocale = 'en';

export type Locale = typeof locales[number];

export function getLocalizedRoute(locale: string, route: string): string {
  // For offline desktop app, we'll use English only
  return route;
}