'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Simple client-side routing for desktop app
export default function RootPage() {
  const router = useRouter();
  
  useEffect(() => {
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

