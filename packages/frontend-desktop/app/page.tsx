'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { offlineDataStore } from '@/libs/offline-data-store';

// Simple client-side routing for desktop app
export default function RootPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Initialize sample offline data on first load
    try {
      offlineDataStore.initializeSampleData();
    } catch (e) {
      console.warn('Failed to initialize sample data', e);
    }
    // For desktop app, go directly to simple login
    router.replace('/simple-login');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      <p className="mt-4 text-sm text-gray-600">Loading Zecrypt Desktop...</p>
    </div>
  );
}

