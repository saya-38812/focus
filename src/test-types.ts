// src/test-types.ts
import { StudySession, TimerState } from '@/types';
import { TimerType } from '@/types/timer';

// 型が正常に読み込まれるかテスト
const testSession: StudySession = {
  id: 'test',
  userId: 'user1',
  startTime: new Date().toISOString(),
  subject: '数学',
  targetDuration: 3000,
  actualDuration: 0,
  isCompleted: false,
  createdAt: new Date().toISOString(),
};

console.log('Types imported successfully!', testSession);
