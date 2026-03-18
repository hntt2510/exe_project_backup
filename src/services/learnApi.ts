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

export interface LessonUserStatusResponse {
  isLiked: boolean;
  isSaved: boolean;
  isCompleted: boolean;
  progressPercent: number;
  isFollowingArtisan: boolean;
}

/** Lấy trạng thái user với bài học - GET /api/learn/lessons/{id}/user-status */
export async function getLessonUserStatus(lessonId: number): Promise<LessonUserStatusResponse> {
  const res = await api.get<ApiResponse<LessonUserStatusResponse>>(`/api/learn/lessons/${lessonId}/user-status`);
  return res.data.data!;
}

export interface ModuleUserProgressResponse {
  completedLessonIds: number[];
  completedCount: number;
  totalLessons: number;
  progressPercent: number;
}

/** Lấy tiến độ user trong module - GET /api/learn/modules/{id}/user-progress */
export async function getModuleUserProgress(moduleId: number): Promise<ModuleUserProgressResponse> {
  const res = await api.get<ApiResponse<ModuleUserProgressResponse>>(`/api/learn/modules/${moduleId}/user-progress`);
  return res.data.data!;
}

/** Đánh dấu hoàn thành bài học - POST /api/learn/lessons/{id}/complete */
export async function completeLesson(lessonId: number): Promise<void> {
  await api.post<ApiResponse<null>>(`/api/learn/lessons/${lessonId}/complete`);
}

/** Like bài - POST /api/learn/lessons/{id}/like — returns true nếu đã like */
export async function likeLesson(lessonId: number): Promise<boolean> {
  const res = await api.post<ApiResponse<boolean>>(`/api/learn/lessons/${lessonId}/like`);
  return res.data.data ?? false;
}

/** Bỏ like bài - DELETE /api/learn/lessons/{id}/like */
export async function unlikeLesson(lessonId: number): Promise<boolean> {
  const res = await api.delete<ApiResponse<boolean>>(`/api/learn/lessons/${lessonId}/like`);
  return res.data.data ?? false;
}

/** Lưu bài - POST /api/learn/lessons/{id}/save — returns true nếu đã lưu */
export async function saveLesson(lessonId: number): Promise<boolean> {
  const res = await api.post<ApiResponse<boolean>>(`/api/learn/lessons/${lessonId}/save`);
  return res.data.data ?? false;
}

/** Bỏ lưu bài - DELETE /api/learn/lessons/{id}/save */
export async function unsaveLesson(lessonId: number): Promise<boolean> {
  const res = await api.delete<ApiResponse<boolean>>(`/api/learn/lessons/${lessonId}/save`);
  return res.data.data ?? false;
}

/** Theo dõi nghệ nhân - POST /api/learn/artisans/{id}/follow — returns true nếu đang theo dõi */
export async function followArtisan(artisanId: number): Promise<boolean> {
  const res = await api.post<ApiResponse<boolean>>(`/api/learn/artisans/${artisanId}/follow`);
  return res.data.data ?? false;
}

/** Bỏ theo dõi nghệ nhân - DELETE /api/learn/artisans/{id}/follow */
export async function unfollowArtisan(artisanId: number): Promise<boolean> {
  const res = await api.delete<ApiResponse<boolean>>(`/api/learn/artisans/${artisanId}/follow`);
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

/** Kiểm tra user đã nhận voucher cho quiz chưa - GET /api/learn/quizzes/{quizId}/voucher-claimed */
export async function checkQuizVoucherClaimed(quizId: number): Promise<boolean> {
  const res = await api.get<ApiResponse<boolean>>(`/api/learn/quizzes/${quizId}/voucher-claimed`);
  return res.data.data ?? false;
}

/** Nhận voucher khi đạt 100% - POST /api/learn/achievements/{attemptId}/claim-voucher */
export async function claimVoucher(attemptId: number): Promise<void> {
  await api.post<ApiResponse<null>>(`/api/learn/achievements/${attemptId}/claim-voucher`);
}

/** Voucher đã nhận (sau claim) - dùng để hiển thị mã voucher */
export interface ClaimedVoucherInfo {
  id: number;
  code: string;
  discountType: string;
  discountValue: number;
  minPurchase: number;
  validUntil: string;
  claimedAt?: string;
}

/** Lấy voucher đã claim - GET /api/vouchers/my-claimed */
export async function getMyClaimedVouchers(): Promise<ClaimedVoucherInfo[]> {
  const res = await api.get<ApiResponse<Array<Record<string, unknown>>>>('/api/vouchers/my-claimed');
  const raw = res.data.data ?? [];
  return raw.map((v) => ({
    id: (v.id as number) ?? 0,
    code: (v.code as string) ?? '',
    discountType: (v.discountType as string) ?? 'PERCENTAGE',
    discountValue: Number(v.discountValue ?? 0),
    minPurchase: Number(v.minPurchase ?? 0),
    validUntil: (v.validUntil as string) ?? '',
    claimedAt: v.claimedAt as string | undefined,
  }));
}
