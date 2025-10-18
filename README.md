# StudyFocusApp - Firebase版学習集中管理アプリ

## 📱 アプリ概要

StudyFocusAppは、学習の集中力を高め、セッションを記録・分析できるReact Native (Expo) アプリです。Firebaseとの完全統合により、クラウド同期、リアルタイムデータ管理、AI駆動の学習プラン生成を実現しています。

## ✨ 主要機能

### 🔥 Firebase版タイマー
- **時間設定機能**: 6つのプリセット（15分〜90分）+ カスタム設定
- **ポモドーロテクニック**: 学習時間と休憩時間の自動切り替え
- **リアルタイム保存**: 学習セッションをFirebaseに自動保存
- **進捗表示**: 視覚的なプログレスバーと完了率表示

### 📊 Firebase版分析
- **リアルタイム統計**: 学習データの即座な可視化
- **期間別分析**: 今日・週間・全期間の学習実績
- **科目別統計**: 科目ごとの学習時間と効率分析
- **プリセット使用率**: 時間設定の使用パターン分析
- **連続記録**: 学習継続日数の追跡

### 🤖 Firebase版AI計画
- **AI学習プラン生成**: チャットAIから自動プラン作成
- **リアルタイム同期**: プランの即座な反映と更新
- **学習単元管理**: 段階的な学習カリキュラム
- **進捗追跡**: 完了率と次のステップの表示
- **Firebase統合**: クラウドでの永続化と同期

### 💬 Firebase版チャット
- **AI学習相談**: 学習に関する質問とアドバイス
- **プラン自動転送**: AI生成プランの自動保存
- **リアルタイムメッセージ**: Firebaseでの即座な同期
- **学習プラン検出**: メッセージから学習プランの自動抽出

### ⚙️ Firebase版設定
- **クラウド設定同期**: 設定の自動バックアップと復元
- **Firebase統計**: データ使用量と同期状況の表示
- **データ管理**: 全データのエクスポート・削除機能
- **通知設定**: 学習開始・終了・休憩の通知管理

## 🛠️ 技術スタック

### フロントエンド
- **React Native**: 0.81.4
- **Expo**: ^54.0.10 (新アーキテクチャ対応)
- **TypeScript**: ^5.9.2
- **React Navigation**: ^7.1.17 (タブナビゲーション)

### バックエンド・データベース
- **Firebase Firestore**: リアルタイムデータベース
- **Firebase Authentication**: ユーザー認証（準備中）
- **Firebase Storage**: ファイル保存（将来実装予定）

### 状態管理
- **Redux Toolkit**: ^2.9.0
- **React Redux**: ^9.2.0

### UI・UX
- **React Native Vector Icons**: ^10.3.0
- **React Native Chart Kit**: ^6.12.0
- **React Native SVG**: ^15.13.0
- **React Native Reanimated**: ~4.1.1

### 開発ツール
- **ESLint**: ^9.36.0
- **Prettier**: ^3.6.2
- **TypeScript ESLint**: ^8.44.1

## 📁 プロジェクト構造

```
focus/StudyFocusApp/
├── App.tsx                          # メインアプリケーション
├── firebase.js                      # Firebase設定
├── app.json                         # Expo設定
├── package.json                     # 依存関係
├── tsconfig.json                    # TypeScript設定
├── src/
│   ├── screens/                     # 画面コンポーネント
│   │   ├── TimerScreenFirebase.tsx      # Firebase版タイマー
│   │   ├── AnalyticsScreenFirebase.tsx  # Firebase版分析
│   │   ├── AIPlanningScreenFirebase.tsx # Firebase版AI計画
│   │   ├── ChatScreenFirebase.tsx       # Firebase版チャット
│   │   └── SettingsScreenFirebase.tsx   # Firebase版設定
│   ├── store/                       # Redux状態管理
│   │   ├── index.ts                     # ストア設定
│   │   └── slices/                      # 状態スライス
│   ├── types/                       # TypeScript型定義
│   │   ├── index.ts                     # メイン型定義
│   │   ├── timer.ts                     # タイマー型
│   │   ├── user.ts                      # ユーザー型
│   │   └── navigation.ts                # ナビゲーション型
│   ├── utils/                       # ユーティリティ
│   │   ├── aiAnalyzer.ts                # AI学習分析エンジン
│   │   ├── curriculumAI.ts              # カリキュラムAI
│   │   ├── planExtractor.ts             # プラン抽出
│   │   └── studyAdvisorAI.ts            # 学習アドバイザーAI
│   └── components/                  # 共通コンポーネント
│       ├── charts/                      # チャートコンポーネント
│       ├── common/                      # 共通UI
│       └── timer/                       # タイマーコンポーネント
└── assets/                          # アプリリソース
    ├── icon.png                         # アプリアイコン
    ├── splash-icon.png                  # スプラッシュアイコン
    └── adaptive-icon.png                # Android適応アイコン
```

## 🚀 セットアップ

### 前提条件
- Node.js 18以上
- npm または yarn
- Expo CLI
- Firebase プロジェクト

### インストール手順

1. **リポジトリのクローン**
   ```bash
   git clone <repository-url>
   cd focus/StudyFocusApp
   ```

2. **依存関係のインストール**
   ```bash
   npm install
   # または
   yarn install
   ```

3. **Firebase設定**
   - Firebase Consoleでプロジェクトを作成
   - Firestore Databaseを有効化
   - `firebase.js`の設定を更新

4. **Expo CLIのインストール**（未インストールの場合）
   ```bash
   npm install -g @expo/cli
   ```

## 🏃‍♂️ 起動方法

### 開発サーバー起動
```bash
npm run start
# または
yarn start
```

### プラットフォーム別実行
```bash
# Android
npm run android

# iOS（macOSのみ）
npm run ios

# Web
npm run web
```

### その他のコマンド
```bash
# リント
npm run lint

# 自動修正
npm run lint:fix

# フォーマット
npm run format

# 型チェック
npm run type-check
```

## 🔧 Firebase設定

### Firestoreコレクション構造

```javascript
// 学習セッション
studySessions: {
  id: string,
  userId: string,
  duration: number,        // 分
  breakDuration: number,   // 分
  preset: string,          // "25/5"
  type: string,            // "focus"
  completedAt: Timestamp,
  timestamp: Timestamp
}

// 学習プラン
studyPlans: {
  id: string,
  userId: string,
  subject: string,
  currentLevel: string,
  totalUnits: number,
  completedUnits: number,
  studyPath: object,
  units: array,
  estimatedCompletionWeeks: number,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  source: string,          // "ai_chat"
  status: string           // "active"
}

// 待機中プラン
pendingPlans: {
  id: string,
  userId: string,
  subject: string,
  units: array,
  schedule: array,
  source: string,          // "ai_chat"
  processed: boolean,
  createdAt: Timestamp
}

// チャットメッセージ
chatMessages: {
  id: string,
  userId: string,
  type: string,            // "user" | "ai"
  message: string,
  planDetected: boolean,
  containsPlan: boolean,
  createdAt: Timestamp
}

// ユーザー設定
userSettings: {
  userId: string,
  timerSettings: object,
  notifications: object,
  firebase: object,
  ui: object,
  privacy: object,
  updatedAt: Timestamp
}
```

## 🎯 主要機能の詳細

### タイマー機能
- **プリセット設定**: 6種類の時間設定（15分〜90分）
- **カスタム設定**: 1-180分の範囲で自由設定
- **自動休憩**: 学習完了後の自動休憩開始
- **進捗表示**: リアルタイムの進捗バー
- **Firebase保存**: セッション完了時の自動保存

### 分析機能
- **リアルタイム統計**: 30秒ごとの自動更新
- **多角的分析**: 時間・科目・効率の3軸分析
- **視覚化**: チャートとグラフによる直感的表示
- **トレンド分析**: 学習パターンの変化追跡

### AI計画機能
- **自動プラン生成**: チャットAIからの学習プラン作成
- **リアルタイム同期**: プランの即座な反映
- **進捗管理**: 単元ごとの完了状況追跡
- **学習パス**: 段階的な学習カリキュラム

### チャット機能
- **AI学習相談**: 学習に関する質問とアドバイス
- **プラン検出**: メッセージからの学習プラン自動抽出
- **リアルタイム同期**: メッセージの即座な保存・同期
- **プラン転送**: AI生成プランの自動保存

## 🔒 セキュリティ・プライバシー

- **Firebase Security Rules**: 適切なアクセス制御
- **データ暗号化**: 転送時・保存時の暗号化
- **プライバシー設定**: 分析データの収集制御
- **ユーザー認証**: 将来的な認証機能実装予定

## 🚧 今後の実装予定

### 短期（1-2ヶ月）
- [ ] ユーザー認証機能
- [ ] プッシュ通知
- [ ] データエクスポート機能
- [ ] ダークモード対応

### 中期（3-6ヶ月）
- [ ] 学習グループ機能
- [ ] 競争・ランキング機能
- [ ] 詳細な学習分析
- [ ] カスタムテーマ

### 長期（6ヶ月以上）
- [ ] 機械学習による個別最適化
- [ ] 音声認識機能
- [ ] AR/VR学習支援
- [ ] 多言語対応

## 🐛 トラブルシューティング

### よくある問題

1. **Firebase接続エラー**
   - ネットワーク接続を確認
   - Firebase設定を再確認
   - アプリを再起動

2. **データが表示されない**
   - Firebaseのセキュリティルールを確認
   - ブラウザのキャッシュをクリア
   - 手動更新ボタンを押下

3. **タイマーが動作しない**
   - アプリの権限設定を確認
   - バックグラウンド実行を許可
   - デバイスの省電力設定を確認

### ログ確認
```bash
# 開発者ツールでコンソールログを確認
# Firebase版のログは 🔥 マークで識別可能
```

