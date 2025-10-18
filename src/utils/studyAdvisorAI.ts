// src/utils/studyAdvisorAI.ts - 更新版
import { ExtractedPlan } from './planExtractor';

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  message: string;
  timestamp: string;
  isTyping?: boolean;
  extractedPlan?: ExtractedPlan; // 復活
}

export class StudyAdvisorAI {
  private static apiKey: string = '';

  static setApiKey(key: string) {
    this.apiKey = key;
  }

  static hasApiKey(): boolean {
    return this.apiKey.length > 0;
  }

  static async validateApiKey(key: string): Promise<boolean> {
    // 復旧版では検証を簡素化
    return key.startsWith('sk-') && key.length > 20;
  }

  static async sendMessage(
    message: string, 
    sessions: any[], 
    chatHistory: ChatMessage[]
  ): Promise<string> {
    // 復旧版では基本的な応答を返す
    return '復旧版: APIキー設定後により詳細な回答を提供します。基本的な学習アドバイスは利用できます。';
  }
}
