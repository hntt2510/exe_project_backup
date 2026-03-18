import type { ApiResponse } from "../types";
import { api } from "./api";

// ========== Types ==========

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  phone: string;
  fullName: string;
  avatarUrl: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  role: "CUSTOMER" | "ADMIN" | "STAFF" | "ARTISAN";
  status: string;
  createdAt: string;
}

/** PUT /api/users/{id} - Schema chuẩn backend */
export interface UpdateUserRequest {
  phone?: string;
  password?: string;
  fullName?: string;
  email?: string;
  /** YYYY-MM-DD */
  dateOfBirth?: string;
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface UserBooking {
  id: number;
  bookingCode: string;
  userId: number;
  tourId: number;
  tourTitle: string;
  tourScheduleId: number;
  tourDate: string;
  tourStartTime: string;
  numParticipants: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED" | string;
  paymentMethod: string;
  paidAt: string | null;
  cancelledAt: string | null;
  cancellationFee: number;
  refundAmount: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | string;
  createdAt: string;
  updatedAt: string;
  /** true = đã đánh giá, ẩn nút Đánh giá */
  isReview?: boolean;
}

export interface UserVoucher {
  id: number;
  code: string;
  discountType: string;
  discountValue: number;
  minPurchase: number;
  maxUsage: number;
  currentUsage: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
}

export interface LearnStats {
  totalLessonsCompleted: number;
  averageScore: number;
  learningStreak: number;
  totalCoursesCompleted: number;
  overallLearningProgressPercent: number;
  featuredCourses: FeaturedCourse[];
}

export interface FeaturedCourse {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
  categoryId: number;
  categoryName: string;
  quickNotesJson: string;
  culturalEtiquetteTitle: string;
  culturalEtiquetteText: string;
  lessonsCount: number;
  durationMinutes: number;
  lessons: {
    id: number;
    title: string;
    slug: string;
    thumbnailUrl: string;
    duration: number;
    videoUrl: string;
    orderIndex: number;
  }[];
  quizPrompt?: {
    id: number;
    title: string;
    totalQuestions: number;
    timeLimitMinutes: number;
  };
  suggestedTours?: {
    id: number;
    title: string;
    slug: string;
    thumbnailUrl: string;
    location: string;
    description: string;
    price: number;
  }[];
}

// ========== User Profile ==========

/** Lấy thông tin user hiện tại từ token (GET /api/users/me) */
export const getCurrentUser = async (): Promise<UserProfile> => {
  const res = await api.get<ApiResponse<UserProfile>>("/api/users/me");
  const raw = res.data.data as Record<string, unknown>;
  return {
    id: Number(raw.id),
    username: (raw.username as string) ?? "",
    email: (raw.email as string) ?? "",
    phone: (raw.phone as string) ?? "",
    fullName: (raw.fullName as string) ?? "",
    avatarUrl: (raw.avatarUrl as string) ?? "",
    dateOfBirth: raw.dateOfBirth ? String(raw.dateOfBirth).split("T")[0] : "",
    gender: (raw.gender as UserProfile["gender"]) ?? "OTHER",
    role: (raw.role as UserProfile["role"]) ?? "CUSTOMER",
    status: (raw.status as string) ?? "ACTIVE",
    createdAt: (raw.createdAt as string) ?? "",
  };
};

export const getUserProfile = async (userId: number): Promise<UserProfile> => {
  const res = await api.get<ApiResponse<UserProfile>>(`/api/users/${userId}`);
  return res.data.data;
};

export const updateUserProfile = async (
  userId: number,
  data: UpdateUserRequest,
): Promise<UserProfile> => {
  const res = await api.put<ApiResponse<UserProfile>>(
    `/api/users/${userId}`,
    data,
  );
  return res.data.data;
};

export const changePassword = async (
  data: ChangePasswordRequest,
): Promise<void> => {
  await api.post("/api/users/change-password", data);
};

export const uploadAvatar = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.put<
    ApiResponse<{ url: string; urls: string[]; message: string }>
  >("/api/upload/user/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data.url;
};

// ========== Bookings ==========

export const getUserBookings = async (): Promise<UserBooking[]> => {
  const res = await api.get<ApiResponse<UserBooking[]>>("/api/bookings");
  return res.data.data;
};

export const getBookingById = async (id: number): Promise<UserBooking> => {
  const res = await api.get<ApiResponse<UserBooking>>(`/api/bookings/${id}`);
  return res.data.data;
};

// ========== Reviews ==========

export interface CreateReviewRequest {
  bookingId: number;
  rating: number;
  comment: string;
  images?: File[];
}

export const createReview = async (
  data: CreateReviewRequest,
): Promise<unknown> => {
  const formData = new FormData();
  formData.append("bookingId", String(data.bookingId));
  formData.append("rating", String(data.rating));
  formData.append("comment", data.comment);
  if (data.images?.length) {
    data.images.forEach((file) => formData.append("images", file));
  }
  const res = await api.post<ApiResponse<unknown>>("/api/reviews", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
};

// ========== Vouchers ==========

/** Voucher từ Learn (quiz 100%) — BE không áp dụng giảm giá, nên FE ẩn khỏi danh sách */
const LEARN_VOUCHER_CODE_PREFIX = "COIVIET-LEARN-";

export function isLearnVoucher(code: string): boolean {
  return (code ?? "").toUpperCase().startsWith(LEARN_VOUCHER_CODE_PREFIX);
}

/** Lọc bỏ voucher từ Learn (không dùng được khi thanh toán) */
export function filterOutLearnVouchers<T extends { code?: string }>(vouchers: T[]): T[] {
  return vouchers.filter((v) => !isLearnVoucher(v.code ?? ""));
}

/** Lấy voucher đã claim của user. Loại bỏ voucher từ Learn. */
export const getUserVouchers = async (): Promise<UserVoucher[]> => {
  const res = await api.get<ApiResponse<UserVoucher[]>>("/api/vouchers/me");
  const raw = res.data.data ?? [];
  const mapped = raw.map((v: Record<string, unknown>) => ({
    id: Number(v.id ?? 0),
    code: (v.code as string) ?? "",
    discountType: (v.discountType as string) ?? "PERCENTAGE",
    discountValue: Number(v.discountValue ?? 0),
    minPurchase: Number(v.minPurchase ?? 0),
    maxUsage: Number(v.maxUsage ?? 1),
    currentUsage: Number(v.currentUsage ?? 0),
    validFrom: (v.validFrom as string) ?? "",
    validUntil: (v.validUntil as string) ?? "",
    isActive: (v.isActive as boolean) ?? true,
    createdAt: (v as any).claimedAt ?? (v.createdAt as string) ?? "",
  }));
  return filterOutLearnVouchers(mapped);
};

// ========== Learn Stats ==========

export const getLearnStats = async (): Promise<LearnStats> => {
  const res = await api.get<ApiResponse<LearnStats>>(
    "/api/learn/users/me/stats",
  );
  return res.data.data;
};

export const getLearnCourses = async (): Promise<FeaturedCourse[]> => {
  const res = await api.get<ApiResponse<FeaturedCourse[]>>(
    "/api/learn/users/me/courses",
  );
  return res.data.data;
};

/** Bài đã lưu - modules chứa lesson user đã lưu (save button) */
export const getSavedLessons = async (): Promise<FeaturedCourse[]> => {
  const res = await api.get<ApiResponse<FeaturedCourse[]>>(
    "/api/learn/users/me/saved-lessons",
  );
  return res.data.data;
};
