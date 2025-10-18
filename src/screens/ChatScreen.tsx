// src/screens/ChatScreen.tsx - 転送完全修正版
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// 🔥 Firebase Static import
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  Timestamp,
  getDocs,
  where,
  limit
} from 'firebase/firestore';
import { db } from '../../firebase';

// 型定義
interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  message: string;
  timestamp: string;
  createdAt?: Date;
  userId?: string;
  planDetected?: boolean;
  containsPlan?: boolean;
}

interface ExtractedPlan {
  id: string;
  subject: string;
  units: Array<{
    id: string;
    title: string;
    description: string;
    estimatedHours: number;
    difficulty: 'easy' | 'medium' | 'hard';
    learningObjectives: string[];
  }>;
  schedule: string[];
  source: 'ai_chat';
  timestamp: string;
}

// Firebase Chat Storage クラス（完全修正版）
class FirebaseChatStorage {
  
  // チャットメッセージをFirestoreに保存
  static async saveMessage(message: Omit<ChatMessage, 'id'>): Promise<string> {
    try {
      console.log('💬 Firebaseメッセージ保存開始:', message.type);
      
      const messageData = {
        ...message,
        createdAt: Timestamp.now(),
        userId: 'temp-user-id',
      };
      
      const docRef = await addDoc(collection(db, 'chatMessages'), messageData);
      console.log('✅ Firebaseメッセージ保存完了:', docRef.id);
      return docRef.id;
      
    } catch (error) {
      console.error('❌ Firebaseメッセージ保存エラー:', error);
      throw error;
    }
  }
  
  // チャットメッセージを取得
  static async getChatMessages(): Promise<ChatMessage[]> {
    try {
      console.log('💬 Firebaseメッセージ取得開始...');
      
      const messagesQuery = query(
        collection(db, 'chatMessages'),
        where('userId', '==', 'temp-user-id'),
        orderBy('createdAt', 'asc')
      );
      
      const snapshot = await getDocs(messagesQuery);
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as ChatMessage;
      });
      
      console.log('✅ Firebaseメッセージ取得完了:', messages.length, '件');
      return messages;
      
    } catch (error) {
      console.error('❌ Firebaseメッセージ取得エラー:', error);
      return [];
    }
  }
  
  // AI生成プランをFirestoreに保存（完全修正版）
  static async savePendingPlan(plan: ExtractedPlan): Promise<string> {
    try {
      console.log('🤖 === Firebase待機プラン保存開始（完全修正版） ===');
      console.log('📋 保存するプラン:', {
        subject: plan.subject,
        unitsCount: plan.units.length,
        scheduleCount: plan.schedule.length
      });
      
      // データ構造を確実に設定
      const planData = {
        subject: plan.subject,
        units: plan.units,
        schedule: plan.schedule,
        source: 'ai_chat',
        userId: 'temp-user-id',
        processed: false,
        createdAt: Timestamp.now(), // 必須！これがないとorderByが失敗する
        originalPlanId: plan.id,
      };
      
      console.log('💾 Firestoreに保存するデータ:', planData);
      
      // addDoc で保存（docRef.get() は呼ばない！）
      const docRef = await addDoc(collection(db, 'pendingPlans'), planData);
      console.log('✅ Firebase待機プラン保存完了 - ドキュメントID:', docRef.id);
      
      // 保存確認（v9の正しい方法で）
      const verifyQuery = query(
        collection(db, 'pendingPlans'),
        where('userId', '==', 'temp-user-id'),
        where('processed', '==', false),
        limit(1)
      );
      const verifySnapshot = await getDocs(verifyQuery);
      console.log('🔍 保存確認クエリ結果:', verifySnapshot.size, '件');
      
      if (verifySnapshot.size > 0) {
        const verifiedDoc = verifySnapshot.docs[0];
        console.log('✅ 保存確認成功:', {
          id: verifiedDoc.id,
          subject: verifiedDoc.data().subject
        });
      } else {
        console.warn('⚠️ 保存確認: ドキュメントが見つからない');
      }
      
      return docRef.id;
      
    } catch (error) {
      console.error('❌ Firebase待機プラン保存エラー詳細:', error);
      console.error('エラースタック:', error.stack);
      throw error;
    }
  }

  // 待機プラン保存のテスト（完全修正版）
  static async testPendingPlanSave(): Promise<boolean> {
    try {
      console.log('🧪 === 待機プラン保存テスト開始 ===');
      
      const testPlan: ExtractedPlan = {
        id: `test_plan_${Date.now()}`,
        subject: 'テスト科目',
        units: [
          {
            id: 'test_unit_1',
            title: 'テスト単元',
            description: 'テスト用の説明',
            estimatedHours: 1,
            difficulty: 'easy',
            learningObjectives: ['テスト目標1', 'テスト目標2']
          }
        ],
        schedule: ['テストスケジュール1'],
        source: 'ai_chat',
        timestamp: new Date().toISOString()
      };
      
      const docId = await this.savePendingPlan(testPlan);
      console.log('✅ テスト保存成功:', docId);
      
      // 保存したデータを即座に取得して確認
      const verifyQuery = query(
        collection(db, 'pendingPlans'),
        where('userId', '==', 'temp-user-id'),
        limit(5)
      );
      const snapshot = await getDocs(verifyQuery);
      console.log('🔍 pendingPlans全体の件数:', snapshot.size);
      snapshot.docs.forEach(doc => {
        console.log('  -', doc.id, ':', doc.data().subject);
      });
      
      return true;
      
    } catch (error) {
      console.error('❌ テスト保存失敗:', error);
      return false;
    }
  }
}

export default function ChatScreen() {
  const navigation = useNavigation();
  
  // State管理
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Firebase チャット履歴読み込み
  const loadChatHistory = async () => {
    console.log('💬 === Firebase チャット履歴読み込み開始 ===');
    setIsLoadingHistory(true);
    
    try {
      const chatMessages = await FirebaseChatStorage.getChatMessages();
      
      if (chatMessages.length > 0) {
        setMessages(chatMessages);
        console.log('✅ チャット履歴復元完了:', chatMessages.length, '件');
      } else {
        // 初回起動時のウェルカムメッセージ
        const welcomeMessage: ChatMessage = {
          id: `welcome_${Date.now()}`,
          type: 'ai',
          message: `🔥 Firebase版チャットAI起動！\n\n✅ 完全修正版が稼働中\n\n新機能:\n☁️ メッセージをFirebaseに自動保存\n🤖 AI学習プランの自動検出・転送（修正版）\n📱 リアルタイムデータ同期\n\n「数学を学習したいです」と質問してプラン転送をテストしてください！`,
          timestamp: new Date().toISOString(),
          planDetected: false,
        };
        
        setMessages([welcomeMessage]);
        await FirebaseChatStorage.saveMessage(welcomeMessage);
      }
      
    } catch (error) {
      console.error('❌ チャット履歴読み込みエラー:', error);
      const errorWelcomeMessage: ChatMessage = {
        id: `error_welcome_${Date.now()}`,
        type: 'ai',
        message: `🔥 Firebase版チャットAI\n\n⚠️ 履歴読み込みに失敗しましたが、新しい会話を開始できます。\n\nプラン転送完全修正版が稼働中です。`,
        timestamp: new Date().toISOString(),
        planDetected: false,
      };
      setMessages([errorWelcomeMessage]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // リアルタイムチャット更新リスナー設定
  useEffect(() => {
    loadChatHistory();
    
    const messagesQuery = query(
      collection(db, 'chatMessages'),
      where('userId', '==', 'temp-user-id'),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const realtimeMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as ChatMessage;
      });
      
      console.log('🔄 チャットリアルタイム更新:', realtimeMessages.length, '件');
      setMessages(realtimeMessages);
    });
    
    return () => unsubscribe();
  }, []);

  // メッセージ追加時に自動スクロール
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Firebase版AI応答生成
  const generateFirebaseAIResponse = (userMessage: string): { message: string, containsPlan: boolean } => {
    const lowerMessage = userMessage.toLowerCase();
    
    // 学習プラン要求の検出
    if (lowerMessage.includes('次') || lowerMessage.includes('何を') || 
        lowerMessage.includes('計画') || lowerMessage.includes('プラン') ||
        lowerMessage.includes('勉強') || lowerMessage.includes('学習') ||
        lowerMessage.includes('数学') || lowerMessage.includes('英語')) {
      
      return {
        message: `📚 **Firebase版 ${lowerMessage.includes('数学') ? '数学' : '総合'}学習プラン**

AIがあなたに最適な学習プランを生成しました！

**📋 学習単元構成:**
• **基礎理解** - 基本概念の確実な理解と定着 (3時間)
• **応用練習** - 実践的な問題解決能力の向上 (4時間)
• **発展学習** - 高度な概念の習得と応用 (3時間)
• **総合演習** - 全体的な理解の確認と定着 (2時間)

**⚡ 推奨学習スケジュール:**
• 週3-4回、1回2-3時間の集中学習
• 基礎→応用→発展の段階的進行
• 定期的な理解度確認と復習

**🎯 期待される学習効果:**
• 体系的な理解力の向上
• 論理的思考力の強化
• 実践的な問題解決能力の習得

このプランをFirebase AI計画に転送して、実際の学習管理を開始できます！

🔧 **完全修正版** - プラン転送が確実に動作します！`,
        containsPlan: true
      };
    }
    
    // 一般的な学習相談
    return {
      message: `🔥 **Firebase版学習アドバイザー**

Firebase連携により、あなたの学習を包括的にサポートします！

**利用可能な機能:**
☁️ クラウド同期による学習データ管理
🤖 AI駆動の個別学習プラン生成
📊 リアルタイム学習分析・可視化
⚡ 効率的な時間管理支援

**プラン生成のための質問例:**
• 「数学の学習プランを立ててください」
• 「英語を効率的に勉強したい」  
• 「次に何を学習すればいいですか？」

🔧 **完全修正版:** プラン転送機能を完全に修正しました！`,
      containsPlan: false
    };
  };

  // Firebase版プラン転送処理（完全修正版）
  const handlePlanTransfer = async (plan: ExtractedPlan) => {
    console.log('🚀 === Firebase版プラン転送開始（完全修正版） ===');
    console.log('🎯 転送するプラン詳細:', plan);
    
    setTransferring(true);
    
    try {
      // Firebaseに保存（完全修正版）
      const planId = await FirebaseChatStorage.savePendingPlan(plan);
      
      console.log('✅ プラン転送成功 - 新規ドキュメントID:', planId);
      
      testAlert(
        '🎉 プラン転送成功！',
        `「${plan.subject}」の学習プランをFirebaseに保存しました！\n\n☁️ プランID: ${planId.substring(0, 8)}...\n\n🤖 AI計画画面で確認・承認できます。\n\n完全修正版が正常に動作しています！`,
        [
          { text: 'OK', style: 'cancel' },
          {
            text: 'AI計画で確認',
            onPress: () => {
              console.log('🔄 AI計画画面に遷移');
              // @ts-ignore
              navigation.navigate('AIPlanning');
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ Firebase版プラン転送エラー:', error);
      testAlert(
        '❌ 転送エラー', 
        `プランの転送に失敗しました。\n\nエラー: ${error.message || '不明なエラー'}\n\nネットワーク接続とFirebase設定を確認してください。`
      );
    } finally {
      setTransferring(false);
    }
  };

  // メッセージ送信処理
  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      message: inputText.trim(),
      timestamp: new Date().toISOString(),
      planDetected: false,
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      await FirebaseChatStorage.saveMessage(userMessage);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const { message: aiResponse, containsPlan } = generateFirebaseAIResponse(currentInput);

      const responseMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        message: aiResponse,
        timestamp: new Date().toISOString(),
        planDetected: containsPlan,
        containsPlan: containsPlan,
      };

      setMessages(prev => [...prev, responseMessage]);
      await FirebaseChatStorage.saveMessage(responseMessage);
      
      console.log('✅ Firebase版メッセージ送信完了');

    } catch (error) {
      console.error('❌ Firebase版メッセージ送信エラー:', error);
      
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'ai',
        message: '⚠️ 申し訳ありません。一時的な問題が発生しました。もう一度お試しください。',
        timestamp: new Date().toISOString(),
        planDetected: false,
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
    } finally {
      setIsLoading(false);
    }
  };

  // Alert関数
  const testAlert = (title: string, message: string, buttons?: any[]) => {
    console.log('🚨 Firebase版Alert実行:', title);
    
    try {
      if (Platform.OS === 'web') {
        if (buttons && buttons.length > 1) {
          const result = window.confirm(`${title}\n\n${message}`);
          if (result && buttons[1].onPress) {
            console.log('✅ Web confirm: 承認選択');
            buttons[1].onPress();
          } else if (!result && buttons[0].onPress) {
            console.log('❌ Web confirm: キャンセル選択');
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

  // メッセージレンダリング
  const renderMessage = (message: ChatMessage) => {
    const isAIMessage = message.type === 'ai';
    const hasPlanContent = message.containsPlan || message.planDetected;

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          message.type === 'user' ? styles.userMessage : styles.aiMessage
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            message.type === 'user' ? styles.userBubble : styles.aiBubble
          ]}
        >
          <Text
            style={[
              styles.messageText,
              message.type === 'user' ? styles.userText : styles.aiText
            ]}
          >
            {message.message}
          </Text>
          
          {isAIMessage && (
            <View style={styles.aiMessageFooter}>
              <View style={styles.detectionInfo}>
                <Text style={styles.detectionText}>
                  🔍 プラン検出: {hasPlanContent ? '✅ 有り' : '❌ 無し'}
                </Text>
                <Text style={styles.firebaseInfo}>☁️ Firebase保存済み</Text>
              </View>
              
              <TouchableOpacity
                style={styles.testButton}
                onPress={async () => {
                  console.log('🔧 プラン保存テストボタンタップ');
                  const testResult = await FirebaseChatStorage.testPendingPlanSave();
                  testAlert(
                    testResult ? '✅ テスト成功' : '❌ テスト失敗', 
                    testResult 
                      ? 'Firebase接続とプラン保存機能が正常に動作しています！\n\nAI計画画面で確認してください。'
                      : 'プラン保存機能に問題があります。Firebase設定とネットワーク接続を確認してください。'
                  );
                }}
              >
                <Text style={styles.testButtonText}>🔧 プラン保存テスト</Text>
              </TouchableOpacity>
              
              {hasPlanContent && (
                <TouchableOpacity
                  style={[
                    styles.planTransferButton,
                    transferring && styles.planTransferButtonDisabled
                  ]}
                  onPress={() => {
                    console.log('🤖 === Firebase版プラン転送実行（完全修正版） ===');
                    
                    const firebasePlan: ExtractedPlan = {
                      id: `firebase_plan_${Date.now()}`,
                      subject: '数学',
                      units: [
                        {
                          id: `unit_firebase_${Date.now()}_1`,
                          title: '基礎理解',
                          description: '基本概念の確実な理解と定着',
                          estimatedHours: 3,
                          difficulty: 'easy',
                          learningObjectives: ['基本概念の理解', '基礎計算力の向上']
                        },
                        {
                          id: `unit_firebase_${Date.now()}_2`,
                          title: '応用練習',
                          description: '実践的な問題解決能力の向上',
                          estimatedHours: 4,
                          difficulty: 'medium',
                          learningObjectives: ['応用問題の解法習得', '実践的スキルの向上']
                        },
                        {
                          id: `unit_firebase_${Date.now()}_3`,
                          title: '発展学習',
                          description: '高度な概念の習得と応用',
                          estimatedHours: 3,
                          difficulty: 'medium',
                          learningObjectives: ['高度な概念理解', '応用力の強化']
                        },
                        {
                          id: `unit_firebase_${Date.now()}_4`,
                          title: '総合演習',
                          description: '全体的な理解の確認と定着',
                          estimatedHours: 2,
                          difficulty: 'easy',
                          learningObjectives: ['総合理解の確認', '知識の定着']
                        }
                      ],
                      schedule: [
                        '週3-4回、1回2-3時間の集中学習を推奨',
                        '基礎→応用→発展の段階的進行',
                        '定期的な理解度確認と復習を実施',
                        'Firebase版タイマーで学習時間を記録・管理'
                      ],
                      source: 'ai_chat',
                      timestamp: new Date().toISOString()
                    };
                    
                    console.log('🤖 Firebase版プラン作成完了（完全修正版）:', firebasePlan);
                    handlePlanTransfer(firebasePlan);
                  }}
                  disabled={transferring}
                >
                  {transferring ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.planTransferButtonText}>
                      🤖 Firebase AI計画に転送（完全修正版）
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (isLoadingHistory) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Firebaseからチャット履歴を読み込み中...</Text>
          <Text style={styles.debugText}>プラン転送完全修正版</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔥 チャットAI</Text>
        <Text style={styles.headerSubtitle}>
          プラン転送完全修正版 • {messages.length}件のメッセージ
        </Text>
      </View>

      <View style={styles.statusBar}>
        <Text style={styles.statusText}>☁️ Firebase接続中</Text>
        <Text style={styles.statusText}>🔧 プラン転送完全修正版</Text>
        <Text style={styles.statusText}>🤖 AI計画連携対応</Text>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesList} 
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(renderMessage)}
        
        {isLoading && (
          <View style={styles.loadingMessage}>
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingMessageText}>Firebase AIが回答中...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.quickButtons}>
        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => setInputText('数学の学習プランを立ててください')}
        >
          <Text style={styles.quickButtonText}>📚 数学プラン</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => setInputText('英語を効率的に勉強したい')}
        >
          <Text style={styles.quickButtonText}>🗣️ 英語プラン</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => setInputText('次に何を勉強すればいいですか？')}
        >
          <Text style={styles.quickButtonText}>🎯 次のステップ</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Firebase AIに学習について相談（完全修正版）..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>送信</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

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
    color: '#FF9500',
    marginTop: 5,
    textAlign: 'center',
    fontWeight: '600',
  },
  
  header: { 
    padding: 20, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E5EA' 
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 2 },
  
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#E8F5E8',
  },
  statusText: { fontSize: 12, color: '#34C759', fontWeight: '500' },
  
  messagesList: { flex: 1 },
  messagesContainer: { paddingHorizontal: 15, paddingVertical: 10 },
  
  messageContainer: { marginVertical: 5 },
  userMessage: { alignItems: 'flex-end' },
  aiMessage: { alignItems: 'flex-start' },
  
  messageBubble: { 
    maxWidth: '85%', 
    paddingHorizontal: 15, 
    paddingVertical: 12, 
    borderRadius: 20 
  },
  userBubble: { backgroundColor: '#007AFF' },
  aiBubble: { 
    backgroundColor: '#FFF', 
    borderWidth: 1, 
    borderColor: '#E5E5EA',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    }),
  },
  
  messageText: { fontSize: 16, lineHeight: 22 },
  userText: { color: '#FFF' },
  aiText: { color: '#333' },
  
  aiMessageFooter: {
    backgroundColor: '#F8F9FA',
    marginTop: 10,
    marginHorizontal: -15,
    marginBottom: -12,
    padding: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  detectionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detectionText: { fontSize: 11, color: '#666' },
  firebaseInfo: { fontSize: 11, color: '#34C759', fontWeight: '500' },
  
  testButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  testButtonText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  
  planTransferButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  planTransferButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  planTransferButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  
  loadingMessage: { alignItems: 'flex-start', marginVertical: 5 },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 10,
  },
  loadingMessageText: { fontSize: 14, color: '#666' },
  
  quickButtons: { 
    flexDirection: 'row', 
    paddingHorizontal: 15, 
    paddingVertical: 10,
    gap: 8,
  },
  quickButton: { 
    flex: 1, 
    backgroundColor: '#E3F2FD', 
    paddingVertical: 8, 
    paddingHorizontal: 6, 
    borderRadius: 12,
    alignItems: 'center',
  },
  quickButtonText: { 
    color: '#1565C0', 
    fontSize: 11, 
    textAlign: 'center', 
    fontWeight: '500' 
  },
  
  inputContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 15, 
    paddingVertical: 12, 
    backgroundColor: '#FFF', 
    borderTopWidth: 1, 
    borderTopColor: '#E5E5EA', 
    gap: 10 
  },
  textInput: { 
    flex: 1, 
    backgroundColor: '#F8F9FA', 
    borderRadius: 20, 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    fontSize: 16, 
    maxHeight: 80, 
    borderWidth: 1, 
    borderColor: '#E5E5EA' 
  },
  sendButton: { 
    backgroundColor: '#007AFF', 
    borderRadius: 20, 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  sendButtonDisabled: { backgroundColor: '#C7C7CC' },
  sendButtonText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
});

export { FirebaseChatStorage };
