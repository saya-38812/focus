// src/store/slices/timerSlice.ts - プリセット機能付き
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TIMER_CONSTANTS, DEFAULT_PRESET } from '../../constants/timer';

export interface TimerState {
  remaining: number;
  isActive: boolean;
  currentSubject: string;
  duration: number;
  currentPreset: keyof typeof TIMER_CONSTANTS.PRESET_DURATIONS; // 追加
}

// デフォルトプリセットから初期時間を取得
const INITIAL_DURATION = TIMER_CONSTANTS.PRESET_DURATIONS[DEFAULT_PRESET];

const initialState: TimerState = {
  remaining: INITIAL_DURATION,
  isActive: false,
  currentSubject: '数学',
  duration: INITIAL_DURATION,
  currentPreset: DEFAULT_PRESET, // 追加
};

const timerSlice = createSlice({
  name: 'timer',
  initialState,
  reducers: {
    startTimer: (state) => {
      console.log('startTimer reducer 実行中');
      state.isActive = true;
      console.log('isActive を true に変更完了');
    },
    
    stopTimer: (state) => {
      console.log('stopTimer reducer 実行中'); 
      state.isActive = false;
      console.log('isActive を false に変更完了');
    },
    
    tick: (state) => {
      if (state.isActive && state.remaining > 0) {
        state.remaining -= 1;
      }
    },
    
    setSubject: (state, action: PayloadAction<string>) => {
      state.currentSubject = action.payload;
    },
    
    reset: (state) => {
      state.remaining = state.duration;
      state.isActive = false;
    },
    
    // プリセット時間設定（新機能）
    setPresetDuration: (state, action: PayloadAction<keyof typeof TIMER_CONSTANTS.PRESET_DURATIONS>) => {
      const preset = action.payload;
      const newDuration = TIMER_CONSTANTS.PRESET_DURATIONS[preset];
      
      state.currentPreset = preset;
      state.duration = newDuration;
      
      // タイマーが動いていない場合のみ残り時間も更新
      if (!state.isActive) {
        state.remaining = newDuration;
      }
      
      console.log(`タイマー時間を${preset}に変更: ${newDuration}秒`);
    },
    
    // カスタム時間設定
    setCustomDuration: (state, action: PayloadAction<number>) => {
      const customDuration = action.payload;
      state.duration = customDuration;
      state.currentPreset = 'STANDARD'; // カスタム時はSTANDARDにリセット
      
      if (!state.isActive) {
        state.remaining = customDuration;
      }
    },
  },
});

export const { 
  startTimer, 
  stopTimer, 
  tick, 
  setSubject, 
  reset,
  setPresetDuration,
  setCustomDuration
} = timerSlice.actions;

export default timerSlice.reducer;

