'use client';

import { useTranslations as useNextIntlTranslations } from 'next-intl';

export function useTranslations(namespace?: string) {
  return useNextIntlTranslations(namespace);
}

export function useTranslator() {
  const t = useNextIntlTranslations();
  
  return {
    // Common translations for easy access
    translate: (key: string, namespace?: string, params?: Record<string, any>) => {
      if (namespace) {
        return t(`${namespace}.${key}`, params || {});
      }
      return t(key, params || {});
    },
    
    // Navigation translations
    nav: (key: string, params?: Record<string, any>) => {
      return t(`navigation.${key}`, params || {});
    },
    
    // Auth translations
    auth: (key: string, params?: Record<string, any>) => {
      return t(`auth.${key}`, params || {});
    },
    
    // Action translations
    actions: (key: string, params?: Record<string, any>) => {
      return t(`actions.${key}`, params || {});
    },
  };
} 