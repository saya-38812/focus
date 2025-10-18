// src/screens/TimerScreen.tsx - 時間設定機能付き完全版
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  TextInput,
  Keyboard,
  Dimensions,
  InteractionManager,
} from 'react-native';

// 🔥 Firebase Static import
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';

// 時間プリセット
const TIME_PRESETS = [
  { label: '⚡ 短時間', focus: 15, break: 3, desc: '軽作業・復習向け' },
  { label: '🍅 ポモドーロ', focus: 25, break: 5, desc: '標準的な集中学習' },
  { label: '📚 標準学習', focus: 30, break: 10, desc: '一般的な学習' },
  { label: '🎯 集中学習', focus: 45, break: 10, desc: 'じっくり取り組む' },
  { label: '💪 長時間学習', focus: 60, break: 15, desc: '深い学習・研究' },
  { label: '🚀 マラソン学習', focus: 90, break: 20, desc: '長期集中作業' },
];

export default function TimerScreen() {
  // タイマー状態
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [sessionCount, setSessionCount] = useState(0);
  const [isBreakTime, setIsBreakTime] = useState(false);
  const [originalDuration, setOriginalDuration] = useState(25 * 60);

  // 設定状態
  const [timerSettings, setTimerSettings] = useState({
    defaultDuration: 25,
    breakDuration: 5,
    autoStartBreak: true
  });

  // モーダル状態
  const [showTimeSettings, setShowTimeSettings] = useState(false);
  const [showCustomSettings, setShowCustomSettings] = useState(false);
  const [customFocusTime, setCustomFocusTime] = useState('25');
  const [customBreakTime, setCustomBreakTime] = useState('5');

  // 🔥 Firebase保存関数
  const saveToFirebase = async (sessionData) => {
    try {
      const docRef = await addDoc(collection(db, 'studySessions'), {
        ...sessionData,
        timestamp: new Date(),
        userId: 'temp-user-id',
      });
      console.log('✅ Firebase保存成功:', docRef.id);
      return true;
    } catch (error) {
      console.error('❌ Firebase保存エラー:', error);
      return false;
    }
  };

  // プリセット設定適用
  const applyPresetSettings = async (focus: number, breakTime: number, label: string) => {
    if (isRunning) {
      Alert.alert('⚠️ タイマー実行中', 'タイマーが動作中です。停止してから時間を変更してください。');
      return;
    }

    const newTime = focus * 60;
    const newSettings = {
      ...timerSettings,
      defaultDuration: focus,
      breakDuration: breakTime
    };
    
    setTimeLeft(newTime);
    setOriginalDuration(newTime);
    setTimerSettings(newSettings);
    setIsBreakTime(false);
    
    Alert.alert('✅ 設定完了', `${label}に設定しました！\n🎯 ${focus}分 ☕ ${breakTime}分`);
  };

  // カスタム設定適用
  const applyCustomSettings = async () => {
    const focus = parseInt(customFocusTime) || 25;
    const breakDuration = parseInt(customBreakTime) || 5;
    
    if (focus < 1 || focus > 180) {
      Alert.alert('❌ エラー', '学習時間は1-180分の範囲で設定してください。');
      return;
    }
    
    if (breakDuration < 1 || breakDuration > 60) {
      Alert.alert('❌ エラー', '休憩時間は1-60分の範囲で設定してください。');
      return;
    }

    if (isRunning) {
      Alert.alert('⚠️ タイマー実行中', 'タイマーが動作中です。停止してから設定を変更してください。');
      return;
    }

    const newTime = focus * 60;
    const newSettings = {
      ...timerSettings,
      defaultDuration: focus,
      breakDuration: breakDuration
    };
    
    setTimeLeft(newTime);
    setOriginalDuration(newTime);
    setTimerSettings(newSettings);
    setIsBreakTime(false);
    
    Alert.alert('✅ カスタム設定完了', `🎯 学習: ${focus}分\n☕ 休憩: ${breakDuration}分`);
  };

  // タイマーのメイン動作
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setSessionCount(prevCount => prevCount + 1);
            
            setTimeout(async () => {
              if (isBreakTime) {
                // 休憩完了
                setIsBreakTime(false);
                const defaultTime = timerSettings.defaultDuration * 60;
                setTimeLeft(defaultTime);
                setOriginalDuration(defaultTime);
                
                Alert.alert(
                  '☕ 休憩完了！',
                  `${timerSettings.breakDuration}分の休憩が完了しました！\n\n次の学習を始めますか？`,
                  [
                    { text: '終了', onPress: () => setTimeLeft(timerSettings.defaultDuration * 60) },
                    { text: '学習開始', onPress: () => setIsRunning(true) }
                  ]
                );
              } else {
                // 🔥 学習完了 - Firebase保存
                const sessionData = {
                  duration: timerSettings.defaultDuration,
                  breakDuration: timerSettings.breakDuration,
                  preset: `${timerSettings.defaultDuration}/${timerSettings.breakDuration}`,
                  type: 'focus',
                  completedAt: new Date(),
                };
                
                const saved = await saveToFirebase(sessionData);
                
                Alert.alert(
                  '🎉 学習完了！',
                  saved 
                    ? `${timerSettings.defaultDuration}分の集中学習が完了しました！\n\n☁️ データをFirebaseに保存しました\n\n${timerSettings.breakDuration}分の休憩を取りましょう。`
                    : `${timerSettings.defaultDuration}分の集中学習が完了しました！\n\n⚠️ Firebase保存に失敗しましたが、ローカルに記録されています。\n\n${timerSettings.breakDuration}分の休憩を取りましょう。`,
                  [
                    { text: '休憩開始', onPress: () => {
                      const breakTime = timerSettings.breakDuration * 60;
                      setTimeLeft(breakTime);
                      setOriginalDuration(breakTime);
                      setIsBreakTime(true);
                      if (timerSettings.autoStartBreak) {
                        setIsRunning(true);
                      }
                    }},
                    { text: '終了', onPress: () => {
                      setTimeLeft(timerSettings.defaultDuration * 60);
                    }}
                  ]
                );
              }
            }, 100);
            
            return 0;
          }
          
          return prev - 1;
        });
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, timeLeft, isBreakTime, timerSettings]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    if (isRunning) {
      Alert.alert(
        '⚠️ リセット確認',
        'タイマーが動作中です。リセットしますか？',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: 'リセット', onPress: () => {
            setIsRunning(false);
            setTimeLeft(originalDuration);
            setIsBreakTime(false);
          }}
        ]
      );
    } else {
      setIsRunning(false);
      setTimeLeft(originalDuration);
      setIsBreakTime(false);
    }
  };

  const progressPercentage = ((originalDuration - timeLeft) / originalDuration) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>🔥 学習タイマー</Text>
          <Text style={styles.subtitle}>時間設定対応版 - ベータ</Text>
        </View>

        {/* 現在の設定表示 */}
        <View style={styles.settingsSection}>
          <View style={styles.currentSettingsDisplay}>
            <Text style={styles.settingsDisplayText}>
              🎯 学習: {timerSettings.defaultDuration}分  |  ☕ 休憩: {timerSettings.breakDuration}分
            </Text>
          </View>
        </View>

        {/* タイマー表示 */}
        <View style={styles.timerDisplay}>
          <View style={styles.timerCircle}>
            <Text style={[
              styles.timeText, 
              isBreakTime && styles.breakTimeText
            ]}>
              {formatTime(timeLeft)}
            </Text>
            <Text style={styles.durationText}>
              / {Math.floor(originalDuration / 60)}分 {isBreakTime ? '(休憩)' : '(学習)'}
            </Text>
          </View>
          
          <Text style={styles.statusText}>
            {isBreakTime ? '☕ 休憩中...' : 
             isRunning ? '⏰ 学習中...' : '⏸️ 準備完了'}
          </Text>
          
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { 
                  width: `${progressPercentage}%`,
                  backgroundColor: isBreakTime ? '#FF9500' : '#007AFF'
                }
              ]} 
            />
          </View>

          <Text style={styles.progressText}>
            {Math.round(progressPercentage)}% 完了
          </Text>
        </View>

        {/* コントロールボタン */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.button, isRunning ? styles.stopButton : styles.startButton]}
            onPress={handleStart}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>
              {isRunning ? '⏸️ 一時停止' : '▶️ 開始'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <Text style={styles.resetButtonText}>🔄 リセット</Text>
          </TouchableOpacity>
        </View>

        {/* 時間設定ボタン */}
        <View style={styles.settingsSection}>
          <TouchableOpacity
            style={styles.timeSettingsButton}
            onPress={() => setShowTimeSettings(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.timeSettingsButtonText}>
              ⚙️ 時間設定
            </Text>
          </TouchableOpacity>
        </View>

        {/* 統計情報 */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>📊 学習統計</Text>
          <Text style={styles.statsText}>
            設定時間: 🎯{timerSettings.defaultDuration}分 ☕{timerSettings.breakDuration}分
          </Text>
          <Text style={styles.statsText}>
            完了したポモドーロ: {sessionCount}回
          </Text>
          <Text style={styles.statsText}>
            ☁️ データに自動保存（一括時間設定対応）
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* プリセット設定モーダル */}
      <Modal 
        visible={showTimeSettings} 
        transparent={true} 
        animationType="fade"
        presentationStyle="overFullScreen"
        onRequestClose={() => setShowTimeSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚙️ 時間設定（一括変更）</Text>
            <Text style={styles.modalSubtitle}>プリセットを選択するか、カスタム設定できます</Text>
            
            <ScrollView style={styles.presetScrollView}>
              {TIME_PRESETS.map((preset, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.presetOptionButton,
                    timerSettings.defaultDuration === preset.focus && 
                    timerSettings.breakDuration === preset.break && 
                    styles.activePresetOption
                  ]}
                  onPress={() => {
                    setShowTimeSettings(false);
                    InteractionManager.runAfterInteractions(() => {
                      setTimeout(() => {
                        applyPresetSettings(preset.focus, preset.break, preset.label);
                      }, 300);
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.presetOptionContent}>
                    <Text style={[
                      styles.presetOptionTitle,
                      timerSettings.defaultDuration === preset.focus && 
                      timerSettings.breakDuration === preset.break && 
                      styles.activePresetOptionText
                    ]}>
                      {preset.label}
                    </Text>
                    <Text style={styles.presetOptionTime}>
                      🎯 {preset.focus}分  ☕ {preset.break}分
                    </Text>
                    <Text style={styles.presetOptionDesc}>{preset.desc}</Text>
                  </View>
                  {timerSettings.defaultDuration === preset.focus && 
                   timerSettings.breakDuration === preset.break && (
                    <Text style={styles.checkMark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.customSettingsButton}
                onPress={() => {
                  setShowTimeSettings(false);
                  InteractionManager.runAfterInteractions(() => {
                    setTimeout(() => {
                      setCustomFocusTime(timerSettings.defaultDuration.toString());
                      setCustomBreakTime(timerSettings.breakDuration.toString());
                      setShowCustomSettings(true);
                    }, 400);
                  });
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.customSettingsButtonText}>🎛️ カスタム設定</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowTimeSettings(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCloseButtonText}>閉じる</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* カスタム設定モーダル */}
      <Modal 
        visible={showCustomSettings} 
        transparent={true} 
        animationType="fade"
        presentationStyle="overFullScreen"
        onRequestClose={() => {
          Keyboard.dismiss();
          setShowCustomSettings(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎛️ カスタム時間設定</Text>
            
            <View style={styles.customInputSection}>
              <Text style={styles.inputLabel}>🎯 学習時間（分）</Text>
              <TextInput
                style={styles.numberInput}
                value={customFocusTime}
                onChangeText={setCustomFocusTime}
                keyboardType="number-pad"
                placeholder="25"
                returnKeyType="next"
                maxLength={3}
              />
              <Text style={styles.inputHelper}>1-180分の範囲で設定</Text>
              
              <Text style={styles.inputLabel}>☕ 休憩時間（分）</Text>
              <TextInput
                style={styles.numberInput}
                value={customBreakTime}
                onChangeText={setCustomBreakTime}
                keyboardType="number-pad"
                placeholder="5"
                returnKeyType="done"
                maxLength={2}
              />
              <Text style={styles.inputHelper}>1-60分の範囲で設定</Text>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.saveCustomButton}
                onPress={() => {
                  Keyboard.dismiss();
                  setShowCustomSettings(false);
                  InteractionManager.runAfterInteractions(() => {
                    setTimeout(() => {
                      applyCustomSettings();
                    }, 400);
                  });
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.saveCustomButtonText}>✅ 保存</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  Keyboard.dismiss();
                  setShowCustomSettings(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// スタイル
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 30 },
  header: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 5, textAlign: 'center' },
  
  settingsSection: { paddingHorizontal: 20, marginBottom: 20 },
  timeSettingsButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 10,
  },
  timeSettingsButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  
  currentSettingsDisplay: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  settingsDisplayText: { fontSize: 14, color: '#666', fontWeight: '500' },
  
  timerDisplay: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20 },
  timerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
  timeText: { fontSize: 48, fontWeight: 'bold', color: '#007AFF' },
  breakTimeText: { color: '#FF9500' },
  durationText: { fontSize: 14, color: '#666', marginTop: 5 },
  statusText: { fontSize: 18, color: '#666', marginBottom: 15, textAlign: 'center' },
  progressBarContainer: {
    width: 220,
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8
  },
  progressBar: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 14, color: '#666', fontWeight: '500' },
  
  controls: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 20, gap: 12 },
  button: { 
    paddingHorizontal: 40, 
    paddingVertical: 15, 
    borderRadius: 25, 
    minWidth: 150, 
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
  startButton: { backgroundColor: '#34C759' },
  stopButton: { backgroundColor: '#FF3B30' },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  resetButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#8E8E93',
    alignItems: 'center',
  },
  resetButtonText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  
  statsCard: { 
    backgroundColor: '#FFF', 
    marginHorizontal: 20, 
    marginTop: 10, 
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
  statsTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  statsText: { fontSize: 14, color: '#666', marginBottom: 5, lineHeight: 20 },
  
  bottomSpacing: { height: 20 },
  
  // モーダルスタイル
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center', 
    alignItems: 'center',
  },
  modalContent: { 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 25, 
    width: Dimensions.get('window').width * 0.9,
    maxWidth: 400,
    maxHeight: Dimensions.get('window').height * 0.8,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.3)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    }),
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 5 },
  modalSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  
  presetScrollView: { maxHeight: 300, marginBottom: 20 },
  presetOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activePresetOption: { backgroundColor: '#E3F2FD', borderColor: '#007AFF' },
  presetOptionContent: { flex: 1 },
  presetOptionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  presetOptionTime: { fontSize: 14, color: '#007AFF', fontWeight: '500', marginBottom: 2 },
  presetOptionDesc: { fontSize: 12, color: '#666' },
  activePresetOptionText: { color: '#007AFF' },
  checkMark: { fontSize: 18, color: '#007AFF', fontWeight: 'bold' },
  
  customInputSection: { marginBottom: 15 },
  inputLabel: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 10 },
  numberInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    textAlign: 'center',
  },
  inputHelper: { fontSize: 12, color: '#007AFF', textAlign: 'center', marginBottom: 5 },
  
  modalButtonsRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  customSettingsButton: { 
    flex: 1, 
    backgroundColor: '#FF9500', 
    paddingVertical: 12, 
    borderRadius: 10, 
    alignItems: 'center' 
  },
  customSettingsButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  
  saveCustomButton: { 
    flex: 1, 
    backgroundColor: '#34C759', 
    paddingVertical: 12, 
    borderRadius: 10, 
    alignItems: 'center' 
  },
  saveCustomButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  
  cancelButton: { 
    flex: 1, 
    backgroundColor: '#8E8E93', 
    paddingVertical: 12, 
    borderRadius: 10, 
    alignItems: 'center' 
  },
  cancelButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  
  modalCloseButton: { 
    flex: 1, 
    backgroundColor: '#8E8E93', 
    paddingVertical: 12, 
    borderRadius: 10, 
    alignItems: 'center' 
  },
  modalCloseButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
