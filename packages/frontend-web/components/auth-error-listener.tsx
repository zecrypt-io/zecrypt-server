"use client";

import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useUser } from '@stackframe/stack';
import { RootState } from '@/libs/Redux/store';
import { clearUserData, setAuthError } from '@/libs/Redux/userSlice';
import { secureSetItem } from '@/libs/session-storage-utils';

interface AuthErrorListenerProps {
  children: React.ReactNode;
  locale: string;
}

export function AuthErrorListener({ children, locale }: AuthErrorListenerProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useUser(); // Use the useUser hook here
  const authError = useSelector((state: RootState) => state.user.authError);

  useEffect(() => {
    const handleAuthError = async () => {
      if (authError) {
        console.log('Auth error detected, performing full logout.');
        
        // Clear access token cookie
        document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict';
        
        // Clear user data from Redux
        dispatch(clearUserData());
        
        // Clear session storage
        await secureSetItem("privateKey", "");
        await secureSetItem("publicKey", "");
        
        // Clear localStorage items
        localStorage.removeItem("userPublicKey");
        localStorage.removeItem("zecrypt_device_id");
        
        // Sign out from Stack
        if (user && user.signOut) {
          await user.signOut();
        }
        
        // Redirect to login and replace history entry
        router.replace(`/${locale}/login`);
        
        // Reset auth error state
        dispatch(setAuthError());
      }
    };

    handleAuthError();

  }, [authError, dispatch, router, user, locale]);

  return <>{children}</>;
} 