import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserState {
  id: string | null;
  name: string;
  avatarUrl?: string;
}

const initialState: UserState = {
  id: null,
  name: 'ゲスト',
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ id: string; name: string; avatarUrl?: string }>) => {
      state.id = action.payload.id;
      state.name = action.payload.name;
      state.avatarUrl = action.payload.avatarUrl;
    },
    clearUser: (state) => {
      state.id = null;
      state.name = 'ゲスト';
      state.avatarUrl = undefined;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export const userReducer = userSlice.reducer;
export default userReducer;
