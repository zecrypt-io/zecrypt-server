'use client';

import { usePathname, useRouter as useNextRouter } from 'next/navigation';
import Link from 'next/link';
import { locales } from '../../middleware';

// Export the Link component from Next.js
export { Link };

// Helper function to get a localized path
export function getLocalizedPath(path: string, locale: string) {
  // Strip any locale prefix from the path
  const pathWithoutLocale = path.replace(/^\/[^\/]+/, '');
  // Create the new path with the desired locale
  return `/${locale}${pathWithoutLocale}`;
}

// Custom router hook that helps with language switching
export function useRouter() {
  const nextRouter = useNextRouter();
  const pathname = usePathname();
  
  return {
    ...nextRouter,
    push: (href: string, options?: Parameters<typeof nextRouter.push>[1]) => {
      nextRouter.push(href, options);
    },
    // Helper to switch language while preserving current route
    switchLanguage: (locale: string) => {
      // Get current path without the locale prefix
      const segments = pathname?.split('/') || [];
      // Remove the first segment (locale)
      segments.shift();
      
      // Create a new path with the desired locale
      const newPath = `/${locale}${segments.length ? `/${segments.join('/')}` : ''}`;
      nextRouter.push(newPath);
    }
  };
} 