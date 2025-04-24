import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserData {
  user_id: string;
  name: string;
  profile_url: string;
  access_token: string;
  email?: string;
  locale?: string; // Added to resolve type error
}

interface UserState {
  userData: UserData | null;
}

const initialState: UserState = {
  userData: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserData: (state, action: PayloadAction<UserData>) => {
      state.userData = action.payload;
    },
    clearUserData: (state) => {
      state.userData = null;
    },
  },
});

export const { setUserData, clearUserData } = userSlice.actions;
export default userSlice.reducer;
export type { UserState, UserData };