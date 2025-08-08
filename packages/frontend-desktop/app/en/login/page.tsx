'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export default function DesktopLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authStatus, setAuthStatus] = useState('');
  const [email, setEmail] = useState('');

  // Check if this is a desktop auth request
  const isDesktopAuth = searchParams.get('desktop_auth') === 'true';
  const returnUrl = searchParams.get('return_url');

  useEffect(() => {
    if (isDesktopAuth) {
      setAuthStatus('Please complete authentication below...');
    } else {
      // Regular login page - redirect to simple-login for desktop app
      router.replace('/simple-login');
    }
  }, [isDesktopAuth, returnUrl, router]);

  const handleSignIn = async () => {
    if (!email) {
      setAuthStatus('Please enter your email address');
      return;
    }
    
    setAuthStatus('Authenticating...');
    
    try {
      // Simulate authentication process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create auth data
      const authData = {
        access_token: 'demo-token-' + Date.now(),
        code: 'success',
        email: email
      };
      
      setAuthStatus('Redirecting to desktop app...');
      
      // Build deep link URL with auth data
      const deepLinkUrl = `zecrypt://auth/callback?` + new URLSearchParams({
        access_token: authData.access_token,
        code: authData.code,
        email: authData.email
      }).toString();
      
      // Redirect to deep link
      window.location.href = deepLinkUrl;
      
      setAuthStatus('Opening desktop app... You can close this window if the app opened successfully.');
      
      // Auto-close the window after a delay
      setTimeout(() => {
        window.close();
      }, 3000);
      
    } catch (error) {
      console.error('Authentication error:', error);
      setAuthStatus('Authentication failed. Please try again.');
    }
  };

  if (!isDesktopAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-sm text-gray-600">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Desktop auth header */}
      <div className="bg-blue-50 border-b border-blue-200 p-4 text-center">
        <h2 className="text-lg font-semibold text-blue-900">Zecrypt Desktop Authentication</h2>
        <p className="text-sm text-blue-700">Complete your login to continue to the desktop app</p>
      </div>

      {/* Simple login form */}
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 mx-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Zecrypt Desktop</h1>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">{authStatus}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
                onKeyPress={(e) => e.key === 'Enter' && handleSignIn()}
              />
            </div>
            
            <button
              onClick={handleSignIn}
              disabled={!email}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sign In with Magic Link
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/simple-login')}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Return to Desktop Login
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>Demo mode: Any email will work for testing</p>
          </div>
        </div>
      </div>
    </div>
  );
}