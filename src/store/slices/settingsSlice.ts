// src/store/slices/settingsSlice.ts - 設定データ管理
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface NotificationSettings {
  studyStart: boolean;
  studyEnd: boolean;
  breakStart: boolean;
  breakEnd: boolean;
  dailyReminder: boolean;
  reminderTime: string; // HH:MM形式
}

export interface TimerSettings {
  focusTime: number; // 分
  shortBreakTime: number; // 分
  longBreakTime: number; // 分
  longBreakInterval: number; // 何セッション後に長い休憩
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'ja' | 'en';
  dataBackup: boolean;
  analyticsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface SettingsState {
  timer: TimerSettings;
  notifications: NotificationSettings;
  app: AppSettings;
}

const initialState: SettingsState = {
  timer: {
    focusTime: 25,
    shortBreakTime: 5,
    longBreakTime: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
  },
  notifications: {
    studyStart: true,
    studyEnd: true,
    breakStart: true,
    breakEnd: true,
    dailyReminder: false,
    reminderTime: '09:00',
  },
  app: {
    theme: 'light',
    language: 'ja',
    dataBackup: true,
    analyticsEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
  },
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateTimerSettings: (state, action: PayloadAction<Partial<TimerSettings>>) => {
      state.timer = { ...state.timer, ...action.payload };
    },
    updateNotificationSettings: (state, action: PayloadAction<Partial<NotificationSettings>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    updateAppSettings: (state, action: PayloadAction<Partial<AppSettings>>) => {
      state.app = { ...state.app, ...action.payload };
    },
    resetSettings: (state) => {
      return initialState;
    },
    updateFocusTime: (state, action: PayloadAction<number>) => {
      state.timer.focusTime = action.payload;
    },
    updateBreakTime: (state, action: PayloadAction<number>) => {
      state.timer.shortBreakTime = action.payload;
    },
    toggleNotification: (state, action: PayloadAction<keyof NotificationSettings>) => {
      const key = action.payload;
      if (typeof state.notifications[key] === 'boolean') {
        (state.notifications[key] as boolean) = !(state.notifications[key] as boolean);
      }
    },
  },
});

export const {
  updateTimerSettings,
  updateNotificationSettings,
  updateAppSettings,
  resetSettings,
  updateFocusTime,
  updateBreakTime,
  toggleNotification,
} = settingsSlice.actions;

export default settingsSlice.reducer;
