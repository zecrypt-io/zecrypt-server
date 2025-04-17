'use client';

import { useTranslations } from 'next-intl';
import { Link, useRouter, getLocalizedPath } from './navigation';

export default function LocalizedContent({ locale }: { locale: string }) {
  const t = useTranslations('navigation');
  const router = useRouter();
  
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex space-x-4">
        {[
          { code: 'af', label: 'Afrikaans (Afrikaans)' },
          { code: 'ar', label: 'Arabic (عربى)' },
          { code: 'ca', label: 'Catalan (Català)' },
          { code: 'cs', label: 'Czech (Čeština)' },
          { code: 'da', label: 'Danish (Dansk)' },
          { code: 'de', label: 'German (Deutsch)' },
          { code: 'el', label: 'Greek (Ελληνικά)' },
          { code: 'en', label: 'English (English)' },
          { code: 'es', label: 'Español' },
          { code: 'fi', label: 'Finnish (Suomalainen)' },
          { code: 'fr', label: 'French (Français)' },
          { code: 'he', label: 'Hebrew (עִברִית)' },
          { code: 'hu', label: 'Hungarian (Magyar)' },
          { code: 'id', label: 'Indonesian (Indonesian)' },
          { code: 'it', label: 'Italian (Italiano)' },
          { code: 'ja', label: 'Japanese (日本語)' },
          { code: 'ko', label: 'Korean (한국어)' },
          { code: 'nl', label: 'Dutch (Nederlands)' },
          { code: 'no', label: 'Norwegian (Norsk)' },
          { code: 'pl', label: 'Polish (Polskie)' },
          { code: 'pt', label: 'Portuguese (Português)' },
          { code: 'pt-BR', label: 'Portuguese Brazilian (Português Brasileiro)' },
          { code: 'ro', label: 'Romanian (Română)' },
          { code: 'ru', label: 'Russian (Pусский)' },
          { code: 'sr', label: 'Serbian (Српски)' },
          { code: 'sv', label: 'Swedish (Svenska)' },
          { code: 'tr', label: 'Turkish (Türkçe)' },
          { code: 'uk', label: 'Ukrainian (Українська)' },
          { code: 'vi', label: 'Vietnamese (Tiếng Việt)' },
          { code: 'zh-CN', label: 'Chinese Simplified (简体中文)' },
          { code: 'zh-Hant', label: 'Chinese Traditional (繁體中文)' },
        ].sort((a, b) => a.label.localeCompare(b.label)).map(({ code, label }) => (
          <button
            key={code}
            onClick={() => router.switchLanguage(code)}
            className={`px-3 py-1 ${locale === code ? 'font-bold underline' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
      
      <nav className="flex space-x-4 mt-6">
        <Link href={`/${locale}/`} className="px-4 py-2 bg-blue-500 text-white rounded">
          {t('home')}
        </Link>
        <Link href={`/${locale}/dashboard`} className="px-4 py-2 bg-blue-500 text-white rounded">
          {t('dashboard')}
        </Link>
        <Link href={`/${locale}/settings`} className="px-4 py-2 bg-blue-500 text-white rounded">
          {t('settings')}
        </Link>
      </nav>
    </div>
  );
} 