// src/utils/setting.ts - 設定データ管理
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TimerSettings {
  focusTime: number;
  breakTime: number;
  longBreakTime: number;
  autoStartBreaks: boolean;
}

export interface NotificationSettings {
  studyStart: boolean;
  studyEnd: boolean;
  breakStart: boolean;
  dailyReminder: boolean;
}

export interface AppSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  darkMode: boolean;
}

export interface Settings {
  timer: TimerSettings;
  notifications: NotificationSettings;
  app: AppSettings;
}

const SETTINGS_KEY = 'app_settings';

const defaultSettings: Settings = {
  timer: {
    focusTime: 25,
    breakTime: 5,
    longBreakTime: 15,
    autoStartBreaks: false,
  },
  notifications: {
    studyStart: true,
    studyEnd: true,
    breakStart: true,
    dailyReminder: false,
  },
  app: {
    soundEnabled: true,
    vibrationEnabled: true,
    darkMode: false,
  },
};

export class SettingsStorage {
  // 設定を読み込み
  static async loadSettings(): Promise<Settings> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      if (data) {
        const settings = JSON.parse(data);
        // デフォルト値とマージして不足項目を補完
        return {
          timer: { ...defaultSettings.timer, ...settings.timer },
          notifications: { ...defaultSettings.notifications, ...settings.notifications },
          app: { ...defaultSettings.app, ...settings.app },
        };
      }
      return defaultSettings;
    } catch (error) {
      console.error('設定読み込みエラー:', error);
      return defaultSettings;
    }
  }

  // 設定を保存
  static async saveSettings(settings: Settings): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      console.log('設定保存完了:', settings);
    } catch (error) {
      console.error('設定保存エラー:', error);
      throw new Error('設定の保存に失敗しました');
    }
  }

  // タイマー設定のみ更新
  static async updateTimerSettings(timerSettings: Partial<TimerSettings>): Promise<void> {
    try {
      const currentSettings = await this.loadSettings();
      const newSettings: Settings = {
        ...currentSettings,
        timer: { ...currentSettings.timer, ...timerSettings },
      };
      await this.saveSettings(newSettings);
    } catch (error) {
      console.error('タイマー設定更新エラー:', error);
      throw error;
    }
  }

  // 通知設定のみ更新
  static async updateNotificationSettings(notificationSettings: Partial<NotificationSettings>): Promise<void> {
    try {
      const currentSettings = await this.loadSettings();
      const newSettings: Settings = {
        ...currentSettings,
        notifications: { ...currentSettings.notifications, ...notificationSettings },
      };
      await this.saveSettings(newSettings);
    } catch (error) {
      console.error('通知設定更新エラー:', error);
      throw error;
    }
  }

  // アプリ設定のみ更新
  static async updateAppSettings(appSettings: Partial<AppSettings>): Promise<void> {
    try {
      const currentSettings = await this.loadSettings();
      const newSettings: Settings = {
        ...currentSettings,
        app: { ...currentSettings.app, ...appSettings },
      };
      await this.saveSettings(newSettings);
    } catch (error) {
      console.error('アプリ設定更新エラー:', error);
      throw error;
    }
  }

  // 設定リセット
  static async resetSettings(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SETTINGS_KEY);
      console.log('設定リセット完了');
    } catch (error) {
      console.error('設定リセットエラー:', error);
      throw error;
    }
  }
}
