// Lightweight i18n runtime for the desktop build (no next-intl, static export friendly)
// - Loads JSON message catalogs at build time
// - Supports dot-path lookup and simple {var} interpolation
// - Respects optional namespaces (e.g. useTranslations('auth'))

import enMessages from '@/messages/en/common.json';
// import deMessages from '@/messages/de/common.json'; // Temporarily unused

type MessageCatalog = Record<string, unknown>;

const LOCALE_STORAGE_KEY = 'zecrypt.locale';
import { getDb } from './sqlite'

const catalogsByLocale: Record<string, MessageCatalog> = {
  en: enMessages as MessageCatalog,
  // de: deMessages as MessageCatalog,
};

async function getCurrentLocaleAsync(): Promise<keyof typeof catalogsByLocale> {
  try {
    const db = await getDb()
    const rows = await db.select('SELECT value FROM settings WHERE key = $1', [LOCALE_STORAGE_KEY])
    const stored = rows?.[0]?.value
    return (stored && stored in catalogsByLocale ? stored : 'en') as keyof typeof catalogsByLocale
  } catch {
    return 'en' as keyof typeof catalogsByLocale
  }
}

export async function setCurrentLocale(locale: keyof typeof catalogsByLocale) {
  const db = await getDb()
  await db.execute('INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [LOCALE_STORAGE_KEY, String(locale)])
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


