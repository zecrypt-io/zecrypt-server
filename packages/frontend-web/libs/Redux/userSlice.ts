import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserData {
  user_id: string | null;
  name: string | null;
  profile_url: string | null;
  access_token: string | null;
  refresh_token: string | null;
  email: string | null;
  locale: string | null; // Changed from language to locale
  is_2fa_enabled: boolean;
}

interface UserState {
  userData: UserData | null;
  authError: boolean; // Add new state property to indicate auth error
}

const initialState: UserState = {
  userData: {
    user_id: null,
    name: null,
    profile_url: null,
    access_token: null,
    refresh_token: null,
    email: null,
    locale: null, // Changed from language to locale
    is_2fa_enabled: false,
  },
  authError: false, // Initialize authError to false
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserData: (state, action: PayloadAction<Partial<UserData>>) => {
      if (!state.userData) {
        state.userData = initialState.userData;
      }
      Object.entries(action.payload).forEach(([key, value]) => {
        if (value !== undefined) {
          (state.userData as any)[key] = value;
        }
      });
      state.authError = false; // Clear auth error on successful data set
    },
    clearUserData: (state) => {
      state.userData = initialState.userData;
      state.authError = false; // Clear auth error on manual logout
    },
    setAuthError: (state) => {
      state.authError = true; // Set auth error on 401 from interceptor
      state.userData = initialState.userData; // Clear user data immediately on auth error
    },
  },
});

export const { setUserData, clearUserData, setAuthError } = userSlice.actions;
export default userSlice.reducer;
export type { UserState, UserData };