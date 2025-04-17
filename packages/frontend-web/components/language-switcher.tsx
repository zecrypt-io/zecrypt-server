'use client';

import { usePathname } from 'next/navigation';
import { useRouter } from '@/app/[locale]/navigation';
import { locales } from '@/middleware';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();

  // Get current locale from pathname
  const currentLocale = pathname?.split('/')[1] || 'en';

  // Language display names
  const languageNames: Record<string, string> = {
    en: 'English',
    fr: 'Français',
    es: 'Español',
    de: 'Deutsch',
    vi: 'Tiếng Việt',
    uk: 'Українська',
    'zh-Hant': '繁體中文',
    'pt-BR': 'Português Brasileiro',
    pt: 'Português',
    ro: 'Română',
    ru: 'Pусский',
    sr: 'Српски',
    sv: 'Svenska',
    tr: 'Türkçe',
    pl: 'Polskie',
    no: 'Norsk',
    nl: 'Nederlands',
    ko: '한국어',
    ja: '日本語',
    it: 'Italiano',
    id: 'Indonesian',
    hu: 'Magyar',
    he: 'עִברִית',
    fi: 'Suomalainen',
    el: 'Ελληνικά',
    da: 'Dansk',
    cs: 'Čeština',
    'zh-CN': '简体中文',
    ca: 'Català',
    ar: 'عربى',
    af: 'Afrikaans',
  };

  // Sort locales by display name
  const sortedLocales = [...locales].sort((a, b) => {
    const nameA = languageNames[a] || a;
    const nameB = languageNames[b] || b;
    return nameA.localeCompare(nameB);
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {sortedLocales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => router.switchLanguage(locale)}
            className={locale === currentLocale ? 'font-bold' : ''}
          >
            {languageNames[locale] || locale}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 