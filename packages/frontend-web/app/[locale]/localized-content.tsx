'use client';

import { useTranslations } from 'next-intl';
import { Link, useRouter, getLocalizedPath } from './navigation';

export default function LocalizedContent({ locale }: { locale: string }) {
  const t = useTranslations('navigation');
  const router = useRouter();
  
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex space-x-4">
        <button 
          onClick={() => router.switchLanguage('en')} 
          className={`px-3 py-1 ${locale === 'en' ? 'font-bold underline' : ''}`}
        >
          English
        </button>
        <button 
          onClick={() => router.switchLanguage('fr')} 
          className={`px-3 py-1 ${locale === 'fr' ? 'font-bold underline' : ''}`}
        >
          Français
        </button>
        <button 
          onClick={() => router.switchLanguage('es')} 
          className={`px-3 py-1 ${locale === 'es' ? 'font-bold underline' : ''}`}
        >
          Español
        </button>
        <button 
          onClick={() => router.switchLanguage('de')} 
          className={`px-3 py-1 ${locale === 'de' ? 'font-bold underline' : ''}`}
        >
          Deutsch
        </button>
        <button 
          onClick={() => router.switchLanguage('vi')} 
          className={`px-3 py-1 ${locale === 'vi' ? 'font-bold underline' : ''}`}
        >
          Tiếng Việt
        </button>
        <button 
          onClick={() => router.switchLanguage('uk')} 
          className={`px-3 py-1 ${locale === 'uk' ? 'font-bold underline' : ''}`}
        >
          Українська
        </button>
        <button 
          onClick={() => router.switchLanguage('zh-Hant')} 
          className={`px-3 py-1 ${locale === 'zh-Hant' ? 'font-bold underline' : ''}`}
        >
          繁體中文
        </button>
        <button 
          onClick={() => router.switchLanguage('pt-BR')} 
          className={`px-3 py-1 ${locale === 'pt-BR' ? 'font-bold underline' : ''}`}
        >
          Português Brasileiro
        </button>
        <button 
          onClick={() => router.switchLanguage('pt')} 
          className={`px-3 py-1 ${locale === 'pt' ? 'font-bold underline' : ''}`}
        >
          Português
        </button>
        <button 
          onClick={() => router.switchLanguage('ro')} 
          className={`px-3 py-1 ${locale === 'ro' ? 'font-bold underline' : ''}`}
        >
          Română
        </button>
        <button 
          onClick={() => router.switchLanguage('ru')} 
          className={`px-3 py-1 ${locale === 'ru' ? 'font-bold underline' : ''}`}
        >
          Pусский
        </button>
        <button 
          onClick={() => router.switchLanguage('sr')} 
          className={`px-3 py-1 ${locale === 'sr' ? 'font-bold underline' : ''}`}
        >
          Српски
        </button>
        <button 
          onClick={() => router.switchLanguage('sv')} 
          className={`px-3 py-1 ${locale === 'sv' ? 'font-bold underline' : ''}`}
        >
          Svenska
        </button>
        <button 
          onClick={() => router.switchLanguage('tr')} 
          className={`px-3 py-1 ${locale === 'tr' ? 'font-bold underline' : ''}`}
        >
          Türkçe
        </button>
        <button 
          onClick={() => router.switchLanguage('pl')} 
          className={`px-3 py-1 ${locale === 'pl' ? 'font-bold underline' : ''}`}
        >
          Polskie
        </button>
        <button 
          onClick={() => router.switchLanguage('no')} 
          className={`px-3 py-1 ${locale === 'no' ? 'font-bold underline' : ''}`}
        >
          Norsk
        </button>
        <button 
          onClick={() => router.switchLanguage('nl')} 
          className={`px-3 py-1 ${locale === 'nl' ? 'font-bold underline' : ''}`}
        >
          Nederlands
        </button>
        <button 
          onClick={() => router.switchLanguage('ko')} 
          className={`px-3 py-1 ${locale === 'ko' ? 'font-bold underline' : ''}`}
        >
          한국어
        </button>
        <button 
          onClick={() => router.switchLanguage('ja')} 
          className={`px-3 py-1 ${locale === 'ja' ? 'font-bold underline' : ''}`}
        >
          日本語
        </button>
        <button 
          onClick={() => router.switchLanguage('it')} 
          className={`px-3 py-1 ${locale === 'it' ? 'font-bold underline' : ''}`}
        >
          Italiano
        </button>
        <button 
          onClick={() => router.switchLanguage('id')} 
          className={`px-3 py-1 ${locale === 'id' ? 'font-bold underline' : ''}`}
        >
          Indonesian
        </button>
        <button 
          onClick={() => router.switchLanguage('hu')} 
          className={`px-3 py-1 ${locale === 'hu' ? 'font-bold underline' : ''}`}
        >
          Magyar
        </button>
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