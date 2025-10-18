// src/utils/planStorage.ts - Web & React Native 両対応版
import { ExtractedPlan } from './planExtractor';
import { Platform } from 'react-native';

const STORAGE_KEY = 'StudyApp_PendingPlan';
const APPLIED_PLANS_KEY = 'StudyApp_AppliedPlans';

class PlanStorage {
  private static pendingPlan: ExtractedPlan | null = null;
  private static listeners: (() => void)[] = [];

  // ユニバーサル localStorage/AsyncStorage 対応
  private static async setStorage(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      
      if (Platform.OS === 'web') {
        // Web環境: localStorage使用
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, jsonValue);
          console.log('✅ Web localStorage保存完了:', key);
        }
      } else {
        // React Native環境: AsyncStorage使用
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem(key, jsonValue);
        console.log('✅ Native AsyncStorage保存完了:', key);
      }
    } catch (error) {
      console.warn('⚠️ ストレージ保存エラー:', error);
    }
  }

  private static async getStorage(key: string): Promise<any> {
    try {
      let stored: string | null = null;
      
      if (Platform.OS === 'web') {
        // Web環境: localStorage使用
        if (typeof window !== 'undefined' && window.localStorage) {
          stored = window.localStorage.getItem(key);
        }
      } else {
        // React Native環境: AsyncStorage使用
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        stored = await AsyncStorage.getItem(key);
      }
      
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('📤 ストレージ取得成功:', key, Platform.OS);
        return parsed;
      }
    } catch (error) {
      console.warn('⚠️ ストレージ取得エラー:', error);
    }
    return null;
  }

  private static async removeStorage(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web環境: localStorage使用
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
          console.log('🗑️ Web localStorage削除完了:', key);
        }
      } else {
        // React Native環境: AsyncStorage使用
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.removeItem(key);
        console.log('🗑️ Native AsyncStorage削除完了:', key);
      }
    } catch (error) {
      console.warn('⚠️ ストレージ削除エラー:', error);
    }
  }

  // 非同期対応版のsavePlan
  static async savePlan(plan: ExtractedPlan) {
    console.log('💾 === PlanStorage.savePlan ユニバーサル版 ===');
    console.log('💾 環境:', Platform.OS);
    console.log('💾 保存するプラン:', plan.subject);
    
    // メモリに保存
    this.pendingPlan = plan;
    
    // 永続化（非同期）
    await this.setStorage(STORAGE_KEY, {
      ...plan,
      savedAt: Date.now()
    });
    
    // リスナー通知
    this.listeners.forEach((listener, index) => {
      try {
        listener();
        console.log('✅ リスナー', index, '実行完了');
      } catch (error) {
        console.error('❌ リスナー', index, 'エラー:', error);
      }
    });
  }

  static async takePlan(): Promise<ExtractedPlan | null> {
    console.log('📤 === PlanStorage.takePlan ユニバーサル版 ===');
    console.log('📤 環境:', Platform.OS);
    
    let plan = this.pendingPlan;
    
    // メモリにない場合は永続化ストレージから取得
    if (!plan) {
      plan = await this.getStorage(STORAGE_KEY);
      if (plan) {
        console.log('📤 ストレージ復元:', plan.subject);
      }
    }
    
    // 取得後は削除
    if (plan) {
      this.pendingPlan = null;
      await this.removeStorage(STORAGE_KEY);
    }
    
    return plan;
  }

  static async hasPlan(): Promise<boolean> {
    // メモリをチェック
    if (this.pendingPlan) {
      return true;
    }
    
    // 永続化ストレージをチェック
    const storedPlan = await this.getStorage(STORAGE_KEY);
    return !!storedPlan;
  }

  // 適用済みプラン管理（非同期版）
  static async saveAppliedPlans(plans: any[]) {
    console.log('💾 適用されたプランを保存:', plans.length, '個', Platform.OS);
    await this.setStorage(APPLIED_PLANS_KEY, {
      plans: plans,
      savedAt: Date.now()
    });
  }

  static async getAppliedPlans(): Promise<any[]> {
    console.log('📤 適用されたプランを取得中...', Platform.OS);
    const stored = await this.getStorage(APPLIED_PLANS_KEY);
    if (stored && stored.plans) {
      console.log('📤 復元されたプラン:', stored.plans.length, '個');
      return stored.plans;
    }
    return [];
  }

  static async clearAppliedPlans() {
    console.log('🗑️ 適用されたプランを削除中...', Platform.OS);
    await this.removeStorage(APPLIED_PLANS_KEY);
  }

  // 既存のリスナー機能（同期のまま）
  static addListener(listener: () => void) {
    this.listeners.push(listener);
  }

  static removeListener(listener: () => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }
}

export default PlanStorage;
