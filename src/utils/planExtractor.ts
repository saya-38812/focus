// src/utils/planExtractor.ts - 復活版
export interface ExtractedPlan {
    id: string;
    subject: string;
    units: ExtractedUnit[];
    schedule: string[];
    source: 'ai_chat';
    timestamp: string;
  }
  
  export interface ExtractedUnit {
    id: string;
    title: string;
    description: string;
    estimatedHours: number;
    difficulty: 'easy' | 'medium' | 'hard';
    learningObjectives: string[];
  }
  
  // src/utils/planExtractor.ts - デバッグ強化版
export class PlanExtractor {
    // extractPlan メソッドをデバッグ強化
    static extractPlan(text: string, subject?: string): ExtractedPlan | null {
      console.log('🔍 === extractPlan 詳細デバッグ開始 ===');
      console.log('🔍 入力テキスト長さ:', text.length);
      console.log('🔍 入力テキスト（最初の200文字）:', text.substring(0, 200));
      
      try {
        console.log('🔍 Step1: detectLearningPlan 実行');
        const isLearningPlan = this.detectLearningPlan(text);
        console.log('🔍 detectLearningPlan 結果:', isLearningPlan);
        
        if (!isLearningPlan) {
          console.log('❌ 学習プランではないと判定されました');
          return null;
        }
  
        console.log('🔍 Step2: extractSubject 実行');
        const extractedSubject = subject || this.extractSubject(text);
        console.log('🔍 抽出された科目:', extractedSubject);
        
        console.log('🔍 Step3: extractUnits 実行');
        const units = this.extractUnits(text);
        console.log('🔍 抽出された単元数:', units.length);
        
        console.log('🔍 Step4: extractSchedule 実行');
        const schedule = this.extractSchedule(text);
        console.log('🔍 抽出されたスケジュール数:', schedule.length);
  
        if (units.length === 0) {
          console.log('❌ 単元が0個のため null を返します');
          return null;
        }
  
        console.log('🔍 Step5: プランオブジェクト作成');
        const plan: ExtractedPlan = {
          id: `chat_plan_${Date.now()}`,
          subject: extractedSubject,
          units,
          schedule,
          source: 'ai_chat',
          timestamp: new Date().toISOString()
        };
  
        console.log('✅ プラン作成完了:', {
          id: plan.id,
          subject: plan.subject,
          unitsCount: plan.units.length
        });
        
        return plan;
        
      } catch (error) {
        console.error('❌ extractPlan内でエラー:', error);
        return null;
      }
    }
  
  
    // 科目を抽出
    private static extractSubject(text: string): string {
      const subjects = ['数学', '英語', '国語', '理科', '社会'];
      
      for (const subject of subjects) {
        if (text.includes(subject)) {
          return subject;
        }
      }
      
      return '一般';
    }
  
    // 単元を抽出（簡素版）
    private static extractUnits(text: string): ExtractedUnit[] {
      const units: ExtractedUnit[] = [];
      const lines = text.split('\n');
      
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        
        if (this.isUnitLine(trimmed)) {
          const title = this.cleanUnitTitle(trimmed);
          if (title && title.length > 2 && !this.isExcludedLine(title)) {
            const unit: ExtractedUnit = {
              id: `unit_${Date.now()}_${index}`,
              title: title,
              description: `${title}について学習します。`,
              estimatedHours: this.extractHours(line),
              difficulty: this.extractDifficulty(line),
              learningObjectives: [`${title}の基本理解`, `実践的な${title}のスキル習得`]
            };
            units.push(unit);
          }
        }
      });
  
      console.log('✅ 抽出された単元:', units.length, '個');
      return units.slice(0, 6); // 最大6単元まで
    }
  
    // 単元行かどうか判定
    private static isUnitLine(line: string): boolean {
      if (line.length < 3) return false;
      
      const patterns = [
        /^[•・\-\*]\s*\*\*(.+)\*\*/,
        /^[•・\-\*]\s*(.+)/,
        /^\*\*(.+)\*\*/,
      ];
  
      return patterns.some(pattern => pattern.test(line));
    }
  
    // 除外すべき行
    private static isExcludedLine(title: string): boolean {
      const excludePatterns = [
        'スケジュール', '推奨', '段階的', '復習', '本格AI', 'デモ', '機能'
      ];
      
      return excludePatterns.some(pattern => title.includes(pattern));
    }
  
    // タイトルをクリーンアップ
    private static cleanUnitTitle(line: string): string {
      return line
        .replace(/^[•・\-\*\s]+/, '')
        .replace(/^\*\*(.+)\*\*/, '$1')
        .replace(/\([^)]*時間?\)/g, '')
        .replace(/\([^)]*h\)/g, '')
        .replace(/ - .*$/, '') // " - 説明文"の部分を除去
        .trim();
    }
  
    // 時間を抽出
    private static extractHours(text: string): number {
      const hourMatch = text.match(/(\d+)\s*時間?/);
      if (hourMatch) return parseInt(hourMatch[1]);
      
      const hMatch = text.match(/(\d+)\s*h/);
      if (hMatch) return parseInt(hMatch[1]);
      
      return 2; // デフォルト
    }
  
    // 難易度を抽出
    private static extractDifficulty(text: string): 'easy' | 'medium' | 'hard' {
      const lowerText = text.toLowerCase();
      
      if (lowerText.includes('基礎') || lowerText.includes('基本')) {
        return 'easy';
      }
      if (lowerText.includes('応用') || lowerText.includes('上級')) {
        return 'hard';
      }
      
      return 'medium';
    }
  
    // スケジュール抽出
    private static extractSchedule(text: string): string[] {
      return [
        '週3回、1回2時間の学習を推奨',
        '基礎から応用へ段階的に進める',
        '定期的な復習を組み込む'
      ];
    }
  }
  