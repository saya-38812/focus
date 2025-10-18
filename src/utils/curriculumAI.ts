// src/utils/curriculumAI.ts - 科目・単元別カリキュラムAI
import { StudySession } from '../store/slices/sessionSlice';

export interface CurriculumPlan {
  subject: string;
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  completedUnits: Unit[];
  nextRecommendedUnits: Unit[];
  studyPath: StudyPath;
}

export interface Unit {
  id: string;
  title: string;
  subject: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prerequisites: string[];
  estimatedHours: number;
  learningObjectives: string[];
  isCompleted: boolean;
  progress: number; // 0-100%
}

export interface StudyPath {
  currentFocus: string;
  nextStep: string;
  longTermGoal: string;
  recommendedSchedule: string[];
}

export class CurriculumAI {
  // メイン関数：科目選択から学習プラン生成
  static generateCurriculumPlan(sessions: StudySession[], selectedSubjects: string[]): CurriculumPlan[] {
    return selectedSubjects.map(subject => {
      const subjectSessions = sessions.filter(s => s.subject === subject);
      const level = this.assessCurrentLevel(subject, subjectSessions);
      const curriculum = this.getSubjectCurriculum(subject);
      const progress = this.calculateProgress(subjectSessions, curriculum);
      
      return {
        subject,
        currentLevel: level,
        completedUnits: progress.completed,
        nextRecommendedUnits: progress.next,
        studyPath: this.generateStudyPath(subject, level, progress)
      };
    });
  }

  // レベル判定
  private static assessCurrentLevel(subject: string, sessions: StudySession[]): 'beginner' | 'intermediate' | 'advanced' {
    if (sessions.length === 0) return 'beginner';
    
    const totalHours = sessions.reduce((sum, s) => sum + s.actualDuration, 0) / 3600;
    const avgFocus = sessions.reduce((sum, s) => sum + s.focusScore, 0) / sessions.length;
    
    if (totalHours >= 20 && avgFocus >= 80) return 'advanced';
    if (totalHours >= 10 && avgFocus >= 70) return 'intermediate';
    return 'beginner';
  }

  // 科目別カリキュラム定義
  private static getSubjectCurriculum(subject: string): Unit[] {
    const curriculums: { [key: string]: Unit[] } = {
      '数学': [
        {
          id: 'math_basic_calc',
          title: '基礎計算',
          subject: '数学',
          description: '四則演算、分数、小数の計算技能',
          difficulty: 'easy',
          prerequisites: [],
          estimatedHours: 8,
          learningObjectives: ['正確な計算ができる', '暗算力を向上させる'],
          isCompleted: false,
          progress: 0
        },
        {
          id: 'math_integers',
          title: '正負の数',
          subject: '数学',
          description: '負の数の概念と四則演算',
          difficulty: 'easy',
          prerequisites: ['math_basic_calc'],
          estimatedHours: 6,
          learningObjectives: ['正負の数を理解する', '正負の数の計算ができる'],
          isCompleted: false,
          progress: 0
        },
        {
          id: 'math_letters',
          title: '文字と式',
          subject: '数学',
          description: '文字を用いた式の表現と計算',
          difficulty: 'medium',
          prerequisites: ['math_integers'],
          estimatedHours: 10,
          learningObjectives: ['文字式を理解する', '式の計算ができる'],
          isCompleted: false,
          progress: 0
        },
        {
          id: 'math_equations',
          title: '1次方程式',
          subject: '数学',
          description: '1次方程式の解法と応用',
          difficulty: 'medium',
          prerequisites: ['math_letters'],
          estimatedHours: 12,
          learningObjectives: ['1次方程式を解ける', '文章題を方程式で表現できる'],
          isCompleted: false,
          progress: 0
        },
        {
          id: 'math_simultaneous',
          title: '連立方程式',
          subject: '数学',
          description: '連立1次方程式の解法',
          difficulty: 'medium',
          prerequisites: ['math_equations'],
          estimatedHours: 10,
          learningObjectives: ['連立方程式を解ける', '応用問題に取り組める'],
          isCompleted: false,
          progress: 0
        },
        {
          id: 'math_functions',
          title: '1次関数',
          subject: '数学',
          description: '1次関数のグラフと性質',
          difficulty: 'hard',
          prerequisites: ['math_simultaneous'],
          estimatedHours: 15,
          learningObjectives: ['関数の概念を理解する', 'グラフを正確に描ける'],
          isCompleted: false,
          progress: 0
        },
        {
          id: 'math_quadratic',
          title: '2次関数',
          subject: '数学',
          description: '2次関数のグラフと応用',
          difficulty: 'hard',
          prerequisites: ['math_functions'],
          estimatedHours: 18,
          learningObjectives: ['2次関数を理解する', '最大・最小問題を解ける'],
          isCompleted: false,
          progress: 0
        }
      ],
      
      '英語': [
        {
          id: 'eng_basic_words',
          title: '基本単語1000語',
          subject: '英語',
          description: '中学レベルの基本単語の習得',
          difficulty: 'easy',
          prerequisites: [],
          estimatedHours: 20,
          learningObjectives: ['基本単語1000語を覚える', '正しい発音ができる'],
          isCompleted: false,
          progress: 0
        },
        {
          id: 'eng_basic_grammar',
          title: '基本文法',
          subject: '英語',
          description: '5文型と基本的な文法事項',
          difficulty: 'easy',
          prerequisites: ['eng_basic_words'],
          estimatedHours: 15,
          learningObjectives: ['5文型を理解する', '基本的な文を作れる'],
          isCompleted: false,
          progress: 0
        },
        {
          id: 'eng_tenses',
          title: '時制',
          subject: '英語',
          description: '現在・過去・未来時制の理解',
          difficulty: 'medium',
          prerequisites: ['eng_basic_grammar'],
          estimatedHours: 12,
          learningObjectives: ['時制を正しく使い分けられる', '進行形・完了形を理解する'],
          isCompleted: false,
          progress: 0
        },
        {
          id: 'eng_reading',
          title: '長文読解',
          subject: '英語',
          description: '段落構成の理解と読解技術',
          difficulty: 'medium',
          prerequisites: ['eng_tenses'],
          estimatedHours: 25,
          learningObjectives: ['長文を正確に読める', '要点を把握できる'],
          isCompleted: false,
          progress: 0
        },
        {
          id: 'eng_writing',
          title: 'ライティング',
          subject: '英語',
          description: '英文ライティングの基礎技能',
          difficulty: 'hard',
          prerequisites: ['eng_reading'],
          estimatedHours: 20,
          learningObjectives: ['構成のある英文を書ける', '語彙を適切に使える'],
          isCompleted: false,
          progress: 0
        }
      ],

      '国語': [
        {
          id: 'jp_kanji_basic',
          title: '基本漢字',
          subject: '国語',
          description: '小中学校で学ぶ基本漢字の読み書き',
          difficulty: 'easy',
          prerequisites: [],
          estimatedHours: 15,
          learningObjectives: ['基本漢字を正確に読み書きできる', '漢字の意味を理解する'],
          isCompleted: false,
          progress: 0
        },
        {
          id: 'jp_grammar',
          title: '現代文法',
          subject: '国語',
          description: '品詞と文の構造の理解',
          difficulty: 'medium',
          prerequisites: ['jp_kanji_basic'],
          estimatedHours: 10,
          learningObjectives: ['品詞を正しく識別できる', '文の構造を理解する'],
          isCompleted: false,
          progress: 0
        },
        {
          id: 'jp_reading',
          title: '現代文読解',
          subject: '国語',
          description: '論説文・小説の読解技術',
          difficulty: 'medium',
          prerequisites: ['jp_grammar'],
          estimatedHours: 20,
          learningObjectives: ['文章の要点を把握できる', '筆者の主張を理解できる'],
          isCompleted: false,
          progress: 0
        },
        {
          id: 'jp_classical',
          title: '古典基礎',
          subject: '国語',
          description: '古文・漢文の基礎的な読解',
          difficulty: 'hard',
          prerequisites: ['jp_reading'],
          estimatedHours: 25,
          learningObjectives: ['古典文法を理解する', '基本的な古文を読める'],
          isCompleted: false,
          progress: 0
        }
      ]
    };

    return curriculums[subject] || [
      {
        id: 'general_basic',
        title: '基礎学習',
        subject: subject,
        description: `${subject}の基礎的な内容`,
        difficulty: 'easy',
        prerequisites: [],
        estimatedHours: 10,
        learningObjectives: ['基本的な知識を習得する'],
        isCompleted: false,
        progress: 0
      }
    ];
  }

  // 進捗計算と次の推奨単元決定
  private static calculateProgress(sessions: StudySession[], curriculum: Unit[]) {
    // セッション時間から進捗を推定
    const totalStudyTime = sessions.reduce((sum, s) => sum + s.actualDuration, 0) / 3600; // 時間単位
    const avgFocus = sessions.length > 0 ? sessions.reduce((sum, s) => sum + s.focusScore, 0) / sessions.length : 0;

    let accumulatedTime = 0;
    const completed: Unit[] = [];
    const next: Unit[] = [];

    for (const unit of curriculum) {
      const adjustedTime = unit.estimatedHours * (avgFocus >= 70 ? 1.0 : 1.2); // 集中度による調整
      
      if (accumulatedTime < totalStudyTime) {
        // 完了済みとして扱う
        unit.isCompleted = true;
        unit.progress = 100;
        completed.push({ ...unit });
        accumulatedTime += adjustedTime;
      } else if (next.length < 3) {
        // 次の推奨単元
        unit.progress = Math.min(Math.round((totalStudyTime - accumulatedTime) / adjustedTime * 100), 0);
        next.push({ ...unit });
      }
    }

    // 最低1つは次の単元を推奨
    if (next.length === 0 && curriculum.length > completed.length) {
      next.push({ ...curriculum[completed.length] });
    }

    return { completed, next };
  }

  // 学習パス生成
  private static generateStudyPath(subject: string, level: string, progress: any): StudyPath {
    const nextUnit = progress.next[0];
    
    const pathTemplates: { [key: string]: { [level: string]: StudyPath } } = {
      '数学': {
        'beginner': {
          currentFocus: '基礎計算力の定着',
          nextStep: nextUnit ? nextUnit.title : '正負の数の理解',
          longTermGoal: '方程式を使って問題解決ができるようになる',
          recommendedSchedule: ['週3回、1回30分の計算練習', '間違えた問題は必ず復習', '暗算力向上のための反復練習']
        },
        'intermediate': {
          currentFocus: '方程式・関数の理解',
          nextStep: nextUnit ? nextUnit.title : '関数の概念理解',
          longTermGoal: 'グラフを使って問題を視覚的に解決できる',
          recommendedSchedule: ['週4回、1回45分の問題演習', '理解できない部分は基礎に戻る', 'グラフ作成の練習を重視']
        },
        'advanced': {
          currentFocus: '応用問題への挑戦',
          nextStep: nextUnit ? nextUnit.title : '高次関数・微積分の準備',
          longTermGoal: '数学的思考力を使って新しい問題に対応できる',
          recommendedSchedule: ['週5回、1回60分の発展問題', '複数の解法を比較検討', '論理的説明力の向上']
        }
      },
      '英語': {
        'beginner': {
          currentFocus: '語彙力の基盤構築',
          nextStep: nextUnit ? nextUnit.title : '基本文法の習得',
          longTermGoal: '日常的な英文を読み書きできるようになる',
          recommendedSchedule: ['毎日20分の単語学習', '音読による発音練習', '短い文章の暗記']
        },
        'intermediate': {
          currentFocus: '文法知識の実践活用',
          nextStep: nextUnit ? nextUnit.title : '長文読解力の向上',
          longTermGoal: '英字新聞や小説を読めるレベルに到達',
          recommendedSchedule: ['週4回、1回40分の読解練習', '文法問題の反復演習', '英語日記の習慣化']
        },
        'advanced': {
          currentFocus: '表現力と理解力の向上',
          nextStep: nextUnit ? nextUnit.title : 'ライティング・スピーキング',
          longTermGoal: '英語で自分の考えを論理的に表現できる',
          recommendedSchedule: ['週5回、1回60分の総合演習', '英語での議論・発表練習', '様々なジャンルの英文読解']
        }
      }
    };

    const template = pathTemplates[subject]?.[level];
    if (template) {
      return template;
    }

    // デフォルトパス
    return {
      currentFocus: `${subject}の基礎固め`,
      nextStep: nextUnit ? nextUnit.title : '基本内容の習得',
      longTermGoal: `${subject}の基本的な内容をマスターする`,
      recommendedSchedule: ['週3回、1回30分の学習', '理解度に応じたペース調整', '定期的な復習の実施']
    };
  }

  // 推奨学習アクション生成
  static generateLearningActions(plan: CurriculumPlan): string[] {
    const actions: string[] = [];
    const nextUnit = plan.nextRecommendedUnits[0];

    if (nextUnit) {
      actions.push(`次は「${nextUnit.title}」に取り組みましょう`);
      actions.push(`推定学習時間: ${nextUnit.estimatedHours}時間`);
      
      if (nextUnit.prerequisites.length > 0) {
        actions.push('前提知識を確認してから進めてください');
      }
      
      switch (nextUnit.difficulty) {
        case 'easy':
          actions.push('基礎的な内容なので、確実に理解を深めましょう');
          break;
        case 'medium':
          actions.push('標準的な難易度です。演習問題で定着を図りましょう');
          break;
        case 'hard':
          actions.push('応用的な内容です。基礎が不安な場合は復習から始めましょう');
          break;
      }
    }

    return actions;
  }
}
