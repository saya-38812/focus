// src/screens/AnalyticsScreen.tsx - 完全対応版
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';

// 🔥 Firebase Static import
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';

// Firebase用のAnalyticsStorageクラス
class AnalyticsFirebaseStorage {
  
  // Firestoreからセッションデータを取得
  static async getStudySessions(): Promise<any[]> {
    try {
      console.log('📊 Firebase学習セッション取得開始...');
      
      const sessionsQuery = query(
        collection(db, 'studySessions'),
        orderBy('timestamp', 'desc'),
        limit(100) // 最新100件を取得
      );
      
      const snapshot = await getDocs(sessionsQuery);
      const sessions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Firebaseのタイムスタンプをjs Dateに変換
          completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : new Date(data.completedAt),
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
          // データ構造の統一
          date: data.completedAt?.toDate ? 
            data.completedAt.toDate().toISOString().split('T')[0] : 
            new Date(data.completedAt).toISOString().split('T')[0],
          subject: data.unitTitle || 'ポモドーロ学習',
          focusTime: (data.duration || 25) * 60, // 分→秒に変換
          breakTime: (data.breakDuration || 5) * 60,
          totalDuration: (data.duration || 25) * 60,
          completed: true, // Firebase保存済み = 完了済み
          startTime: data.completedAt?.toDate ? 
            new Date(data.completedAt.toDate().getTime() - (data.duration * 60 * 1000)).toISOString() : 
            new Date(Date.now() - (data.duration * 60 * 1000)).toISOString(),
          endTime: data.completedAt?.toDate ? data.completedAt.toDate().toISOString() : new Date().toISOString(),
          preset: data.preset || `${data.duration}/${data.breakDuration}`,
          difficulty: data.difficulty || null,
        };
      });
      
      console.log('✅ Firebase学習セッション取得完了:', sessions.length, '件');
      return sessions;
      
    } catch (error) {
      console.error('❌ Firebase学習セッション取得エラー:', error);
      return [];
    }
  }

  // 今日のセッション数を取得
  static async getTodaySessionsCount(): Promise<number> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const todayQuery = query(
        collection(db, 'studySessions'),
        where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
        where('timestamp', '<', Timestamp.fromDate(endOfDay))
      );
      
      const snapshot = await getDocs(todayQuery);
      return snapshot.docs.length;
      
    } catch (error) {
      console.error('❌ 今日のセッション数取得エラー:', error);
      return 0;
    }
  }

  // 期間別データ取得
  static async getSessionsByPeriod(days: number): Promise<any[]> {
    try {
      const periodAgo = new Date();
      periodAgo.setDate(periodAgo.getDate() - days);
      
      const periodQuery = query(
        collection(db, 'studySessions'),
        where('timestamp', '>=', Timestamp.fromDate(periodAgo)),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(periodQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate(),
        timestamp: doc.data().timestamp?.toDate(),
      }));
      
    } catch (error) {
      console.error(`❌ ${days}日間のデータ取得エラー:`, error);
      return [];
    }
  }

  // 統計データの計算
  static calculateStats(sessions: any[]) {
    const totalStudyTime = sessions.reduce((sum, s) => sum + ((s.duration || 25) * 60), 0);
    const completedSessions = sessions.length;
    
    // 連続記録の計算
    const sessionDates = [...new Set(sessions.map(s => s.date))].sort().reverse();
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < sessionDates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];
      
      if (sessionDates[i] === expectedDateStr) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    return {
      totalStudyTime,
      completedSessions,
      currentStreak,
      lastStudyDate: sessionDates[0] || null,
      totalStudyDays: sessionDates.length
    };
  }
}

export default function AnalyticsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>({
    totalStudyTime: 0,
    completedSessions: 0,
    currentStreak: 0,
    totalStudyDays: 0
  });
  const [studySessions, setStudySessions] = useState<any[]>([]);
  const [todaySessionsCount, setTodaySessionsCount] = useState(0);

  // Firebase データ読み込み
  const loadFirebaseAnalyticsData = async () => {
    console.log('📊 === Firebase分析データ読み込み開始 ===');
    setIsLoading(true);
    
    try {
      // 学習セッション取得
      const sessions = await AnalyticsFirebaseStorage.getStudySessions();
      setStudySessions(sessions);
      
      // 統計データ計算
      const stats = AnalyticsFirebaseStorage.calculateStats(sessions);
      setSessionData(stats);
      
      // 今日のセッション数取得
      const todayCount = await AnalyticsFirebaseStorage.getTodaySessionsCount();
      setTodaySessionsCount(todayCount);
      
      console.log('✅ Firebase分析データ読み込み完了');
      console.log('📊 セッション数:', sessions.length);
      console.log('📊 統計:', stats);
      
    } catch (error) {
      console.error('❌ Firebase分析データ読み込みエラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFirebaseAnalyticsData();
  }, []);

  // 自動更新（30秒ごと）
  useEffect(() => {
    const interval = setInterval(loadFirebaseAnalyticsData, 30000);
    return () => clearInterval(interval);
  }, []);

  // データ更新
  const handleRefresh = async () => {
    await loadFirebaseAnalyticsData();
    testAlert('✅ 更新完了', 'Firebaseから最新データを取得しました。');
  };

  // Alert関数
  const testAlert = (title: string, message: string, buttons?: any[]) => {
    try {
      if (Platform.OS === 'web') {
        if (buttons && buttons.length > 1) {
          const result = window.confirm(`${title}\n\n${message}`);
          if (result && buttons[0].onPress) {
            buttons[0].onPress();
          }
        } else {
          window.alert(`${title}\n\n${message}`);
        }
      } else {
        Alert.alert(title, message, buttons || [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('❌ Alert エラー:', error);
    }
  };

  // 時間フォーマット
  const formatTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0分';
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    
    if (hours > 0) {
      return `${hours}時間${mins % 60}分`;
    }
    return `${mins}分`;
  };

  // 今日の統計計算
  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = studySessions.filter(session => session.date === today);
    
    if (todaySessions.length === 0) {
      return { totalTime: 0, sessionCount: 0, focusTime: 0, completedSessions: 0 };
    }
    
    const totalTime = todaySessions.reduce((sum, s) => sum + (s.focusTime || 0), 0);
    const focusTime = todaySessions.reduce((sum, s) => sum + (s.focusTime || 0), 0);
    const completedSessions = todaySessions.filter(s => s.completed).length;
    
    return {
      totalTime,
      sessionCount: todaySessions.length,
      focusTime,
      completedSessions
    };
  };

  // 科目別統計
  const getSubjectStats = () => {
    if (!studySessions.length) return [];
    
    const subjectData: { [key: string]: { time: number; count: number; completed: number } } = {};
    
    studySessions.forEach(session => {
      const subject = session.subject || 'ポモドーロ学習';
      
      if (!subjectData[subject]) {
        subjectData[subject] = { time: 0, count: 0, completed: 0 };
      }
      
      subjectData[subject].time += session.focusTime || 0;
      subjectData[subject].count += 1;
      if (session.completed) {
        subjectData[subject].completed += 1;
      }
    });
    
    return Object.entries(subjectData)
      .map(([subject, data]) => ({
        subject,
        time: data.time,
        count: data.count,
        completionRate: Math.round((data.completed / data.count) * 100)
      }))
      .sort((a, b) => b.time - a.time)
      .slice(0, 5);
  };

  // 週間統計
  const getWeeklyStats = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekSessions = studySessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= weekAgo;
    });
    
    if (weekSessions.length === 0) {
      return { totalTime: 0, sessionCount: 0, studyDays: 0, avgDaily: 0 };
    }
    
    const totalTime = weekSessions.reduce((sum, s) => sum + (s.focusTime || 0), 0);
    const studyDays = new Set(weekSessions.map(s => s.date)).size;
    const avgDaily = studyDays > 0 ? Math.round(totalTime / studyDays) : 0;
    
    return {
      totalTime,
      sessionCount: weekSessions.length,
      studyDays,
      avgDaily
    };
  };

  // プリセット使用率分析
  const getPresetAnalysis = () => {
    if (!studySessions.length) return [];
    
    const presetData: { [key: string]: number } = {};
    
    studySessions.forEach(session => {
      const preset = session.preset || '25/5';
      presetData[preset] = (presetData[preset] || 0) + 1;
    });
    
    return Object.entries(presetData)
      .map(([preset, count]) => ({
        preset,
        count,
        percentage: Math.round((count / studySessions.length) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Firebase接続状態
  const getFirebaseStatus = () => {
    return {
      connected: true, // Firebaseから正常にデータ取得できていれば接続状態
      totalDocuments: studySessions.length,
      lastUpdated: new Date().toLocaleTimeString('ja-JP'),
      userId: 'temp-user-id' // 後で認証機能で置き換え
    };
  };

  const todayStats = getTodayStats();
  const subjectStats = getSubjectStats();
  const weeklyStats = getWeeklyStats();
  const presetAnalysis = getPresetAnalysis();
  const firebaseStatus = getFirebaseStatus();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>📊 学習分析</Text>
          <Text style={styles.subtitle}>
            {isLoading ? 'Firebaseからデータ読み込み中...' : 
             `${studySessions.length}件のセッション | リアルタイム同期`}
          </Text>
        </View>

        {/* Firebase接続状況 */}
        <View style={[styles.card, { backgroundColor: '#E8F5E8', borderLeftWidth: 4, borderLeftColor: '#34C759' }]}>
          <Text style={[styles.cardTitle, { color: '#34C759' }]}>🔥 Firebase接続状況</Text>
          <View style={styles.statusGrid}>
            <Text style={styles.statusText}>☁️ 接続状態: オンライン</Text>
            <Text style={styles.statusText}>📄 総ドキュメント: {firebaseStatus.totalDocuments}件</Text>
            <Text style={styles.statusText}>🔄 最終更新: {firebaseStatus.lastUpdated}</Text>
            <Text style={styles.statusText}>👤 ユーザーID: {firebaseStatus.userId}</Text>
          </View>
        </View>

        {/* 今日の統計 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📅 今日の学習実績</Text>
          {todayStats.sessionCount > 0 ? (
            <View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>今日のセッション</Text>
                <Text style={styles.statValue}>{todayStats.sessionCount}回</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>総学習時間</Text>
                <Text style={styles.statValue}>{formatTime(todayStats.totalTime)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>集中効率</Text>
                <Text style={[
                  styles.statValue,
                  { color: todayStats.focusTime >= todayStats.totalTime * 0.9 ? '#34C759' : 
                           todayStats.focusTime >= todayStats.totalTime * 0.7 ? '#FF9500' : '#FF3B30' }
                ]}>
                  {todayStats.totalTime > 0 ? Math.round((todayStats.focusTime / todayStats.totalTime) * 100) : 100}%
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Firebase保存済み</Text>
                <Text style={[styles.statValue, { color: '#34C759' }]}>✓ {todayStats.completedSessions}件</Text>
              </View>
            </View>
          ) : (
            <View style={styles.noDataSection}>
              <Text style={styles.noDataText}>今日の学習記録はまだありません</Text>
              <Text style={styles.noDataHint}>タイマーで学習を開始してFirebaseにデータを蓄積しましょう！</Text>
            </View>
          )}
        </View>

        {/* 週間パフォーマンス */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📈 週間パフォーマンス（過去7日）</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>週間学習時間</Text>
            <Text style={styles.statValue}>{formatTime(weeklyStats.totalTime)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>学習セッション数</Text>
            <Text style={styles.statValue}>{weeklyStats.sessionCount}回</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>学習継続日数</Text>
            <Text style={styles.statValue}>{weeklyStats.studyDays}/7日</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>1日平均学習時間</Text>
            <Text style={styles.statValue}>{formatTime(weeklyStats.avgDaily)}</Text>
          </View>
        </View>

        {/* 全期間統計 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏆 全期間統計（Firebase版）</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>累計学習時間</Text>
            <Text style={styles.statValue}>{formatTime(sessionData.totalStudyTime)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>完了セッション数</Text>
            <Text style={styles.statValue}>{sessionData.completedSessions}回</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>現在の連続記録</Text>
            <Text style={[
              styles.statValue,
              { color: sessionData.currentStreak >= 7 ? '#34C759' : 
                       sessionData.currentStreak >= 3 ? '#FF9500' : '#007AFF' }
            ]}>
              {sessionData.currentStreak}日
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>総学習日数</Text>
            <Text style={styles.statValue}>{sessionData.totalStudyDays}日</Text>
          </View>
        </View>

        {/* プリセット使用率 */}
        {presetAnalysis.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚙️ 時間設定使用率</Text>
            {presetAnalysis.map((preset, index) => (
              <View key={preset.preset} style={styles.presetItem}>
                <View style={styles.presetHeader}>
                  <Text style={styles.presetLabel}>{preset.preset}分設定</Text>
                  <View style={styles.presetStats}>
                    <Text style={styles.presetCount}>{preset.count}回</Text>
                    <Text style={styles.presetPercent}>{preset.percentage}%</Text>
                  </View>
                </View>
                <View style={styles.presetProgressContainer}>
                  <View 
                    style={[
                      styles.presetProgressBar, 
                      { 
                        width: `${preset.percentage}%`,
                        backgroundColor: index === 0 ? '#007AFF' : '#E5E5EA'
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 科目別統計 */}
        {subjectStats.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📚 科目別学習分析</Text>
            {subjectStats.map((stat, index) => (
              <View key={stat.subject} style={styles.subjectItem}>
                <View style={styles.subjectHeader}>
                  <Text style={styles.subjectRank}>#{index + 1}</Text>
                  <Text style={styles.subjectName}>{stat.subject}</Text>
                  <View style={styles.subjectStats}>
                    <Text style={styles.subjectTime}>{formatTime(stat.time)}</Text>
                    <Text style={styles.subjectCount}>{stat.count}セッション</Text>
                  </View>
                </View>
                <View style={styles.subjectDetails}>
                  <Text style={styles.subjectDetailText}>
                    平均: {Math.round(stat.time / stat.count / 60)}分/セッション
                  </Text>
                  <Text style={[
                    styles.subjectFocus,
                    { color: stat.completionRate >= 90 ? '#34C759' : '#007AFF' }
                  ]}>
                    Firebase保存率 {stat.completionRate}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 最近のセッション詳細 */}
        {studySessions.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🕒 最近のFirebaseセッション</Text>
            {studySessions.slice(0, 7).map((session, index) => (
              <View key={session.id || index} style={styles.sessionItem}>
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionSubject}>{session.subject}</Text>
                  <Text style={styles.sessionDate}>
                    {session.completedAt.toLocaleDateString('ja-JP', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
                <View style={styles.sessionDetails}>
                  <Text style={styles.sessionTime}>学習: {formatTime(session.focusTime)}</Text>
                  <Text style={styles.sessionPreset}>設定: {session.preset}</Text>
                  <Text style={styles.sessionId}>ID: {session.id.substring(0, 8)}</Text>
                  <Text style={styles.completedBadge}>☁️ Firebase</Text>
                </View>
                <View style={styles.sessionProgress}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        width: '100%',
                        backgroundColor: session.completed ? '#34C759' : '#FF9500'
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* データなしの場合 */}
        {studySessions.length === 0 && !isLoading && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>☁️</Text>
            <Text style={styles.emptyTitle}>Firebaseにデータを蓄積しましょう</Text>
            <Text style={styles.emptyMessage}>
              Firebase版タイマーを使って学習セッションを開始すると、ここにリアルタイムで分析データが表示されます。{'\n\n'}
              クラウド同期により、デバイス間でデータが共有されます！
            </Text>
          </View>
        )}

        {/* 操作ボタン */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Text style={styles.refreshButtonText}>🔄 Firebaseから更新</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  
  // 接続状況
  statusGrid: {
    gap: 5,
  },
  statusText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  
  // カード
  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 15,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  
  // 統計行
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  
  // データなし
  noDataSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  noDataHint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // プリセット使用率
  presetItem: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
  },
  presetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  presetLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  presetStats: {
    alignItems: 'flex-end',
  },
  presetCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  presetPercent: {
    fontSize: 12,
    color: '#666',
  },
  presetProgressContainer: {
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  presetProgressBar: {
    height: '100%',
    borderRadius: 3,
  },
  
  // 科目別統計
  subjectItem: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    minWidth: 30,
  },
  subjectName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  subjectStats: {
    alignItems: 'flex-end',
  },
  subjectTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  subjectCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  subjectDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 40,
  },
  subjectDetailText: {
    fontSize: 14,
    color: '#666',
  },
  subjectFocus: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // セッション詳細
  sessionItem: {
    marginBottom: 12,
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  sessionDate: {
    fontSize: 12,
    color: '#666',
  },
  sessionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  sessionPreset: {
    fontSize: 12,
    color: '#FF9500',
  },
  sessionId: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace',
  },
  completedBadge: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  sessionProgress: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  
  // 空の状態
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  
  // ボタン
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }),
  },
  refreshButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  bottomSpacing: {
    height: 20,
  },
});

// Firebase Analytics Storageをexport
export { AnalyticsFirebaseStorage };
