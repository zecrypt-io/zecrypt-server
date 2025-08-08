// Minimal i18n shim for desktop build without next-intl
// Provides lightweight fallbacks used by components (useTranslations, useFormatter)

export function useTranslations() {
  return (key: string, params?: Record<string, any>) => {
    if (params && typeof params.default === 'string') return params.default;
    return key;
  };
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


