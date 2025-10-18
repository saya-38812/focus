// src/store/index.ts - 最小復旧版
import { configureStore } from '@reduxjs/toolkit';

// 最小限のsessionスライス（ファイルが見つからない場合の代替）
const sessionSlice = {
  name: 'session',
  initialState: { sessions: [] },
  reducers: {}
};

export const store = configureStore({
  reducer: {
    session: (state = { sessions: [] }, action: any) => state,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 基本的なhooks
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
