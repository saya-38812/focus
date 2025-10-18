// src/types/navigation.ts
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { StackScreenProps } from '@react-navigation/stack';

// メインタブナビゲーションの型
export type MainTabParamList = {
  Timer: undefined;
  Analytics: undefined;
  AIPlanning: undefined;
  Settings: undefined;
};

// スタックナビゲーションの型
export type RootStackParamList = {
  Main: undefined;
  SessionComplete: {
    sessionId: string;
    duration: number;
    subject: string;
  };
};

// 画面コンポーネントのProps型
export type TimerScreenProps = BottomTabScreenProps<MainTabParamList, 'Timer'>;
export type AnalyticsScreenProps = BottomTabScreenProps<MainTabParamList, 'Analytics'>;
export type AIPlanningScreenProps = BottomTabScreenProps<MainTabParamList, 'AIPlanning'>;
export type SettingsScreenProps = BottomTabScreenProps<MainTabParamList, 'Settings'>;

// ナビゲーション用のグローバル型宣言
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
