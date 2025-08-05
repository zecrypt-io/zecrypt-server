'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SimpleLoginPage() {
  const [email, setEmail] = useState('demo@zecrypt.com');
  const [isLoading, setIsLoading] = useState(false);
  const [useRealAuth, setUseRealAuth] = useState(false);
  const router = useRouter();

  const handleDemoLogin = () => {
    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      router.push('/simple-dashboard');
    }, 1000);
  };

  const handleBrowserLogin = () => {
    alert('Browser-based authentication will be implemented next!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Zecrypt Desktop</h1>
          <p className="text-gray-600 mt-2">Secure Password Manager</p>
        </div>

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
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Login with Browser (Stack Auth + 2FA)
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