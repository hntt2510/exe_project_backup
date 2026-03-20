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
  /** Đã sử dụng — nếu có thì voucher không còn dùng được */
  usedAt?: string | null;
}

export type VoucherSource = 'LEARN' | 'SYSTEM';

export interface UserVoucherWithSource extends UserVoucher {
  source: VoucherSource;
}

/** Voucher đã sử dụng — không hiển thị trong thanh toán */
export function isVoucherUsed(v: { usedAt?: string | null; currentUsage?: number; maxUsage?: number }): boolean {
  if (v.usedAt) return true;
  const cur = v.currentUsage ?? 0;
  const max = v.maxUsage ?? 1;
  return cur >= max;
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
  const res = await api.get<ApiResponse<unknown>>("/api/users/me");
  const raw = (res.data.data ?? {}) as Record<string, unknown>;
  return {
    id: Number(raw.id),
    username: (raw.username as string) ?? "",
    email: (raw.email as string) ?? "",
    phone: (raw.phone as string) ?? "",
    fullName: (raw.fullName as string) ?? "",
    avatarUrl: (raw.avatarUrl as string) ?? "",
    dateOfBirth: raw.dateOfBirth ? String(raw.dateOfBirth).split("T")[0] : "",
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

export interface MyReview {
  id: number;
  bookingId: number;
  userId: number;
  userName?: string;
  userAvatar?: string;
  tourId: number;
  tourTitle: string;
  rating: number;
  comment: string;
  images?: string[];
  status?: string;
  createdAt: string;
}

/** Lấy danh sách review của user (GET /api/reviews/my-reviews) */
export const getMyReviews = async (): Promise<MyReview[]> => {
  const res = await api.get<ApiResponse<unknown[]>>("/api/reviews/my-reviews");
  const raw = res.data.data ?? [];
  return raw.map((item) => {
    const r = item as Record<string, unknown>;
    return {
    id: Number(r.id ?? 0),
    bookingId: Number(r.bookingId ?? 0),
    userId: Number(r.userId ?? 0),
    userName: r.userName as string | undefined,
    userAvatar: r.userAvatar as string | undefined,
    tourId: Number(r.tourId ?? 0),
    tourTitle: (r.tourTitle as string) ?? "",
    rating: Number(r.rating ?? 0),
    comment: (r.comment as string) ?? "",
    images: r.images as string[] | undefined,
    status: r.status as string | undefined,
    createdAt: (r.createdAt as string) ?? "",
    };
  });
};

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

/** Map raw voucher object sang UserVoucher */
function mapRawToUserVoucher(v: Record<string, unknown>): UserVoucher {
  return {
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
    createdAt: (v.claimedAt as string) ?? (v.createdAt as string) ?? "",
    usedAt: (v.usedAt as string | null | undefined) ?? null,
  };
}

/** API /api/vouchers/my trả về { userVouchers: [], systemVouchers: [] } */
interface VouchersMyResponse {
  userVouchers?: Array<Record<string, unknown>>;
  systemVouchers?: Array<Record<string, unknown>>;
}

/** Lấy voucher từ /api/vouchers/my — userVouchers + systemVouchers */
export const getUserVouchers = async (): Promise<UserVoucher[]> => {
  const res = await api.get<ApiResponse<VouchersMyResponse>>("/api/vouchers/my");
  const data = (res.data.data ?? {}) as VouchersMyResponse;
  const userList = data.userVouchers ?? [];
  const systemList = data.systemVouchers ?? [];
  const userMapped = userList.map((v) => mapRawToUserVoucher(v));
  const systemMapped = systemList.map((v) => mapRawToUserVoucher(v));
  return [...userMapped, ...systemMapped];
};

/** Gộp voucher từ my-claimed (quiz) và my (hệ thống + learn). Hiển thị tất cả với source. */
export const getAllUserVouchers = async (): Promise<UserVoucherWithSource[]> => {
  const [claimed, fromMy] = await Promise.all([
    import("./learnApi").then((m) => m.getMyClaimedVouchers()).catch(() => []),
    getUserVouchers().catch(() => [] as UserVoucher[]),
  ]);

  const seen = new Set<string>();
  const result: UserVoucherWithSource[] = [];

  // Thêm voucher từ my-claimed (quiz) trước
  for (const v of claimed) {
    const code = (v.code ?? "").toUpperCase();
    if (seen.has(code)) continue;
    seen.add(code);
    const usedAt = v.usedAt ?? null;
    result.push({
      id: v.id,
      code: v.code,
      discountType: v.discountType,
      discountValue: v.discountValue,
      minPurchase: v.minPurchase,
      maxUsage: 1,
      currentUsage: usedAt ? 1 : 0,
      validFrom: v.claimedAt ?? "",
      validUntil: v.validUntil,
      isActive: !usedAt,
      createdAt: v.claimedAt ?? "",
      usedAt: usedAt ?? null,
      source: "LEARN",
    });
  }

  // Thêm voucher từ /api/vouchers/my (hệ thống + learn chưa có trong claimed)
  for (const v of fromMy) {
    const code = (v.code ?? "").toUpperCase();
    if (seen.has(code)) continue;
    seen.add(code);
    const source: VoucherSource = isLearnVoucher(v.code ?? "") ? "LEARN" : "SYSTEM";
    result.push({ ...v, source });
  }

  return result;
};

// ========== Learn Stats ==========

export const getLearnStats = async (): Promise<LearnStats> => {
  const res = await api.get<ApiResponse<LearnStats>>(
    "/api/learn/users/me/stats",
  );
  return res.data.data;
};

/** Khóa đang học - modules user có progress (GET /api/learn/users/me/courses) */
export const getLearnCourses = async (): Promise<FeaturedCourse[]> => {
  const res = await api.get<ApiResponse<unknown[]>>(
    "/api/learn/users/me/courses",
  );
  const raw = res.data.data ?? [];
  return raw.map((item) => {
    const m = item as Record<string, unknown>;
    return {
    id: Number(m.id ?? 0),
    title: (m.title as string) ?? "",
    slug: (m.slug as string) ?? "",
    thumbnailUrl: (m.thumbnailUrl as string) ?? "",
    categoryId: Number(m.categoryId ?? 0),
    categoryName: (m.categoryName as string) ?? "",
    quickNotesJson: (m.quickNotesJson as string) ?? "",
    culturalEtiquetteTitle: (m.culturalEtiquetteTitle as string) ?? "",
    culturalEtiquetteText: (m.culturalEtiquetteText as string) ?? "",
    lessonsCount: Number(m.lessonsCount ?? 0),
    durationMinutes: Number(m.durationMinutes ?? 0),
    lessons: (m.lessons as FeaturedCourse["lessons"]) ?? [],
    quizPrompt: m.quizPrompt as FeaturedCourse["quizPrompt"],
    suggestedTours: m.suggestedTours as FeaturedCourse["suggestedTours"],
    };
  });
};

/** Bài đã lưu - lessons user đã lưu (save button). Map sang format tương thích FeaturedCourse. */
export const getSavedLessons = async (): Promise<FeaturedCourse[]> => {
  const res = await api.get<ApiResponse<unknown[]>>(
    "/api/learn/users/me/saved-lessons",
  );
  const raw = res.data.data ?? [];
  return raw.map((item) => {
    const l = item as Record<string, unknown>;
    const moduleId = l.moduleId != null ? Number(l.moduleId) : l.id;
    return {
      id: moduleId,
      title: (l.title as string) ?? "",
      slug: (l.slug as string) ?? "",
      thumbnailUrl: (l.thumbnailUrl as string) ?? "",
      categoryId: 0,
      categoryName: "",
      quickNotesJson: "",
      culturalEtiquetteTitle: "",
      culturalEtiquetteText: "",
      lessonsCount: 1,
      durationMinutes: Number(l.duration ?? 0),
      lessons: [],
      quizPrompt: undefined,
      suggestedTours: undefined,
    } as FeaturedCourse;
  });
};
