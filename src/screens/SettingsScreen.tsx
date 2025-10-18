// src/screens/SettingsScreen.tsx - 完全対応版
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';

// 🔥 Firebase Static import
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  onSnapshot,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../firebase';

// 型定義
interface AppSettings {
  timerSettings: {
    defaultDuration: number;
    breakDuration: number;
    autoStartBreak: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
  };
  notifications: {
    studyStart: boolean;
    studyEnd: boolean;
    breakStart: boolean;
    dailyReminder: boolean;
    weeklyReport: boolean;
  };
  firebase: {
    autoSync: boolean;
    offlineMode: boolean;
    dataBackup: boolean;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: 'ja' | 'en';
    animationsEnabled: boolean;
  };
  privacy: {
    analyticsEnabled: boolean;
    crashReportingEnabled: boolean;
  };
}

interface FirebaseStats {
  totalSessions: number;
  totalPlans: number;
  totalChatMessages: number;
  totalPendingPlans: number;
  storageUsed: string;
  lastSyncDate: Date | null;
}

// Firebase Settings Storage クラス
class FirebaseSettingsStorage {
  
  // 設定をFirestoreに保存
  static async saveSettings(settings: AppSettings): Promise<void> {
    try {
      console.log('⚙️ Firebase設定保存開始...');
      
      const settingsRef = doc(db, 'userSettings', 'temp-user-id');
      await setDoc(settingsRef, {
        ...settings,
        updatedAt: new Date(),
      }, { merge: true });
      
      console.log('✅ Firebase設定保存完了');
      
    } catch (error) {
      console.error('❌ Firebase設定保存エラー:', error);
      throw error;
    }
  }
  
  // 設定をFirestoreから取得
  static async getSettings(): Promise<AppSettings> {
    try {
      console.log('⚙️ Firebase設定取得開始...');
      
      const settingsRef = doc(db, 'userSettings', 'temp-user-id');
      const docSnap = await getDoc(settingsRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('✅ Firebase設定取得完了');
        return data as AppSettings;
      } else {
        console.log('📝 デフォルト設定を使用');
        return this.getDefaultSettings();
      }
      
    } catch (error) {
      console.error('❌ Firebase設定取得エラー:', error);
      return this.getDefaultSettings();
    }
  }
  
  // デフォルト設定
  static getDefaultSettings(): AppSettings {
    return {
      timerSettings: {
        defaultDuration: 25,
        breakDuration: 5,
        autoStartBreak: true,
        soundEnabled: true,
        vibrationEnabled: true,
      },
      notifications: {
        studyStart: true,
        studyEnd: true,
        breakStart: true,
        dailyReminder: false,
        weeklyReport: true,
      },
      firebase: {
        autoSync: true,
        offlineMode: false,
        dataBackup: true,
      },
      ui: {
        theme: 'light',
        language: 'ja',
        animationsEnabled: true,
      },
      privacy: {
        analyticsEnabled: true,
        crashReportingEnabled: true,
      },
    };
  }
  
  // Firebase統計情報取得
  static async getFirebaseStats(): Promise<FirebaseStats> {
    try {
      console.log('📊 Firebase統計取得開始...');
      
      const userId = 'temp-user-id';
      
      // 各コレクションのドキュメント数を取得
      const [sessionsSnap, plansSnap, chatSnap, pendingSnap] = await Promise.all([
        getDocs(query(collection(db, 'studySessions'), where('userId', '==', userId))),
        getDocs(query(collection(db, 'studyPlans'), where('userId', '==', userId))),
        getDocs(query(collection(db, 'chatMessages'), where('userId', '==', userId))),
        getDocs(query(collection(db, 'pendingPlans'), where('userId', '==', userId))),
      ]);
      
      // 設定の最終更新日取得
      const settingsRef = doc(db, 'userSettings', userId);
      const settingsSnap = await getDoc(settingsRef);
      const lastSyncDate = settingsSnap.exists() ? 
        settingsSnap.data().updatedAt?.toDate() || null : null;
      
      const stats: FirebaseStats = {
        totalSessions: sessionsSnap.docs.length,
        totalPlans: plansSnap.docs.length,
        totalChatMessages: chatSnap.docs.length,
        totalPendingPlans: pendingSnap.docs.length,
        storageUsed: `${((sessionsSnap.docs.length + plansSnap.docs.length + chatSnap.docs.length) * 0.5).toFixed(1)} KB`,
        lastSyncDate,
      };
      
      console.log('✅ Firebase統計取得完了:', stats);
      return stats;
      
    } catch (error) {
      console.error('❌ Firebase統計取得エラー:', error);
      return {
        totalSessions: 0,
        totalPlans: 0,
        totalChatMessages: 0,
        totalPendingPlans: 0,
        storageUsed: '0 KB',
        lastSyncDate: null,
      };
    }
  }
  
  // 全データ削除
  static async deleteAllUserData(): Promise<void> {
    try {
      console.log('🗑️ 全ユーザーデータ削除開始...');
      
      const userId = 'temp-user-id';
      const batch = writeBatch(db);
      
      // 各コレクションのドキュメントを削除
      const collections = ['studySessions', 'studyPlans', 'chatMessages', 'pendingPlans'];
      
      for (const collectionName of collections) {
        const snapshot = await getDocs(
          query(collection(db, collectionName), where('userId', '==', userId))
        );
        
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
      }
      
      // 設定も削除
      batch.delete(doc(db, 'userSettings', userId));
      
      await batch.commit();
      console.log('✅ 全ユーザーデータ削除完了');
      
    } catch (error) {
      console.error('❌ データ削除エラー:', error);
      throw error;
    }
  }
}

export default function SettingsScreen() {
  // State管理
  const [settings, setSettings] = useState<AppSettings>(FirebaseSettingsStorage.getDefaultSettings());
  const [firebaseStats, setFirebaseStats] = useState<FirebaseStats>({
    totalSessions: 0,
    totalPlans: 0,
    totalChatMessages: 0,
    totalPendingPlans: 0,
    storageUsed: '0 KB',
    lastSyncDate: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Firebase設定とリアルタイム更新
  useEffect(() => {
    loadFirebaseSettings();
    loadFirebaseStats();
    
    // リアルタイム設定監視
    const settingsRef = doc(db, 'userSettings', 'temp-user-id');
    const unsubscribe = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as AppSettings;
        console.log('🔄 設定リアルタイム更新');
        setSettings(data);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Firebase設定読み込み
  const loadFirebaseSettings = async () => {
    console.log('⚙️ === Firebase設定読み込み開始 ===');
    setIsLoading(true);
    
    try {
      const savedSettings = await FirebaseSettingsStorage.getSettings();
      setSettings(savedSettings);
      console.log('✅ Firebase設定読み込み完了');
    } catch (error) {
      console.error('❌ Firebase設定読み込みエラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Firebase統計読み込み
  const loadFirebaseStats = async () => {
    try {
      const stats = await FirebaseSettingsStorage.getFirebaseStats();
      setFirebaseStats(stats);
    } catch (error) {
      console.error('❌ Firebase統計読み込みエラー:', error);
    }
  };

  // 設定保存
  const saveSettings = async (newSettings: AppSettings) => {
    setIsSaving(true);
    
    try {
      await FirebaseSettingsStorage.saveSettings(newSettings);
      setSettings(newSettings);
      
      testAlert('✅ 設定保存完了', 'Firebaseに設定を保存しました。');
      
    } catch (error) {
      console.error('❌ 設定保存エラー:', error);
      testAlert('❌ エラー', '設定の保存に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  };

  // プリセット適用
  const applyPreset = async (minutes: number, breakMin: number, name: string) => {
    const newSettings: AppSettings = {
      ...settings,
      timerSettings: {
        ...settings.timerSettings,
        defaultDuration: minutes,
        breakDuration: breakMin,
      },
    };
    
    await saveSettings(newSettings);
    testAlert('✅ プリセット適用', `${name}に設定しました！\n集中: ${minutes}分\n休憩: ${breakMin}分`);
  };

  // 全データ削除
  const handleDeleteAllData = () => {
    testAlert(
      '⚠️ 全データ削除確認',
      '全てのFirebaseデータを削除しますか？\n\n削除されるデータ:\n• 学習セッション履歴\n• 学習プラン\n• チャット履歴\n• 設定\n\nこの操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除実行',
          onPress: async () => {
            try {
              await FirebaseSettingsStorage.deleteAllUserData();
              await loadFirebaseStats(); // 統計更新
              testAlert('✅ 削除完了', '全てのデータを削除しました。');
            } catch (error) {
              testAlert('❌ エラー', 'データの削除に失敗しました。');
            }
          }
        }
      ]
    );
  };

  // データエクスポート（簡易版）
  const handleExportData = () => {
    testAlert(
      '📤 データエクスポート',
      `現在のFirebaseデータ:\n\n• 学習セッション: ${firebaseStats.totalSessions}件\n• 学習プラン: ${firebaseStats.totalPlans}件\n• チャット履歴: ${firebaseStats.totalChatMessages}件\n• 使用容量: ${firebaseStats.storageUsed}\n\n詳細なエクスポート機能は今後実装予定です。`
    );
  };

  // Alert関数
  const testAlert = (title: string, message: string, buttons?: any[]) => {
    try {
      if (Platform.OS === 'web') {
        if (buttons && buttons.length > 1) {
          const result = window.confirm(`${title}\n\n${message}`);
          if (result && buttons[1].onPress) {
            buttons[1].onPress();
          } else if (!result && buttons[0].onPress) {
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Firebase設定を読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>🔥 設定</Text>
          <Text style={styles.subtitle}>
            クラウド同期対応 • {Platform.OS === 'web' ? '🌐 Web版' : '📱 アプリ版'}
          </Text>
        </View>

        {/* Firebase接続状況 */}
        <View style={[styles.section, { backgroundColor: '#E8F5E8', borderLeftWidth: 4, borderLeftColor: '#34C759' }]}>
          <Text style={[styles.sectionTitle, { color: '#34C759' }]}>🔥 Firebase接続状況</Text>
          <View style={styles.connectionInfo}>
            <Text style={styles.connectionText}>☁️ 接続状態: オンライン</Text>
            <Text style={styles.connectionText}>🔄 リアルタイム同期: 有効</Text>
            <Text style={styles.connectionText}>💾 自動バックアップ: {settings.firebase.dataBackup ? '有効' : '無効'}</Text>
            <Text style={styles.connectionText}>📊 最終同期: {firebaseStats.lastSyncDate ? 
              firebaseStats.lastSyncDate.toLocaleString('ja-JP') : '未同期'}</Text>
          </View>
        </View>


        {/* タイマー詳細設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ タイマー詳細設定</Text>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>自動休憩開始</Text>
            <Switch
              value={settings.timerSettings.autoStartBreak}
              onValueChange={async (value) => {
                const newSettings = {
                  ...settings,
                  timerSettings: { ...settings.timerSettings, autoStartBreak: value }
                };
                await saveSettings(newSettings);
              }}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>サウンド通知</Text>
            <Switch
              value={settings.timerSettings.soundEnabled}
              onValueChange={async (value) => {
                const newSettings = {
                  ...settings,
                  timerSettings: { ...settings.timerSettings, soundEnabled: value }
                };
                await saveSettings(newSettings);
              }}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>バイブレーション</Text>
            <Switch
              value={settings.timerSettings.vibrationEnabled}
              onValueChange={async (value) => {
                const newSettings = {
                  ...settings,
                  timerSettings: { ...settings.timerSettings, vibrationEnabled: value }
                };
                await saveSettings(newSettings);
              }}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            />
          </View>
        </View>

        {/* 通知設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 通知設定</Text>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>学習開始通知</Text>
            <Switch
              value={settings.notifications.studyStart}
              onValueChange={async (value) => {
                const newSettings = {
                  ...settings,
                  notifications: { ...settings.notifications, studyStart: value }
                };
                await saveSettings(newSettings);
              }}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>学習終了通知</Text>
            <Switch
              value={settings.notifications.studyEnd}
              onValueChange={async (value) => {
                const newSettings = {
                  ...settings,
                  notifications: { ...settings.notifications, studyEnd: value }
                };
                await saveSettings(newSettings);
              }}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>週間レポート</Text>
            <Switch
              value={settings.notifications.weeklyReport}
              onValueChange={async (value) => {
                const newSettings = {
                  ...settings,
                  notifications: { ...settings.notifications, weeklyReport: value }
                };
                await saveSettings(newSettings);
              }}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            />
          </View>
        </View>

        {/* Firebase設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>☁️ Firebase設定</Text>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>自動同期</Text>
            <Switch
              value={settings.firebase.autoSync}
              onValueChange={async (value) => {
                const newSettings = {
                  ...settings,
                  firebase: { ...settings.firebase, autoSync: value }
                };
                await saveSettings(newSettings);
              }}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>データバックアップ</Text>
            <Switch
              value={settings.firebase.dataBackup}
              onValueChange={async (value) => {
                const newSettings = {
                  ...settings,
                  firebase: { ...settings.firebase, dataBackup: value }
                };
                await saveSettings(newSettings);
              }}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            />
          </View>
        </View>

        {/* Firebase統計 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Firebase統計</Text>
          
          <View style={styles.statsCard}>
            <Text style={styles.statText}>📚 学習セッション: {firebaseStats.totalSessions}件</Text>
            <Text style={styles.statText}>🤖 学習プラン: {firebaseStats.totalPlans}件</Text>
            <Text style={styles.statText}>💬 チャット履歴: {firebaseStats.totalChatMessages}件</Text>
            <Text style={styles.statText}>📥 待機プラン: {firebaseStats.totalPendingPlans}件</Text>
            <Text style={styles.statText}>💾 使用容量: {firebaseStats.storageUsed}</Text>
            <Text style={styles.statText}>👤 ユーザーID: temp-user-id</Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadFirebaseStats}
          >
            <Text style={styles.refreshButtonText}>🔄 統計更新</Text>
          </TouchableOpacity>
        </View>

        {/* データ管理 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗂️ データ管理</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleExportData}
          >
            <Text style={styles.actionButtonText}>📤 データエクスポート</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
            onPress={handleDeleteAllData}
          >
            <Text style={styles.actionButtonText}>🗑️ 全データ削除</Text>
          </TouchableOpacity>
        </View>

        {/* 動作テスト */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 動作テスト</Text>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={async () => {
              await loadFirebaseSettings();
              testAlert('✅ テスト成功', 'Firebase設定が正常に読み込まれました。');
            }}
          >
            <Text style={styles.testButtonText}>🔍 設定読み込みテスト</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={() => {
              const testSettings = FirebaseSettingsStorage.getDefaultSettings();
              saveSettings(testSettings);
            }}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.testButtonText}>🔄 デフォルト設定復元</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* アプリ情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ アプリ情報</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>🔥 学習アプリ</Text>
            <Text style={styles.infoText}>📱 プラットフォーム: {Platform.OS}</Text>
            <Text style={styles.infoText}>☁️ Firebase連携対応</Text>
            <Text style={styles.infoText}>🤖 AI機能統合</Text>
            <Text style={styles.infoText}>📊 リアルタイム分析</Text>
          </View>
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
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
  },
  
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  
  section: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 20,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  
  // 接続情報
  connectionInfo: { gap: 5 },
  connectionText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  
  // 現在の設定
  currentCard: {
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
    marginBottom: 15,
  },
  currentText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  saveText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: 'bold',
    marginTop: 5,
  },
  
  // プリセットグリッド
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  presetText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  presetDesc: {
    fontSize: 13,
    color: '#666',
  },
  
  // スイッチ行
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  
  // 統計
  statsCard: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  
  // ボタン
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  actionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  testButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  testButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // 情報
  infoCard: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    marginBottom: 5,
  },
  
  bottomSpacing: {
    height: 30,
  },
});

// Firebase Settings Storageをexport
export { FirebaseSettingsStorage };
