import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserData {
  user_id: string | null;
  name: string | null;
  profile_url: string | null;
  access_token: string | null;
  refresh_token: string | null;
  email: string | null;
  language: string | null;
  is_2fa_enabled: boolean;
}

interface UserState {
  userData: UserData | null;
}

const initialState: UserState = {
  userData: {
    user_id: null,
    name: null,
    profile_url: null,
    access_token: null,
    refresh_token: null,
    email: null,
    language: null,
    is_2fa_enabled: false,
  },
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
    },
    clearUserData: (state) => {
      state.userData = initialState.userData;
    },
  },
});

export const { setUserData, clearUserData } = userSlice.actions;
export default userSlice.reducer;
export type { UserState, UserData };