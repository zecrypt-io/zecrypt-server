'use client';

// Lightweight i18n shim replacing next-intl in desktop build
import { useTranslations as shimUseTranslations } from '@/libs/intl-shim';

export function useTranslations(namespace?: string) {
  // Pass through namespace so keys are resolved in the correct scope
  return shimUseTranslations(namespace);
}

export function useTranslator() {
  const t = shimUseTranslations();

  return {
    translate: (key: string, namespace?: string, params?: Record<string, any>) => {
      if (params && typeof params.default === 'string') return params.default;
      return namespace ? shimUseTranslations(namespace)(key, params || {}) : t(key, params || {});
    },
    nav: (key: string, params?: Record<string, any>) => t(`navigation.${key}`, params || {}),
    auth: (key: string, params?: Record<string, any>) => t(`auth.${key}`, params || {}),
    actions: (key: string, params?: Record<string, any>) => t(`actions.${key}`, params || {}),
  };
}