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
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
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