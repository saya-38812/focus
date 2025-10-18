// App.tsx - 設定画面追加版（完全版5画面）
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

// 🔥 Firebase版画面インポート（全5画面完成）
import TimerScreen from './src/screens/TimerScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import AIPlanningScreen from './src/screens/AIPlanningScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen'; // 追加

// Redux store（最小構成）
const store = configureStore({
  reducer: {
    session: (state = { sessions: [] }, action: any) => state,
  },
});

type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

const Tab = createBottomTabNavigator();

function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#F8F9FA',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          paddingTop: 5,
          paddingBottom: 5,
          height: 65, // 5画面のため少し高さを調整
        },
        tabBarLabelStyle: {
          fontSize: 11, // 5画面のためフォントサイズを小さく
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}
    >
      <Tab.Screen 
        name="Timer" 
        component={TimerScreen} 
        options={{ 
          title: 'タイマー', 
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "timer" : "timer-outline"} 
              size={size} 
              color={color} 
            />
          ),
          tabBarLabel: '🔥 タイマー',
        }} 
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen} 
        options={{ 
          title: '分析', 
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "stats-chart" : "stats-chart-outline"} 
              size={size} 
              color={color} 
            />
          ),
          tabBarLabel: '📊 分析',
        }} 
      />
      <Tab.Screen 
        name="AIPlanning" 
        component={AIPlanningScreen} 
        options={{ 
          title: 'AI計画', 
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "bulb" : "bulb-outline"} 
              size={size} 
              color={color} 
            />
          ),
          tabBarLabel: '🤖 計画',
        }} 
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={{ 
          title: 'AIチャット', 
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "chatbubble" : "chatbubble-outline"} 
              size={size} 
              color={color} 
            />
          ),
          tabBarLabel: '💬 チャット',
        }} 
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ 
          title: '設定', 
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "settings" : "settings-outline"} 
              size={size} 
              color={color} 
            />
          ),
          tabBarLabel: '⚙️ 設定',
        }} 
      />
    </Tab.Navigator>
  );
}

export default function App() {
  console.log('🔥 Firebase版ベータ起動（完全版）');
  console.log('📱 利用可能機能（全5画面）:');
  console.log('   🔥 Firebase学習タイマー（時間設定対応）');
  console.log('   📊 Firebase学習分析（リアルタイム統計）');
  console.log('   🤖 Firebase AI計画（チャット連携）');
  console.log('   💬 Firebase AIチャット（プラン自動転送）');
  console.log('   ⚙️ Firebase設定（クラウド同期設定）'); // 追加
  console.log('   ☁️ 全データクラウド同期完全対応');
  
  return (
    <Provider store={store}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </Provider>
  );
}
