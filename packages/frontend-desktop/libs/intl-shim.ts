// Lightweight i18n runtime for the desktop build (no next-intl, static export friendly)
// - Loads JSON message catalogs at build time
// - Supports dot-path lookup and simple {var} interpolation
// - Respects optional namespaces (e.g. useTranslations('auth'))

import enMessages from '@/messages/en/common.json';
// import deMessages from '@/messages/de/common.json'; // Temporarily unused

type MessageCatalog = Record<string, unknown>;

const LOCALE_STORAGE_KEY = 'zecrypt.locale';
import { settingsGet, settingsSet } from './tauri-settings'

const catalogsByLocale: Record<string, MessageCatalog> = {
  en: enMessages as MessageCatalog,
  // de: deMessages as MessageCatalog,
};

async function getCurrentLocaleAsync(): Promise<keyof typeof catalogsByLocale> {
  try {
    const stored = await settingsGet(LOCALE_STORAGE_KEY)
    return (stored && stored in catalogsByLocale ? stored : 'en') as keyof typeof catalogsByLocale
  } catch {
    return 'en' as keyof typeof catalogsByLocale
  }
}

export async function setCurrentLocale(locale: keyof typeof catalogsByLocale) {
  await settingsSet(LOCALE_STORAGE_KEY, String(locale))
}

function getByPath(obj: unknown, path: string): unknown {
  if (!obj) return undefined;
  return path.split('.').reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === 'object' && segment in (acc as any)) {
      return (acc as any)[segment];
    }
    return undefined;
  }, obj);
}

function format(template: string, params?: Record<string, unknown>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`));
}

function translateInternal(fullKey: string, params?: Record<string, unknown>): string {
  if (params && typeof (params as any).default === 'string') return (params as any).default as string;
  // Synchronously fall back to 'en' to avoid async in render paths
  const catalog = catalogsByLocale.en;
  const value = getByPath(catalog, fullKey);
  if (typeof value === 'string') return format(value, params);
  return fullKey; // fallback to key when missing
}

// Returns a translator function; when namespace is provided it prefixes keys
export function useTranslations(namespace?: string) {
  const prefix = namespace ? `${namespace}.` : '';
  return (key: string, params?: Record<string, unknown>) => translateInternal(`${prefix}${key}`, params);
}

export function useFormatter() {
  return {
    dateTime: (date: Date, options?: Intl.DateTimeFormatOptions) => {
      try {
        return new Intl.DateTimeFormat(undefined, options).format(date);
      } catch {
        return String(date ?? '');
      }
    },
    number: (value: number, options?: Intl.NumberFormatOptions) => {
      try {
        return new Intl.NumberFormat(undefined, options).format(value);
      } catch {
        return String(value ?? '');
      }
    },
    relativeTime: (value: number, unit: Intl.RelativeTimeFormatUnit) => {
      try {
        return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(value, unit);
      } catch {
        return `${value} ${unit}`;
      }
    },
  } as any;
}


