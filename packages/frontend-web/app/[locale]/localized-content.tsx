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