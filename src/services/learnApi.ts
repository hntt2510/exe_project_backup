/**
 * Learn API – kết nối với BE /api/learn
 * Các endpoint public đã có trong api.ts (getLearnCategories, getLearnModules, getModuleById, getLessonById, getQuizById, getLearnUserStats)
 * File này chứa các API cần auth (user actions)
 */
import { api } from './api';
import type { ApiResponse } from '../types';

export interface QuizResultResponse {
  attemptId: number;
  correctCount: number;
  totalQuestions: number;
  scorePercent: number;
  timeTakenSeconds: number;
  questionResults?: Array<{
    questionId: number;
    questionText: string;
    userAnswerText?: string | null;
    correctAnswerText?: string | null;
    explanationText?: string | null;
    isCorrect?: boolean;
  }>;
  suggestedTours?: Array<{
    id: number;
    title: string;
    slug: string;
    thumbnailUrl: string;
    location: string;
    description: string;
    price: number;
  }>;
  canClaimVoucher?: boolean;
}

/** Đánh dấu hoàn thành bài học - POST /api/learn/lessons/{id}/complete */
export async function completeLesson(lessonId: number): Promise<void> {
  await api.post<ApiResponse<null>>(`/api/learn/lessons/${lessonId}/complete`);
}

/** Toggle like bài - POST/DELETE /api/learn/lessons/{id}/like (toggle qua POST) */
export async function toggleLessonLike(lessonId: number): Promise<boolean> {
  const res = await api.post<ApiResponse<boolean>>(`/api/learn/lessons/${lessonId}/like`);
  return res.data.data ?? false;
}

/** Toggle lưu bài - POST /api/learn/lessons/{id}/save */
export async function toggleLessonSave(lessonId: number): Promise<boolean> {
  const res = await api.post<ApiResponse<boolean>>(`/api/learn/lessons/${lessonId}/save`);
  return res.data.data ?? false;
}

/** Toggle theo dõi nghệ nhân - POST /api/learn/artisans/{id}/follow */
export async function toggleFollowArtisan(artisanId: number): Promise<boolean> {
  const res = await api.post<ApiResponse<boolean>>(`/api/learn/artisans/${artisanId}/follow`);
  return res.data.data ?? false;
}

/** Nộp quiz - POST /api/learn/quizzes/{id}/submit */
export async function submitQuiz(
  quizId: number,
  answers: Record<number, number>,
  timeTakenSeconds: number
): Promise<QuizResultResponse> {
  const answersObj: Record<string, number> = {};
  for (const [qId, optId] of Object.entries(answers)) {
    answersObj[String(qId)] = optId;
  }
  const res = await api.post<ApiResponse<QuizResultResponse>>(
    `/api/learn/quizzes/${quizId}/submit`,
    { answers: answersObj, timeTakenSeconds }
  );
  return res.data.data;
}

/** Nhận voucher khi đạt 100% - POST /api/learn/achievements/{attemptId}/claim-voucher */
export async function claimVoucher(attemptId: number): Promise<void> {
  await api.post<ApiResponse<null>>(`/api/learn/achievements/${attemptId}/claim-voucher`);
}
