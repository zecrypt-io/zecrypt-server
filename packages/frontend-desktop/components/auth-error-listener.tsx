"use client";

import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useUser } from '@stackframe/stack';
import { RootState } from '@/libs/Redux/store';
import { clearUserData, setAuthError } from '@/libs/Redux/userSlice';
import { logout } from '@/libs/utils';

interface AuthErrorListenerProps {
  children: React.ReactNode;
  locale: string;
}

export function AuthErrorListener({ children, locale }: AuthErrorListenerProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useUser();
  const authError = useSelector((state: RootState) => state.user.authError);

  useEffect(() => {
    const handleAuthError = async () => {
      if (authError) {
        console.log('Auth error detected, performing full logout.');
        
        await logout({
          user,
          dispatch,
          router,
          clearUserData,
          locale
        });
        
        // Reset auth error state
        dispatch(setAuthError());
      }
    };

    handleAuthError();

  }, [authError, dispatch, router, user, locale]);

  return <>{children}</>;
} 