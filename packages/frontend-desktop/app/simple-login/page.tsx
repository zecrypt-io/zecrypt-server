'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MasterPasswordSetup } from '@/components/master-password-setup';
import { MasterPasswordLogin } from '@/components/master-password-login';
import { useMasterPasswordAuth } from '@/libs/master-password-auth';

export default function SimpleLoginPage() {
  const { isLoading, isAuthenticated, hasPasswordSet } = useMasterPasswordAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Only redirect if already authenticated on page load (returning user)
  useEffect(() => {
    if (!isLoading && isAuthenticated && hasPasswordSet) {
      router.push('/en/dashboard');
    }
  }, [isLoading, isAuthenticated, hasPasswordSet, router]);

  const handleAuthSuccess = () => {
    setIsRedirecting(true);
    router.push('/en/dashboard');
  };

  if (isLoading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {isRedirecting ? 'Success! Redirecting...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!hasPasswordSet) {
    return <MasterPasswordSetup onComplete={handleAuthSuccess} />;
  }

  return <MasterPasswordLogin onSuccess={handleAuthSuccess} />;
}