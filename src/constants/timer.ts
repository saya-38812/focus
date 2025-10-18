// src/constants/timer.ts - タイマー設定定数
export const TIMER_CONSTANTS = {
    // プリセット時間オプション（秒単位）
    PRESET_DURATIONS: {
      SHORT_FOCUS: 15 * 60,      // 15分（短時間集中）
      POMODORO: 25 * 60,         // 25分（ポモドーロテクニック）
      STANDARD: 50 * 60,         // 50分（標準）
      LONG_STUDY: 90 * 60,       // 90分（長時間学習）
    },
    
    // 休憩時間設定
    BREAK_DURATIONS: {
      SHORT_BREAK: 5 * 60,       // 5分
      LONG_BREAK: 15 * 60,       // 15分
    },
    
    // テスト用短時間設定（開発時使用）
    TEST_DURATION: 10,           // 10秒
  };
  
  // プリセット名を日本語で表示するマッピング
  export const PRESET_LABELS = {
    SHORT_FOCUS: '15分（短時間集中）',
    POMODORO: '25分（ポモドーロ）',
    STANDARD: '50分（標準）',
    LONG_STUDY: '90分（長時間学習）',
  };
  
  // デフォルト設定
  export const DEFAULT_PRESET = 'POMODORO';
  