// src/utils/aiAnalyzer.ts - AI学習分析エンジン
import { StudySession } from '../store/slices/sessionSlice';

export interface LearningInsights {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  nextGoals: string[];
  motivationalMessage: string;
  studyPlan: WeeklyPlan;
}

export interface WeeklyPlan {
  totalHours: number;
  dailySchedule: DailyPlan[];
  prioritySubjects: string[];
  focusAreas: string[];
}

export interface DailyPlan {
  day: string;
  sessions: SessionPlan[];
  totalMinutes: number;
}

export interface SessionPlan {
  subject: string;
  duration: number; // 分単位
  timeSlot: string;
  difficulty: 'easy' | 'medium' | 'hard';
  technique: string;
}

export class AILearningAnalyzer {
  // 学習データを分析してインサイトを生成
  static generateInsights(sessions: StudySession[]): LearningInsights {
    if (sessions.length === 0) {
      return this.getDefaultInsights();
    }

    const analysis = this.analyzeStudyPatterns(sessions);
    const insights = this.generatePersonalizedInsights(analysis);
    const studyPlan = this.generateWeeklyPlan(analysis);

    return {
      ...insights,
      studyPlan
    };
  }

  // 学習パターン分析
  private static analyzeStudyPatterns(sessions: StudySession[]) {
    const subjectPerformance = this.analyzeSubjectPerformance(sessions);
    const timePatterns = this.analyzeTimePatterns(sessions);
    const consistencyScore = this.calculateConsistency(sessions);
    const focusPatterns = this.analyzeFocusPatterns(sessions);

    return {
      subjectPerformance,
      timePatterns,
      consistencyScore,
      focusPatterns,
      totalSessions: sessions.length,
      totalStudyTime: sessions.reduce((sum, s) => sum + s.actualDuration, 0),
      averageSession: sessions.reduce((sum, s) => sum + s.actualDuration, 0) / sessions.length / 60 // 分
    };
  }

  // 科目別パフォーマンス分析
  private static analyzeSubjectPerformance(sessions: StudySession[]) {
    const subjectStats: { [key: string]: { time: number; sessions: number; avgFocus: number; } } = {};
    
    sessions.forEach(session => {
      if (!subjectStats[session.subject]) {
        subjectStats[session.subject] = { time: 0, sessions: 0, avgFocus: 0 };
      }
      subjectStats[session.subject].time += session.actualDuration;
      subjectStats[session.subject].sessions += 1;
      subjectStats[session.subject].avgFocus += session.focusScore;
    });

    // 平均集中度を計算
    Object.keys(subjectStats).forEach(subject => {
      subjectStats[subject].avgFocus /= subjectStats[subject].sessions;
    });

    return subjectStats;
  }

  // 時間帯パターン分析
  private static analyzeTimePatterns(sessions: StudySession[]) {
    const hourlyPerformance: { [hour: number]: { count: number; avgFocus: number; totalTime: number; } } = {};
    
    sessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      if (!hourlyPerformance[hour]) {
        hourlyPerformance[hour] = { count: 0, avgFocus: 0, totalTime: 0 };
      }
      hourlyPerformance[hour].count += 1;
      hourlyPerformance[hour].avgFocus += session.focusScore;
      hourlyPerformance[hour].totalTime += session.actualDuration;
    });

    // 平均を計算
    Object.keys(hourlyPerformance).forEach(hour => {
      const h = parseInt(hour);
      hourlyPerformance[h].avgFocus /= hourlyPerformance[h].count;
    });

    // 最も生産的な時間帯を特定
    const bestHours = Object.entries(hourlyPerformance)
      .sort(([,a], [,b]) => b.avgFocus - a.avgFocus)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    return { hourlyPerformance, bestHours };
  }

  // 一貫性スコア計算
  private static calculateConsistency(sessions: StudySession[]): number {
    const last7Days = Array.from({length: 7}, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    const studyDays = new Set(sessions.map(s => s.date));
    const recentStudyDays = last7Days.filter(day => studyDays.has(day)).length;
    
    return Math.round((recentStudyDays / 7) * 100);
  }

  // 集中パターン分析
  private static analyzeFocusPatterns(sessions: StudySession[]) {
    const recentSessions = sessions.slice(-10);
    const avgFocus = recentSessions.reduce((sum, s) => sum + s.focusScore, 0) / recentSessions.length;
    
    const trend = this.calculateFocusTrend(sessions);
    
    return { avgFocus, trend };
  }

  // 集中度トレンド分析
  private static calculateFocusTrend(sessions: StudySession[]): 'improving' | 'stable' | 'declining' {
    if (sessions.length < 4) return 'stable';
    
    const recent = sessions.slice(-3);
    const older = sessions.slice(-6, -3);
    
    const recentAvg = recent.reduce((sum, s) => sum + s.focusScore, 0) / recent.length;
    const olderAvg = older.reduce((sum, s) => sum + s.focusScore, 0) / older.length;
    
    const diff = recentAvg - olderAvg;
    
    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
  }

  // 個人化されたインサイト生成
  private static generatePersonalizedInsights(analysis: any): Omit<LearningInsights, 'studyPlan'> {
    const strengths = this.identifyStrengths(analysis);
    const weaknesses = this.identifyWeaknesses(analysis);
    const recommendations = this.generateRecommendations(analysis);
    const nextGoals = this.suggestNextGoals(analysis);
    const motivationalMessage = this.generateMotivationalMessage(analysis);

    return { strengths, weaknesses, recommendations, nextGoals, motivationalMessage };
  }

  // 強みの特定
  private static identifyStrengths(analysis: any): string[] {
    const strengths: string[] = [];
    
    if (analysis.consistencyScore >= 70) {
      strengths.push('学習習慣が身についています');
    }
    
    if (analysis.focusPatterns.avgFocus >= 80) {
      strengths.push('高い集中力を維持できています');
    }
    
    if (analysis.focusPatterns.trend === 'improving') {
      strengths.push('集中力が向上傾向にあります');
    }
    
    // 得意科目の特定
    const bestSubject = Object.entries(analysis.subjectPerformance)
      .sort(([,a], [,b]) => (b as any).avgFocus - (a as any).avgFocus)[0];
    
    if (bestSubject && (bestSubject[1] as any).avgFocus >= 75) {
      strengths.push(`${bestSubject[0]}で特に高いパフォーマンスを発揮しています`);
    }
    
    if (analysis.averageSession >= 45) {
      strengths.push('長時間の集中学習ができています');
    }

    return strengths.length > 0 ? strengths : ['学習への取り組みが始まっています'];
  }

  // 課題の特定
  private static identifyWeaknesses(analysis: any): string[] {
    const weaknesses: string[] = [];
    
    if (analysis.consistencyScore < 40) {
      weaknesses.push('学習の継続性に課題があります');
    }
    
    if (analysis.focusPatterns.avgFocus < 60) {
      weaknesses.push('集中力の維持に課題があります');
    }
    
    if (analysis.focusPatterns.trend === 'declining') {
      weaknesses.push('最近集中力が低下傾向にあります');
    }
    
    if (analysis.averageSession < 20) {
      weaknesses.push('学習セッションが短めです');
    }

    // 苦手科目の特定
    const weakSubject = Object.entries(analysis.subjectPerformance)
      .sort(([,a], [,b]) => (a as any).avgFocus - (b as any).avgFocus)[0];
    
    if (weakSubject && (weakSubject[1] as any).avgFocus < 65) {
      weaknesses.push(`${weakSubject[0]}でのパフォーマンス向上の余地があります`);
    }

    return weaknesses;
  }

  // 推奨アクション生成
  private static generateRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];
    
    // 最適な学習時間帯の提案
    if (analysis.timePatterns.bestHours.length > 0) {
      const bestHour = analysis.timePatterns.bestHours[0];
      recommendations.push(`${bestHour}時台の学習が最も効果的です`);
    }
    
    // 一貫性改善の提案
    if (analysis.consistencyScore < 60) {
      recommendations.push('毎日短時間でも学習を継続することを心がけましょう');
    }
    
    // 集中力改善の提案
    if (analysis.focusPatterns.avgFocus < 70) {
      recommendations.push('ポモドーロテクニックを活用して集中力を向上させましょう');
    }
    
    // セッション時間の最適化
    if (analysis.averageSession < 25) {
      recommendations.push('25分以上の学習セッションを目指しましょう');
    } else if (analysis.averageSession > 60) {
      recommendations.push('適度な休憩を取り入れて学習効率を上げましょう');
    }

    return recommendations.length > 0 ? recommendations : [
      '定期的な学習習慣を身につけることから始めましょう',
      '短時間でも毎日継続することが重要です'
    ];
  }

  // 次の目標提案
  private static suggestNextGoals(analysis: any): string[] {
    const goals: string[] = [];
    
    if (analysis.consistencyScore < 80) {
      goals.push('週5日以上の学習習慣を確立する');
    }
    
    if (analysis.focusPatterns.avgFocus < 80) {
      goals.push('平均集中スコア80%以上を達成する');
    }
    
    const weeklyHours = analysis.totalStudyTime / 3600;
    if (weeklyHours < 10) {
      goals.push('週10時間以上の学習時間を確保する');
    } else {
      goals.push(`週${Math.ceil(weeklyHours + 2)}時間の学習を目指す`);
    }
    
    // 苦手科目の改善目標
    const weakSubject = Object.entries(analysis.subjectPerformance)
      .sort(([,a], [,b]) => (a as any).avgFocus - (b as any).avgFocus)[0];
    
    if (weakSubject && (weakSubject[1] as any).avgFocus < 75) {
      goals.push(`${weakSubject[0]}の集中スコアを向上させる`);
    }

    return goals;
  }

  // モチベーションメッセージ生成
  private static generateMotivationalMessage(analysis: any): string {
    if (analysis.focusPatterns.trend === 'improving') {
      return '🚀 順調に成長しています！この調子で継続していきましょう。';
    }
    
    if (analysis.consistencyScore >= 80) {
      return '⭐ 素晴らしい学習習慣が身についていますね！';
    }
    
    if (analysis.totalSessions >= 10) {
      return '💪 積み重ねた努力が必ず結果につながります！';
    }
    
    return '🌟 学習の旅が始まりました。一歩ずつ着実に前進していきましょう！';
  }

  // 週間学習プラン生成
  private static generateWeeklyPlan(analysis: any): WeeklyPlan {
    const currentWeeklyHours = analysis.totalStudyTime / 3600 || 2;
    const targetWeeklyHours = Math.min(currentWeeklyHours * 1.2, 20); // 20%増加、最大20時間
    
    const prioritySubjects = Object.entries(analysis.subjectPerformance)
      .sort(([,a], [,b]) => (a as any).avgFocus - (b as any).avgFocus)
      .slice(0, 3)
      .map(([subject]) => subject);
    
    const focusAreas = this.generateFocusAreas(analysis);
    const dailySchedule = this.generateDailySchedule(targetWeeklyHours, analysis);
    
    return {
      totalHours: Math.round(targetWeeklyHours),
      dailySchedule,
      prioritySubjects,
      focusAreas
    };
  }

  // フォーカスエリア生成
  private static generateFocusAreas(analysis: any): string[] {
    const areas: string[] = [];
    
    if (analysis.focusPatterns.avgFocus < 70) {
      areas.push('集中力向上');
    }
    
    if (analysis.consistencyScore < 70) {
      areas.push('学習習慣の定着');
    }
    
    if (analysis.averageSession < 30) {
      areas.push('持続的学習能力の向上');
    }
    
    return areas.length > 0 ? areas : ['基礎学習習慣の確立'];
  }

  // 日別スケジュール生成
  private static generateDailySchedule(targetWeeklyHours: number, analysis: any): DailyPlan[] {
    const days = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日'];
    const dailyMinutes = (targetWeeklyHours * 60) / 7;
    
    return days.map(day => ({
      day,
      sessions: this.generateDailySessions(dailyMinutes, analysis),
      totalMinutes: Math.round(dailyMinutes)
    }));
  }

  // 日別セッション生成
  private static generateDailySessions(dailyMinutes: number, analysis: any): SessionPlan[] {
    const sessions: SessionPlan[] = [];
    let remainingMinutes = dailyMinutes;
    
    const subjects = Object.keys(analysis.subjectPerformance);
    const bestHour = analysis.timePatterns.bestHours[0] || 19;
    
    // メインセッション
    if (remainingMinutes >= 25) {
      sessions.push({
        subject: subjects[0] || '学習',
        duration: Math.min(50, remainingMinutes),
        timeSlot: `${bestHour}:00`,
        difficulty: 'medium',
        technique: 'ポモドーロテクニック'
      });
      remainingMinutes -= sessions[0].duration;
    }
    
    // 復習セッション
    if (remainingMinutes >= 15 && subjects.length > 1) {
      sessions.push({
        subject: subjects[1] || '復習',
        duration: Math.min(25, remainingMinutes),
        timeSlot: `${bestHour + 1}:00`,
        difficulty: 'easy',
        technique: '復習・確認'
      });
    }
    
    return sessions;
  }

  // デフォルトインサイト（データが少ない場合）
  private static getDefaultInsights(): LearningInsights {
    return {
      strengths: ['学習への意欲があります'],
      weaknesses: ['まだデータが不足しています'],
      recommendations: [
        '毎日短時間でも学習を続けましょう',
        'ポモドーロテクニックを試してみましょう'
      ],
      nextGoals: [
        '週3回以上の学習習慣を作る',
        '1回25分以上の集中学習を心がける'
      ],
      motivationalMessage: '🌱 素晴らしいスタートです！継続が力になります。',
      studyPlan: {
        totalHours: 5,
        dailySchedule: [],
        prioritySubjects: ['基礎学習'],
        focusAreas: ['学習習慣の確立']
      }
    };
  }
}
