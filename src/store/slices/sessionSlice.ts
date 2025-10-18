// src/store/slices/sessionSlice.ts - 完全修正版
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StudySession {
  id: string;
  subject: string;
  startTime: string;
  endTime: string;
  plannedDuration: number; // 秒単位
  actualDuration: number; // 秒単位
  completed: boolean;
  date: string; // YYYY-MM-DD形式
  interruptions: number;
  focusScore: number; // 0-100
}

export interface TodayStats {
  totalStudyTime: number;
  totalSessions: number;
  averageFocusScore: number;
  completionRate: number;
}

export interface WeekStats {
  totalStudyTime: number;
  totalSessions: number;
  dailyAverage: number; // 分単位
  bestDay: string;
}

export interface SessionState {
  sessions: StudySession[];
  todayStats: TodayStats;
  weekStats: WeekStats;
  isLoading: boolean;
  error: string | null;
}

const initialState: SessionState = {
  sessions: [],
  todayStats: {
    totalStudyTime: 0,
    totalSessions: 0,
    averageFocusScore: 0,
    completionRate: 0,
  },
  weekStats: {
    totalStudyTime: 0,
    totalSessions: 0,
    dailyAverage: 0,
    bestDay: '',
  },
  isLoading: false,
  error: null,
};

// セッション保存のAsyncThunk
export const saveSession = createAsyncThunk(
  'session/saveSession',
  async (sessionData: Omit<StudySession, 'id'>) => {
    try {
      const id = Date.now().toString();
      const session: StudySession = { ...sessionData, id };
      
      const existingSessions = await AsyncStorage.getItem('studySessions');
      const sessions: StudySession[] = existingSessions ? JSON.parse(existingSessions) : [];
      
      sessions.push(session);
      await AsyncStorage.setItem('studySessions', JSON.stringify(sessions));
      
      console.log('セッション保存完了:', session);
      return session;
    } catch (error) {
      console.error('セッション保存エラー:', error);
      throw new Error('セッションの保存に失敗しました');
    }
  }
);

// セッション読み込みのAsyncThunk
export const loadSessions = createAsyncThunk(
  'session/loadSessions',
  async () => {
    try {
      const data = await AsyncStorage.getItem('studySessions');
      const sessions: StudySession[] = data ? JSON.parse(data) : [];
      console.log(`${sessions.length}件のセッションを読み込みました`);
      return sessions;
    } catch (error) {
      console.error('セッション読み込みエラー:', error);
      return [];
    }
  }
);

// 統計更新のAsyncThunk
export const updateStats = createAsyncThunk(
  'session/updateStats',
  async (_, { getState }) => {
    const state = getState() as { session: SessionState };
    const sessions = state.session.sessions;
    
    // 今日の統計計算
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter(session => session.date === today);
    
    const todayStats: TodayStats = {
      totalStudyTime: todaySessions.reduce((sum, s) => sum + s.actualDuration, 0),
      totalSessions: todaySessions.length,
      averageFocusScore: todaySessions.length > 0 
        ? Math.round(todaySessions.reduce((sum, s) => sum + s.focusScore, 0) / todaySessions.length)
        : 0,
      completionRate: todaySessions.length > 0
        ? Math.round((todaySessions.filter(s => s.completed).length / todaySessions.length) * 100)
        : 0,
    };
    
    // 今週の統計計算
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekStart = oneWeekAgo.toISOString().split('T')[0];
    
    const weekSessions = sessions.filter(session => session.date >= weekStart);
    
    const weekStats: WeekStats = {
      totalStudyTime: weekSessions.reduce((sum, s) => sum + s.actualDuration, 0),
      totalSessions: weekSessions.length,
      dailyAverage: weekSessions.length > 0 
        ? Math.round(weekSessions.reduce((sum, s) => sum + s.actualDuration, 0) / 7 / 60)
        : 0,
      bestDay: '', // 簡易版では省略
    };
    
    return { todayStats, weekStats };
  }
);

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetStats: (state) => {
      state.todayStats = initialState.todayStats;
      state.weekStats = initialState.weekStats;
    },
  },
  extraReducers: (builder) => {
    // セッション保存
    builder
      .addCase(saveSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessions.push(action.payload);
      })
      .addCase(saveSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'セッション保存に失敗しました';
      });
    
    // セッション読み込み
    builder
      .addCase(loadSessions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadSessions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessions = action.payload;
      })
      .addCase(loadSessions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'セッション読み込みに失敗しました';
      });
    
    // 統計更新
    builder
      .addCase(updateStats.fulfilled, (state, action) => {
        state.todayStats = action.payload.todayStats;
        state.weekStats = action.payload.weekStats;
      });
  },
});

export const { clearError, resetStats } = sessionSlice.actions;
export default sessionSlice.reducer;
