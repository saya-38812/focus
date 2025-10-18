// src/types/timer.ts
// タイマー機能関連の型定義

export type TimerType = 'study' | 'break';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface TimerConfig {
  studyDuration: number; // 分
  shortBreak: number; // 分
  longBreak: number; // 分
  longBreakInterval: number; // セッション数
}

export interface SessionStats {
  totalStudyTime: number; // 今日の合計学習時間（秒）
  completedSessions: number; // 完了セッション数
  totalBreakTime: number; // 今日の合計休憩時間（秒）
  focusScore: number; // 集中力スコア（0-100）
}
