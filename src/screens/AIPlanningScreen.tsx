// src/screens/AIPlanningScreen.tsx - 完全修正版（続き）
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

// 🔥 Firebase Static import
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  where, 
  onSnapshot, 
  deleteDoc,
  updateDoc,
  Timestamp,
  limit
} from 'firebase/firestore';
import { db } from '../../firebase';

// 型定義
interface StudyUnit {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  difficulty: 'easy' | 'medium' | 'hard';
  learningObjectives: string[];
  completed?: boolean;
  completedAt?: Date;
}

interface StudyPlan {
  id?: string;
  subject: string;
  currentLevel: string;
  totalUnits: number;
  completedUnits: number;
  studyPath: {
    currentFocus: string;
    nextStep: string;
    longTermGoal: string;
    recommendedSchedule: string[];
  };
  units: StudyUnit[];
  estimatedCompletionWeeks: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  source: 'ai_chat' | 'manual' | 'imported';
  status: 'active' | 'completed' | 'paused';
}

interface PendingPlan {
  id?: string;
  subject: string;
  units: StudyUnit[];
  schedule: string[];
  source: 'ai_chat';
  createdAt: Date;
  userId: string;
  processed: boolean;
}

// Firebase Plan Storage クラス（完全修正版）
class FirebasePlanStorage {
  
  // 学習計画をFirestoreに保存
  static async savePlan(plan: Omit<StudyPlan, 'id'>): Promise<string> {
    try {
      console.log('📚 Firebase学習計画保存開始:', plan.subject);
      
      const planData = {
        ...plan,
        createdAt: Timestamp.fromDate(plan.createdAt),
        updatedAt: Timestamp.fromDate(plan.updatedAt),
      };
      
      const docRef = await addDoc(collection(db, 'studyPlans'), planData);
      console.log('✅ Firebase学習計画保存完了:', docRef.id);
      return docRef.id;
      
    } catch (error) {
      console.error('❌ Firebase学習計画保存エラー:', error);
      throw error;
    }
  }
  
 // 99行目あたりの getAllPlans を修正
static async getAllPlans(): Promise<StudyPlan[]> {
    try {
      console.log('📚 === Firebase学習計画取得開始（インデックス不要版） ===');
      
      // シンプルなクエリ（whereのみ、orderByなし）
      const plansQuery = query(
        collection(db, 'studyPlans'),
        where('userId', '==', 'temp-user-id')
        // orderBy を削除してインデックス不要に
      );
      
      const snapshot = await getDocs(plansQuery);
      
      // クライアント側でソート
      const plans = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
          } as StudyPlan;
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // クライアント側でソート
      
      console.log('✅ Firebase学習計画取得完了:', plans.length, '件');
      console.log('📋 取得したプラン:', plans.map(p => ({ 
        id: p.id, 
        subject: p.subject, 
        status: p.status 
      })));
      
      return plans;
      
    } catch (error) {
      console.error('❌ Firebase学習計画取得エラー:', error);
      console.error('エラー詳細:', error);
      return [];
    }
  }
  
  // 待機中のプランを取得（完全修正版）
  static async getPendingPlans(): Promise<PendingPlan[]> {
    try {
      console.log('📥 === Firebase待機プラン取得開始（インデックス不要版） ===');
      
      // シンプルなクエリ（whereのみ、orderByなし）
      const pendingQuery = query(
        collection(db, 'pendingPlans'),
        where('userId', '==', 'temp-user-id'),
        where('processed', '==', false)
        // orderBy を削除してインデックス不要に
      );
      
      const snapshot = await getDocs(pendingQuery);
      
      // クライアント側でソート
      const pendingPlans = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          } as PendingPlan;
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // クライアント側でソート
      
      console.log('✅ Firebase待機プラン取得完了:', pendingPlans.length, '件');
      console.log('📋 待機プラン:', pendingPlans.map(p => ({ 
        id: p.id, 
        subject: p.subject, 
        processed: p.processed 
      })));
      
      return pendingPlans;
      
    } catch (error) {
      console.error('❌ Firebase待機プラン取得エラー:', error);
      console.error('エラー詳細:', error);
      return [];
    }
  }
  
  // 待機中のプランを処理済みにマーク
  static async markPendingPlanProcessed(planId: string): Promise<void> {
    try {
      const planRef = doc(db, 'pendingPlans', planId);
      await updateDoc(planRef, { 
        processed: true,
        processedAt: Timestamp.now()
      });
      console.log('✅ 待機プラン処理完了:', planId);
    } catch (error) {
      console.error('❌ 待機プラン処理エラー:', error);
      throw error;
    }
  }
  
  // 計画を削除
  static async deletePlan(planId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'studyPlans', planId));
      console.log('✅ Firebase計画削除完了:', planId);
    } catch (error) {
      console.error('❌ Firebase計画削除エラー:', error);
      throw error;
    }
  }

  // 強制データ更新（完全修正版）
  static async forceRefreshData(): Promise<{ plans: StudyPlan[], pending: PendingPlan[] }> {
    try {
      console.log('🔄 === 強制データ更新開始（完全修正版） ===');
      
      const [plans, pending] = await Promise.all([
        this.getAllPlans(),
        this.getPendingPlans()
      ]);
      
      console.log('🔄 強制更新結果:');
      console.log('  - アクティブプラン:', plans.length, '件');
      console.log('  - 待機プラン:', pending.length, '件');
      
      return { plans, pending };
    } catch (error) {
      console.error('❌ 強制データ更新エラー:', error);
      return { plans: [], pending: [] };
    }
  }

  // デバッグ用：全データ確認
  static async debugCheckAllData(): Promise<void> {
    try {
      console.log('🔍 === Firebase全データ確認開始 ===');
      
      // pendingPlans全体を確認
      const allPendingQuery = query(
        collection(db, 'pendingPlans'),
        limit(10)
      );
      const allPendingSnap = await getDocs(allPendingQuery);
      console.log('📥 pendingPlans全体:', allPendingSnap.size, '件');
      allPendingSnap.docs.forEach(doc => {
        const data = doc.data();
        console.log('  -', doc.id, ':', {
          subject: data.subject,
          userId: data.userId,
          processed: data.processed,
          hasCreatedAt: !!data.createdAt
        });
      });
      
      // studyPlans全体を確認
      const allPlansQuery = query(
        collection(db, 'studyPlans'),
        limit(10)
      );
      const allPlansSnap = await getDocs(allPlansQuery);
      console.log('📚 studyPlans全体:', allPlansSnap.size, '件');
      allPlansSnap.docs.forEach(doc => {
        const data = doc.data();
        console.log('  -', doc.id, ':', {
          subject: data.subject,
          userId: data.userId,
          status: data.status
        });
      });
      
    } catch (error) {
      console.error('❌ デバッグ確認エラー:', error);
    }
  }
}

export default function AIPlanningScreen() {
  const navigation = useNavigation();
  
  // State管理
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [pendingPlans, setPendingPlans] = useState<PendingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPendingConfirm, setShowPendingConfirm] = useState(false);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Firebase データ読み込み（完全修正版）
  const loadFirebasePlans = async (showLoadingIndicator = true) => {
    console.log('📚 === Firebase計画データ読み込み開始（完全修正版） ===');
    if (showLoadingIndicator) setIsLoading(true);
    
    try {
      // 強制的にデータを取得
      const { plans, pending } = await FirebasePlanStorage.forceRefreshData();
      
      console.log('📚 データ読み込み結果:');
      console.log('  - 設定するプラン数:', plans.length);
      console.log('  - 設定する待機数:', pending.length);
      
      setStudyPlans(plans);
      setPendingPlans(pending);
      
      // 待機中のプランがあれば確認ダイアログ表示
      if (pending.length > 0) {
        console.log('📥 待機プランあり - 確認ダイアログ表示');
        setShowPendingConfirm(true);
      } else {
        console.log('📥 待機プランなし');
      }
      
      console.log('✅ Firebase計画データ読み込み完了');
      
    } catch (error) {
      console.error('❌ Firebase計画データ読み込みエラー:', error);
    } finally {
      if (showLoadingIndicator) setIsLoading(false);
    }
  };

  // 手動更新
  const handleManualRefresh = async () => {
    console.log('🔄 手動更新開始');
    setRefreshing(true);
    await loadFirebasePlans(false);
    setRefreshing(false);
    testAlert('✅ 更新完了', 'Firebaseから最新データを取得しました。');
  };

  // デバッグ用：全データ確認
  const handleDebugCheck = async () => {
    console.log('🔍 デバッグ確認ボタン押下');
    await FirebasePlanStorage.debugCheckAllData();
    testAlert('🔍 デバッグ確認', 'コンソールログを確認してください。');
  };

  // 画面フォーカス時の更新（完全修正版）
  useFocusEffect(
    React.useCallback(() => {
      console.log('👁️ 画面フォーカス: データ再読み込み（完全修正版）');
      loadFirebasePlans(false);
    }, [])
  );

  // 初回データ読み込み + リアルタイムリスナー設定（完全修正版）
  useEffect(() => {
    console.log('🚀 AIPlanningScreenFirebase 初期化開始（完全修正版）');
    
    // 初回データ読み込み
    loadFirebasePlans();
    
    // リアルタイムリスナーを設定
    const setupRealtimeListeners = () => {
      console.log('🔄 リアルタイムリスナー設定開始（完全修正版）');
      
      // 学習プランのリアルタイムリスナー
      const plansQuery = query(
        collection(db, 'studyPlans'),
        where('userId', '==', 'temp-user-id')
        // orderBy 削除
      );
      
      const unsubscribePlans = onSnapshot(
        plansQuery, 
        (snapshot) => {
          console.log('🔄 プランリアルタイム更新:', snapshot.docs.length, '件');
          
          // クライアント側でソート
          const plans = snapshot.docs
            .map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
              } as StudyPlan;
            })
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          
          console.log('📋 リアルタイム取得プラン:', plans.map(p => p.subject));
          setStudyPlans(plans);
        }, 
        (error) => {
          console.error('❌ プランリアルタイムリスナーエラー:', error);
        }
      );
      
      // 待機プランのリアルタイムリスナー
      const pendingQuery = query(
        collection(db, 'pendingPlans'),
        where('userId', '==', 'temp-user-id'),
        where('processed', '==', false),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribePending = onSnapshot(
        pendingQuery, 
        (snapshot) => {
          console.log('🔄 待機プランリアルタイム更新:', snapshot.docs.length, '件');
          const pending = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            } as PendingPlan;
          });
          
          console.log('📥 リアルタイム取得待機プラン:', pending.map(p => p.subject));
          setPendingPlans(pending);
          
          if (pending.length > 0 && !showPendingConfirm) {
            console.log('📥 新しい待機プラン検出 - ダイアログ表示');
            setShowPendingConfirm(true);
          }
        }, 
        (error) => {
          console.error('❌ 待機プランリアルタイムリスナーエラー:', error);
        }
      );
      
      return () => {
        console.log('🛑 リアルタイムリスナー解除');
        unsubscribePlans();
        unsubscribePending();
      };
    };
    
    const cleanup = setupRealtimeListeners();
    return cleanup;
  }, []);

  // 待機中のプランを承認（完全修正版）
  const approvePendingPlan = async (pendingPlan: PendingPlan) => {
    if (!pendingPlan.id) {
      console.warn('⚠️ プランIDがありません');
      return;
    }
    
    setProcessingPlanId(pendingPlan.id);
    console.log('✅ プラン承認処理開始（完全修正版）:', pendingPlan.subject);
    
    try {
      // 学習計画として保存
      const newPlan: Omit<StudyPlan, 'id'> = {
        subject: pendingPlan.subject,
        currentLevel: 'intermediate',
        totalUnits: pendingPlan.units.length,
        completedUnits: 0,
        studyPath: {
          currentFocus: pendingPlan.units[0]?.title || '基礎学習',
          nextStep: pendingPlan.units[1]?.title || '応用学習',
          longTermGoal: `${pendingPlan.subject}の総合的な理解`,
          recommendedSchedule: pendingPlan.schedule
        },
        units: pendingPlan.units,
        estimatedCompletionWeeks: Math.ceil(
          pendingPlan.units.reduce((sum, unit) => sum + unit.estimatedHours, 0) / 8
        ),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'temp-user-id',
        source: 'ai_chat',
        status: 'active'
      };
      
      const planId = await FirebasePlanStorage.savePlan(newPlan);
      await FirebasePlanStorage.markPendingPlanProcessed(pendingPlan.id);
      
      console.log('✅ プラン承認処理完了 - 新プランID:', planId);
      
      testAlert(
        '✅ プラン承認完了',
        `「${pendingPlan.subject}」の学習プランがFirebaseに保存されました！\n\nプランID: ${planId.substring(0, 8)}...\n\n学習を開始できます。`
      );
      
      // UIをリフレッシュ
      await loadFirebasePlans(false);
      
    } catch (error) {
      console.error('❌ プラン承認エラー:', error);
      testAlert('❌ エラー', 'プランの承認に失敗しました。もう一度お試しください。');
    } finally {
      setProcessingPlanId(null);
      setShowPendingConfirm(false);
    }
  };

  // 待機中のプランを拒否
  const rejectPendingPlan = async (pendingPlan: PendingPlan) => {
    if (!pendingPlan.id) return;
    
    try {
      await FirebasePlanStorage.markPendingPlanProcessed(pendingPlan.id);
      setShowPendingConfirm(false);
      testAlert('❌ プラン拒否', 'プランを拒否しました。');
    } catch (error) {
      console.error('❌ プラン拒否エラー:', error);
    }
  };

  // 学習単元開始（タイマーに遷移）
  const handleStartStudyUnit = (unit: StudyUnit, planSubject: string) => {
    console.log('🚀 Firebase版学習単元開始:', unit.title);
    
    testAlert(
      '📚 学習開始',
      `「${unit.title}」の学習を開始しますか？\n\n科目: ${planSubject}\n推定時間: ${unit.estimatedHours}時間\n難易度: ${unit.difficulty === 'easy' ? '基礎' : unit.difficulty === 'medium' ? '標準' : '応用'}\n\nFirebase版タイマーで集中学習を開始します。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'タイマー開始',
          onPress: () => {
            try {
              // @ts-ignore
              navigation.navigate('Timer', {
                studyUnit: {
                  title: unit.title,
                  description: unit.description,
                  estimatedHours: unit.estimatedHours,
                  difficulty: unit.difficulty,
                  objectives: unit.learningObjectives,
                  subject: planSubject
                },
                fromAIPlanning: true,
                source: 'firebase_plan'
              });
              console.log('✅ Firebase版タイマー画面遷移完了');
            } catch (error) {
              console.error('❌ タイマー画面遷移エラー:', error);
              testAlert('❌ エラー', 'タイマー画面への移動に失敗しました。');
            }
          }
        }
      ]
    );
  };

  // プラン削除
  const handleDeletePlan = (plan: StudyPlan) => {
    if (!plan.id) return;
    
    testAlert(
      '⚠️ プラン削除確認',
      `「${plan.subject}」のプランを削除しますか？\n\nこの操作は取り消せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          onPress: async () => {
            try {
              await FirebasePlanStorage.deletePlan(plan.id!);
              testAlert('✅ 削除完了', 'プランを削除しました。');
              await loadFirebasePlans(false);
            } catch (error) {
              testAlert('❌ エラー', 'プランの削除に失敗しました。');
            }
          }
        }
      ]
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

  // 難易度表示
  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      'easy': '#34C759',
      'medium': '#FF9500', 
      'hard': '#FF3B30'
    };
    return colors[difficulty as keyof typeof colors] || colors.easy;
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labels = {
      'easy': '基礎',
      'medium': '標準',
      'hard': '応用'
    };
    return labels[difficulty as keyof typeof labels] || labels.easy;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Firebaseからプランを読み込み中...</Text>
          <Text style={styles.debugText}>完全修正版v3</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>🤖 AI計画</Text>
          <Text style={styles.subtitle}>
            完全修正版v3 • {studyPlans.length}個のプラン
          </Text>
        </View>

        {/* Firebase接続状況 */}
        <View style={[styles.card, { backgroundColor: '#E8F5E8', borderLeftWidth: 4, borderLeftColor: '#34C759' }]}>
          <Text style={[styles.cardTitle, { color: '#34C759' }]}>🔥 Firebase接続状況</Text>
          <View style={styles.statusGrid}>
            <Text style={styles.statusText}>☁️ リアルタイム同期: 有効</Text>
            <Text style={styles.statusText}>📚 アクティブプラン: {studyPlans.length}個</Text>
            <Text style={styles.statusText}>📥 待機中プラン: {pendingPlans.length}個</Text>
            <Text style={styles.statusText}>🔄 最終更新: {new Date().toLocaleTimeString('ja-JP')}</Text>
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.refreshButton, { flex: 1, marginRight: 5 }]}
              onPress={handleManualRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.refreshButtonText}>🔄 手動更新</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.refreshButton, { flex: 1, marginLeft: 5, backgroundColor: '#FF9500' }]}
              onPress={handleDebugCheck}
            >
              <Text style={styles.refreshButtonText}>🔍 デバッグ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* デバッグ情報表示 */}
        <View style={[styles.card, { backgroundColor: '#FFF3CD', borderLeftWidth: 4, borderLeftColor: '#FF9500' }]}>
          <Text style={[styles.cardTitle, { color: '#FF9500' }]}>🔍 デバッグ情報（完全修正版）</Text>
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>State - アクティブプラン: {studyPlans.length}件</Text>
            <Text style={styles.debugText}>State - 待機プラン: {pendingPlans.length}件</Text>
            <Text style={styles.debugText}>UI - 確認ダイアログ: {showPendingConfirm ? '表示中' : '非表示'}</Text>
            <Text style={styles.debugText}>プラン詳細: {studyPlans.map(p => p.subject).join(', ') || '無し'}</Text>
            <Text style={styles.debugText}>待機プラン詳細: {pendingPlans.map(p => p.subject).join(', ') || '無し'}</Text>
          </View>
        </View>

        {/* 待機中プラン確認UI */}
        {showPendingConfirm && pendingPlans.length > 0 && (
          <View style={styles.pendingConfirmCard}>
            <View style={styles.pendingHeader}>
              <Text style={styles.pendingTitle}>📥 新しいAI学習プランを受信</Text>
              <Text style={styles.pendingSubtitle}>チャットAIから送信されたプランを確認してください</Text>
            </View>
            
            {pendingPlans.map((pendingPlan, index) => (
              <View key={pendingPlan.id || index} style={styles.pendingPlanInfo}>
                <View style={styles.pendingSubjectRow}>
                  <Text style={styles.pendingSubject}>📚 {pendingPlan.subject}</Text>
                  <View style={styles.pendingStats}>
                    <Text style={styles.pendingStatText}>
                      {pendingPlan.units.length}単元
                    </Text>
                    <Text style={styles.pendingStatText}>
                      {pendingPlan.units.reduce((sum, unit) => sum + unit.estimatedHours, 0)}時間
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.pendingUnitsTitle}>📋 学習単元:</Text>
                <View style={styles.pendingUnitsList}>
                  {pendingPlan.units.slice(0, 3).map((unit, unitIndex) => (
                    <View key={unit.id || unitIndex} style={styles.pendingUnit}>
                      <Text style={styles.pendingUnitNumber}>{unitIndex + 1}.</Text>
                      <View style={styles.pendingUnitContent}>
                        <Text style={styles.pendingUnitTitle}>{unit.title}</Text>
                        <Text style={styles.pendingUnitMeta}>
                          {unit.estimatedHours}時間 • {getDifficultyLabel(unit.difficulty)}
                        </Text>
                      </View>
                    </View>
                  ))}
                  {pendingPlan.units.length > 3 && (
                    <Text style={styles.moreUnitsText}>...他 {pendingPlan.units.length - 3} 単元</Text>
                  )}
                </View>

                <View style={styles.pendingButtons}>
                  <TouchableOpacity
                    style={styles.approvePendingButton}
                    onPress={() => approvePendingPlan(pendingPlan)}
                    disabled={processingPlanId === pendingPlan.id}
                  >
                    {processingPlanId === pendingPlan.id ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.approvePendingButtonText}>✅ プランを承認</Text>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.rejectPendingButton}
                    onPress={() => rejectPendingPlan(pendingPlan)}
                    disabled={processingPlanId === pendingPlan.id}
                  >
                    <Text style={styles.rejectPendingButtonText}>❌ 拒否</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* アクティブな学習プラン表示 */}
        {studyPlans.map((plan, index) => (
          <View key={plan.id || index} style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planSubject}>📚 {plan.subject}</Text>
              <View style={styles.planMeta}>
                <Text style={styles.planStatus}>☁️ Firebase同期</Text>
                <TouchableOpacity
                  style={styles.deletePlanButton}
                  onPress={() => handleDeletePlan(plan)}
                >
                  <Text style={styles.deletePlanButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.planProgress}>
              <Text style={styles.progressText}>
                進捗: {plan.completedUnits}/{plan.totalUnits} 単元完了 
                ({Math.round((plan.completedUnits / plan.totalUnits) * 100)}%)
              </Text>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${(plan.completedUnits / plan.totalUnits) * 100}%` }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.pathSection}>
              <Text style={styles.pathTitle}>🎯 学習パス</Text>
              <View style={styles.pathItem}>
                <Text style={styles.pathLabel}>現在の重点</Text>
                <Text style={styles.pathValue}>{plan.studyPath.currentFocus}</Text>
              </View>
              <View style={styles.pathItem}>
                <Text style={styles.pathLabel}>次のステップ</Text>
                <Text style={styles.pathValue}>{plan.studyPath.nextStep}</Text>
              </View>
            </View>

            <View style={styles.unitsSection}>
              <Text style={styles.unitsTitle}>📋 学習単元</Text>
              {plan.units.filter(unit => !unit.completed).slice(0, 3).map((unit, unitIndex) => (
                <View key={unit.id || unitIndex} style={styles.nextUnit}>
                  <View style={styles.unitHeader}>
                    <Text style={styles.unitName}>{unit.title}</Text>
                    <View style={styles.unitMeta}>
                      <Text style={styles.unitTime}>{unit.estimatedHours}h</Text>
                      <View style={[
                        styles.difficultyBadge,
                        { backgroundColor: getDifficultyColor(unit.difficulty) + '20' }
                      ]}>
                        <Text style={[
                          styles.difficultyText,
                          { color: getDifficultyColor(unit.difficulty) }
                        ]}>
                          {getDifficultyLabel(unit.difficulty)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <Text style={styles.unitDescription}>{unit.description}</Text>

                  <TouchableOpacity 
                    style={styles.startUnitButton}
                    onPress={() => handleStartStudyUnit(unit, plan.subject)}
                  >
                    <Text style={styles.startUnitButtonText}>🚀 Firebase版タイマーで開始</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.planFooter}>
              <Text style={styles.planCreatedAt}>
                作成日: {plan.createdAt.toLocaleDateString('ja-JP')}
              </Text>
              <Text style={styles.planId}>
                ID: {plan.id?.substring(0, 8) || 'unknown'}
              </Text>
            </View>
          </View>
        ))}

        {/* プランがない場合 */}
        {studyPlans.length === 0 && !showPendingConfirm && (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataIcon}>🤖</Text>
            <Text style={styles.noDataTitle}>Firebase AI学習プランを作成</Text>
            <Text style={styles.noDataMessage}>
              チャットAIで「数学を学習したいのですが、どんな計画を立てればいいですか？」と質問すると、
              AIが学習プランを生成してFirebaseに保存できます！{'\n\n'}
              完全修正版v3が稼働中です。
            </Text>
            
            <TouchableOpacity 
              style={styles.chatButton}
              onPress={() => {
                // @ts-ignore
                navigation.navigate('Chat');
              }}
            >
              <Text style={styles.chatButtonText}>💬 AIチャットで相談</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

// スタイル
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  
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
  debugText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  
  header: { paddingHorizontal: 20, paddingVertical: 30, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center' },
  
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
  
  statusGrid: { gap: 5, marginBottom: 15 },
  statusText: { fontSize: 14, color: '#34C759', fontWeight: '500' },
  
  debugInfo: { gap: 3 },
  
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  
  pendingConfirmCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#E3F2FD',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
    }),
  },
  pendingHeader: {
    backgroundColor: '#E3F2FD',
    padding: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  pendingTitle: { fontSize: 18, fontWeight: 'bold', color: '#1565C0', marginBottom: 4 },
  pendingSubtitle: { fontSize: 14, color: '#1976D2' },
  
  pendingPlanInfo: { padding: 20 },
  pendingSubjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  pendingSubject: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  pendingStats: { alignItems: 'flex-end' },
  pendingStatText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 2,
  },
  
  pendingUnitsTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  pendingUnitsList: { marginBottom: 15 },
  pendingUnit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  pendingUnitNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1565C0',
    marginRight: 12,
    minWidth: 20,
  },
  pendingUnitContent: { flex: 1 },
  pendingUnitTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 2 },
  pendingUnitMeta: { fontSize: 12, color: '#666' },
  moreUnitsText: { fontSize: 14, color: '#999', fontStyle: 'italic', textAlign: 'center', marginTop: 5 },
  
  pendingButtons: { flexDirection: 'row', gap: 12 },
  approvePendingButton: {
    flex: 1,
    backgroundColor: '#1565C0',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  approvePendingButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  rejectPendingButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  rejectPendingButtonText: { color: '#666', fontSize: 16, fontWeight: '600' },
  
  planCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 20,
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
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  planSubject: { fontSize: 24, fontWeight: 'bold', color: '#333', flex: 1 },
  planMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planStatus: {
    fontSize: 12,
    color: '#34C759',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deletePlanButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFE5E5',
  },
  deletePlanButtonText: { fontSize: 16 },
  
  planProgress: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  progressText: { fontSize: 14, color: '#666', marginBottom: 8 },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  
  pathSection: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  pathTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  pathItem: { marginBottom: 8 },
  pathLabel: { fontSize: 14, color: '#666', marginBottom: 2 },
  pathValue: { fontSize: 16, color: '#007AFF', fontWeight: '500' },
  
  unitsSection: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  unitsTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  nextUnit: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  unitName: { fontSize: 16, color: '#333', fontWeight: '600', flex: 1 },
  unitMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unitTime: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#FFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  difficultyText: { fontSize: 12, fontWeight: '600' },
  unitDescription: { fontSize: 14, color: '#666', marginBottom: 10 },
  
  startUnitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 15,
    alignItems: 'center',
  },
  startUnitButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  
  planFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  planCreatedAt: { fontSize: 12, color: '#999' },
  planId: { fontSize: 12, color: '#007AFF', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  
  noDataContainer: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  noDataIcon: { fontSize: 80, marginBottom: 20 },
  noDataTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10, textAlign: 'center' },
  noDataMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  chatButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  chatButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  
  bottomSpacing: { height: 20 },
});

export { FirebasePlanStorage };
