'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export default function SimpleLoginPage() {
  const [email, setEmail] = useState('demo@zecrypt.com');
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState('');
  const [useRealAuth, setUseRealAuth] = useState(true);
  const router = useRouter();

  // Listen for auth callbacks from deep links
  useEffect(() => {
    const setupAuthListener = async () => {
      try {
        const unlisten = await listen('auth-callback', (event: any) => {
          console.log('Auth callback received:', event.payload);
          
          const url = event.payload;
          if (typeof url === 'string' && url.includes('zecrypt://auth/callback')) {
            try {
              const urlObj = new URL(url);
              const access_token = urlObj.searchParams.get('access_token');
              const email = urlObj.searchParams.get('email');
              const code = urlObj.searchParams.get('code');
              
              if (access_token && code === 'success') {
                setAuthStatus('Authentication successful! Redirecting...');
                setIsLoading(false);
                
                setTimeout(() => {
                  router.push('/simple-dashboard');
                }, 1000);
              } else {
                setAuthStatus('Authentication failed. Please try again.');
                setIsLoading(false);
              }
            } catch (error) {
              console.error('Error parsing auth callback URL:', error);
              setAuthStatus('Authentication failed. Please try again.');
              setIsLoading(false);
            }
          }
        });
        
        return () => {
          unlisten();
        };
      } catch (error) {
        console.error('Failed to set up auth listener:', error);
      }
    };

    setupAuthListener();
  }, [router]);

  const handleDemoLogin = () => {
    setIsLoading(true);
    setAuthStatus('Logging in with demo credentials...');
    // Simulate login
    setTimeout(() => {
      router.push('/simple-dashboard');
    }, 1000);
  };

  const handleBrowserLogin = async () => {
    try {
      setIsLoading(true);
      setAuthStatus('Opening browser for authentication...');
      
      await invoke('open_browser_auth');
      setAuthStatus('Please complete authentication in your browser...');
      
      // Start polling for authentication completion
      startAuthPolling();
    } catch (error) {
      console.error('Failed to open browser:', error);
      setAuthStatus('Failed to open browser for authentication');
      setIsLoading(false);
    }
  };

  const startAuthPolling = () => {
    // Start listening for deep link auth callbacks
    setAuthStatus('Waiting for authentication...');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Zecrypt Desktop</h1>
          <p className="text-gray-600 mt-2">Secure Password Manager</p>
        </div>

        {authStatus && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">{authStatus}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="useRealAuth"
              checked={useRealAuth}
              onChange={(e) => setUseRealAuth(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="useRealAuth" className="text-sm font-medium text-gray-700">
              Use browser-based authentication (Stack Auth + 2FA)
            </label>
          </div>

          {!useRealAuth ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Demo Mode)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter demo email"
                />
              </div>
              <button
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign in (Demo Mode)'}
              </button>
              <p className="text-xs text-gray-500 text-center">
                Demo mode uses offline authentication with mock data
              </p>
            </>
          ) : (
            <>
              <button
                onClick={handleBrowserLogin}
                disabled={isLoading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {isLoading ? 'Opening Browser...' : 'Login with Browser (Stack Auth + 2FA)'}
              </button>
              <p className="text-xs text-gray-500 text-center">
                Opens browser for complete authentication flow
              </p>
            </>
          )}
        </div>

        <div className="mt-8 border-t pt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Implementation Status:</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span>Desktop app running with Tauri</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span>Static Next.js export working</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span>Demo authentication (offline)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">🔲</span>
              <span className="text-gray-600">Browser-based auth flow (next step)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">🔲</span>
              <span className="text-gray-600">Stack Auth integration</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">🔲</span>
              <span className="text-gray-600">2FA and master password</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}