// src/types/index.ts
// メインの型定義ファイル

// 基本的な学習セッション型
export interface StudySession {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  subject: string;
  targetDuration: number; // 秒
  actualDuration: number; // 秒
  isCompleted: boolean;
  createdAt: string;
}

// ユーザー情報型
export interface User {
  id: string;
  email: string;
  isPremium: boolean;
  preferences: UserPreferences;
  createdAt: string;
}

// ユーザー設定型
export interface UserPreferences {
  studyDuration: number; // 分
  breakDuration: number; // 分
  notificationEnabled: boolean;
  subjects: string[];
}

// タイマー状態型
export interface TimerState {
  duration: number; // 設定時間（秒）
  remaining: number; // 残り時間（秒）
  isActive: boolean; // 実行中フラグ
  isPaused: boolean; // 一時停止フラグ
  type: 'study' | 'break'; // タイマー種別
  sessionId: string | null;
}
