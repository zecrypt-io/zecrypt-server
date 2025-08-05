'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SimpleDashboard() {
  const [user] = useState({ email: 'demo@zecrypt.com', name: 'Demo User' });
  const router = useRouter();

  const handleLogout = () => {
    router.push('/simple-login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Zecrypt Desktop</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <button
                onClick={handleLogout}
                className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Passwords Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Passwords</h3>
                <p className="text-sm text-gray-600">5 stored passwords</p>
              </div>
            </div>
          </div>

          {/* Credit Cards Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Cards</h3>
                <p className="text-sm text-gray-600">2 credit cards</p>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-yellow-100">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Secure Notes</h3>
                <p className="text-sm text-gray-600">3 notes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Desktop App Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">✅ Completed Features:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Tauri desktop app setup</li>
                <li>• Static Next.js export</li>
                <li>• Offline authentication demo</li>
                <li>• Basic UI components</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">🚧 Next Steps:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Browser-based authentication</li>
                <li>• Stack Auth integration</li>
                <li>• 2FA and master password</li>
                <li>• Real data management</li>
                <li>• Browser extension communication</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Authentication Flow Info */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-medium text-blue-900 mb-4">Planned Authentication Flow</h2>
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>1. Desktop Login Button:</strong> User clicks "Login with Browser" in desktop app</p>
            <p><strong>2. Browser Opens:</strong> Desktop app opens browser to web app login page</p>
            <p><strong>3. Complete Authentication:</strong> User completes Stack Auth + 2FA + Master Password in browser</p>
            <p><strong>4. Deeplink Return:</strong> Browser redirects back to desktop app with auth tokens</p>
            <p><strong>5. Desktop Authenticated:</strong> Desktop app receives tokens and user is logged in</p>
          </div>
        </div>
      </main>
    </div>
  );
}