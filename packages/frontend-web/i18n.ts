import {getRequestConfig} from 'next-intl/server';
import {locales, defaultLocale} from './middleware';

export default getRequestConfig(async ({locale}) => {
  // If locale is undefined or not supported, use the default locale
  const resolvedLocale = locale && locales.includes(locale as any) 
    ? locale 
    : defaultLocale;
  
  // Load and return the messages for the locale
  return {
    locale: resolvedLocale,
    messages: (await import(`./messages/${resolvedLocale}/common.json`)).default,
    timeZone: 'UTC'
  };
}); 