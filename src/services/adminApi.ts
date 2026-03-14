import api from "./api";
import type { ApiResponse } from "../types";

// ========== Admin Auth API ==========
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    role: string;
    status: string;
  };
}

export const adminLogin = async (
  data: LoginRequest,
): Promise<LoginResponse> => {
  const response = await api.post<ApiResponse<LoginResponse>>(
    "/api/admin/auth/login",
    data,
  );
  return response.data.data;
};

export const adminLogout = async (): Promise<void> => {
  await api.post("/api/admin/auth/logout");
};

// ========== Admin Tours API ==========
export interface AdminTour {
  id: number;
  title: string;
  description: string;
  provinceId: number;
  provinceName?: string;
  price: number;
  originalPrice?: number;
  minParticipants: number;
  maxParticipants: number;
  durationHours: number;
  status: "OPEN" | "NEAR_DEADLINE" | "FULL" | "NOT_ENOUGH" | "CANCELLED";
  thumbnailUrl: string;
  images: string[];
  artisanId?: number;
  artisanName?: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

/** Payload cho POST /api/tours và PUT /api/tours/{id} - khớp backend response */
export interface CreateTourRequest {
  title: string;
  description: string;
  provinceId: number;
  price: number;
  durationHours: number;
  maxParticipants: number;
  thumbnailUrl?: string;
  images?: string | string[]; // Backend trả images: string
  artisanId?: number | null;
}

export interface UpdateTourRequest extends Partial<CreateTourRequest> {
  id?: number;
  status?:
    | "OPEN"
    | "NEAR_DEADLINE"
    | "FULL"
    | "NOT_ENOUGH"
    | "CANCELLED"
    | "ACTIVE"
    | "INACTIVE";
}

export const getAdminTours = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  provinceId?: number;
}): Promise<{ data: AdminTour[]; total: number }> => {
  const response = await api.get<
    ApiResponse<
      | AdminTour[]
      | { tours?: AdminTour[]; content?: AdminTour[]; total?: number }
    >
  >("/api/tours/public", { params });
  const raw = response.data.data;
  let data: AdminTour[] = [];
  let total = 0;
  if (Array.isArray(raw)) {
    data = raw as AdminTour[];
    total = data.length;
  } else if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    data = (obj.tours as AdminTour[]) ?? (obj.content as AdminTour[]) ?? [];
    total = (obj.total as number) ?? data.length;
  }
  return { data, total };
};

export const getAdminTourById = async (id: number): Promise<AdminTour> => {
  const response = await api.get<ApiResponse<AdminTour>>(
    `/api/tours/public/${id}`,
  );
  return response.data.data;
};

export const createTour = async (
  data: CreateTourRequest,
): Promise<AdminTour> => {
  const response = await api.post<ApiResponse<AdminTour>>("/api/tours", data);
  return response.data.data;
};

export const updateTour = async (
  id: number,
  data: Partial<CreateTourRequest>,
): Promise<AdminTour> => {
  const response = await api.put<ApiResponse<AdminTour>>(
    `/api/tours/${id}`,
    data,
  );
  return response.data.data;
};

export const deleteTour = async (id: number): Promise<void> => {
  await api.delete(`/api/tours/${id}`);
};

// ========== Admin Bookings API ==========
// GET /api/bookings – response.data là mảng theo JSON bạn cung cấp
export type BookingPaymentStatus = "UNPAID" | "PAID" | "PARTIAL" | "REFUNDED";
export type BookingPaymentMethod =
  | "CREDIT_CARD"
  | "BANK_TRANSFER"
  | "CASH"
  | "EWALLET"
  | "VNPAY"
  | "MOMO"
  | string;
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PAID"
  | "CANCELLED"
  | "REFUNDED";

export interface AdminBooking {
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
  paymentStatus: BookingPaymentStatus;
  paymentMethod: BookingPaymentMethod;
  paidAt: string | null;
  cancelledAt: string | null;
  cancellationFee: number;
  refundAmount: number;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequest {
  tourId: number;
  userId: number;
  participants: number;
  tourDate: string;
  notes?: string;
}

export interface UpdateBookingRequest {
  status?: BookingStatus;
  paymentStatus?: BookingPaymentStatus;
  notes?: string;
}

/** Parse linh hoạt booking response - backend có thể trả data trực tiếp hoặc nested */
function parseBookingResponse(raw: unknown): AdminBooking[] {
  if (Array.isArray(raw)) return raw as AdminBooking[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    return (
      (obj.bookings as AdminBooking[]) ??
      (obj.content as AdminBooking[]) ??
      (obj.data as AdminBooking[]) ??
      (obj.items as AdminBooking[]) ??
      []
    );
  }
  return [];
}

export const getAdminBookings = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  tourId?: number;
  startDate?: string;
  endDate?: string;
}): Promise<{ data: AdminBooking[]; total: number }> => {
  const response = await api.get<unknown>("/api/bookings", { params });
  const body = response.data as Record<string, unknown>;
  const raw = body.data ?? body;
  let data = parseBookingResponse(raw);
  let total = data.length;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    total = (obj.totalElements as number) ?? (obj.total as number) ?? data.length;
  }
  return { data, total };
};

export const getAdminBookingById = async (
  id: number,
): Promise<AdminBooking> => {
  const response = await api.get<ApiResponse<AdminBooking>>(
    `/api/bookings/${id}`,
  );
  return response.data.data;
};

export const updateBooking = async (
  id: number,
  data: UpdateBookingRequest,
): Promise<AdminBooking> => {
  const response = await api.put<ApiResponse<AdminBooking>>(
    `/api/bookings/${id}`,
    data,
  );
  return response.data.data;
};

export const cancelBooking = async (
  id: number,
  reason?: string,
): Promise<AdminBooking> => {
  const response = await api.post<ApiResponse<AdminBooking>>(
    `/api/bookings/${id}/cancel`,
    { reason },
  );
  return response.data.data;
};

export const refundBooking = async (
  id: number,
  amount?: number,
): Promise<AdminBooking> => {
  const response = await api.post<ApiResponse<AdminBooking>>(
    `/api/bookings/${id}/refund`,
    { amount },
  );
  return response.data.data;
};

// --- Theo Swagger: GET /api/bookings/{id}/cancellation-fee ---
export interface BookingCancellationFee {
  fee: number;
  percent?: number;
  currency?: string;
}

export const getBookingCancellationFee = async (
  id: number,
): Promise<BookingCancellationFee> => {
  const response = await api.get<ApiResponse<BookingCancellationFee>>(
    `/api/bookings/${id}/cancellation-fee`,
  );
  return response.data.data;
};

// --- Theo Swagger: GET /api/bookings/check-availability ---
export interface CheckAvailabilityParams {
  tourId: number;
  date?: string; // ISO date
  startDate?: string;
  endDate?: string;
}

export interface CheckAvailabilityResult {
  available: boolean;
  remainingSlots?: number;
  message?: string;
}

export const checkBookingAvailability = async (
  params: CheckAvailabilityParams,
): Promise<CheckAvailabilityResult> => {
  const response = await api.get<ApiResponse<CheckAvailabilityResult>>(
    "/api/bookings/check-availability",
    { params },
  );
  return response.data.data;
};
export interface AdminUser {
  id: number;
  username: string;
  email: string;
  phone?: string;
  fullName: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  role: "CUSTOMER" | "USER" | "ADMIN" | "STAFF" | "ARTISAN";
  status: "ACTIVE" | "LOCKED" | "INACTIVE";
  createdAt: string;
  lastLogin?: string;
}

/** Khớp User Controller: username, email, phone, password, fullName, dateOfBirth */
export interface CreateUserRequest {
  username: string;
  email: string;
  phone: string;
  password: string;
  fullName: string;
  dateOfBirth?: string; // YYYY-MM-DD
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  role?: "CUSTOMER" | "USER" | "ADMIN" | "STAFF" | "ARTISAN";
  status?: "ACTIVE" | "LOCKED" | "INACTIVE";
}

export const getAdminUsers = async (params?: {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
}): Promise<{ data: AdminUser[]; total: number }> => {
  try {
    console.log("[getAdminUsers] 🚀 Request params:", params);
    console.log("[getAdminUsers] 🚀 Full URL:", `/api/users`);

    const response = await api.get<ApiResponse<AdminUser[]>>("/api/users", {
      params,
    });

    console.log("[getAdminUsers] ✅ Full response:", response);
    console.log("[getAdminUsers] ✅ Response status:", response.status);
    console.log("[getAdminUsers] ✅ Response headers:", response.headers);
    console.log(
      "[getAdminUsers] ✅ Response data:",
      JSON.stringify(response.data, null, 2),
    );

    const responseData = response.data.data;
    console.log(
      "[getAdminUsers] ✅ Response data.data:",
      JSON.stringify(responseData, null, 2),
    );

    // Response data is an array directly
    if (Array.isArray(responseData)) {
      console.log(
        "[getAdminUsers] ✅ Parsed as array, length:",
        responseData.length,
      );
      return {
        data: responseData,
        total: responseData.length,
      };
    }

    // Fallback for other formats
    console.warn(
      "[getAdminUsers] ⚠️ Response data is not an array:",
      typeof responseData,
    );
    return {
      data: [],
      total: 0,
    };
  } catch (error: any) {
    console.error("[getAdminUsers] ❌ Error details:", error);
    console.error("[getAdminUsers] ❌ Error response:", error?.response);
    console.error(
      "[getAdminUsers] ❌ Error response data:",
      error?.response?.data,
    );
    console.error(
      "[getAdminUsers] ❌ Error response status:",
      error?.response?.status,
    );
    console.error(
      "[getAdminUsers] ❌ Error response headers:",
      error?.response?.headers,
    );
    console.error("[getAdminUsers] ❌ Error config:", error?.config);
    throw error;
  }
};

export const getAdminUserById = async (id: number): Promise<AdminUser> => {
  const response = await api.get<ApiResponse<AdminUser>>(`/api/users/${id}`);
  return response.data.data;
};

export const createUser = async (
  data: CreateUserRequest,
): Promise<AdminUser> => {
  const response = await api.post<ApiResponse<AdminUser>>("/api/users", data);
  return response.data.data;
};

export const updateUser = async (
  id: number,
  data: UpdateUserRequest,
): Promise<AdminUser> => {
  const response = await api.put<ApiResponse<AdminUser>>(
    `/api/users/${id}`,
    data,
  );
  return response.data.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/api/users/${id}`);
};

/** Reset mật khẩu member/staff (admin). Gọi POST /api/users/change-password. */
export const resetUserPassword = async (
  id: number,
  newPassword: string,
): Promise<void> => {
  await api.post("/api/users/change-password", {
    userId: id,
    oldPassword: "",
    newPassword,
  });
};

// ========== Admin Content API ==========
export interface AdminContent {
  id: number;
  title: string;
  slug: string;
  content: string;
  blocksJson?: string;
  featuredImageUrl: string;
  images: string[];
  provinceId?: number;
  provinceName?: string;
  authorId: number;
  authorName?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  viewCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentRequest {
  title: string;
  content: string;
  blocksJson?: string;
  featuredImageUrl: string;
  images: string[];
  provinceId?: number;
  status: "DRAFT" | "PUBLISHED";
}

export interface UpdateContentRequest extends Partial<CreateContentRequest> {
  id: number;
}

export const getAdminContent = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  provinceId?: number;
  search?: string;
}): Promise<{ data: AdminContent[]; total: number }> => {
  const response = await api.get<
    ApiResponse<{ content: AdminContent[]; total: number }>
  >("/api/admin/content", { params });
  return {
    data: response.data.data.content || response.data.data,
    total: response.data.data.total || 0,
  };
};

export const getAdminContentById = async (
  id: number,
): Promise<AdminContent> => {
  const response = await api.get<ApiResponse<AdminContent>>(
    `/api/admin/content/${id}`,
  );
  return response.data.data;
};

export const createContent = async (
  data: CreateContentRequest,
): Promise<AdminContent> => {
  const response = await api.post<ApiResponse<AdminContent>>(
    "/api/admin/content",
    data,
  );
  return response.data.data;
};

export const updateContent = async (
  id: number,
  data: Partial<CreateContentRequest>,
): Promise<AdminContent> => {
  const response = await api.put<ApiResponse<AdminContent>>(
    `/api/admin/content/${id}`,
    data,
  );
  return response.data.data;
};

export const deleteContent = async (id: number): Promise<void> => {
  await api.delete(`/api/admin/content/${id}`);
};

// ========== Admin Artisans API ==========
/** Khớp response GET /api/artisans/public */
export interface AdminArtisan {
  id: number;
  user?: {
    id: number;
    username: string;
    email: string;
    phone?: string;
    fullName: string;
    avatarUrl?: string;
    dateOfBirth?: string;
    gender?: string;
    role: string;
    status: string;
    createdAt?: string;
  };
  fullName: string;
  specialization: string;
  bio?: string;
  province?: {
    id: number;
    name: string;
    slug?: string;
    region?: string;
    [key: string]: unknown;
  };
  workshopAddress?: string;
  profileImageUrl?: string;
  totalTours?: number;
  averageRating?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** POST /api/artisans - Tạo nghệ nhân mới - khớp backend response */
export interface CreateArtisanRequest {
  userId: number;
  fullName: string;
  specialization: string;
  bio?: string;
  profileImageUrl?: string;
  provinceId?: number;
  province?: { id: number };
  workshopAddress?: string;
}

/** PUT /api/artisans/{id} - Cập nhật nghệ nhân - khớp backend response */
export interface UpdateArtisanRequest {
  fullName?: string;
  specialization?: string;
  bio?: string;
  profileImageUrl?: string;
  provinceId?: number;
  province?: { id: number };
  workshopAddress?: string;
  isActive?: boolean;
}

/** Danh sách nghệ nhân. Backend chỉ có GET /api/artisans/public cho danh sách */
export const getAdminArtisans = async (params?: {
  page?: number;
  limit?: number;
  provinceId?: number;
  status?: string;
}): Promise<{ data: AdminArtisan[]; total: number }> => {
  const response = await api.get<
    ApiResponse<AdminArtisan[] | { artisans?: AdminArtisan[]; total?: number }>
  >("/api/artisans/public", { params });
  const d = response.data.data;
  const arr = Array.isArray(d)
    ? d
    : ((d as { artisans?: AdminArtisan[] })?.artisans ?? []);
  const total = Array.isArray(d)
    ? d.length
    : ((d as { total?: number })?.total ?? arr.length);
  return { data: arr, total };
};

/** Chi tiết nghệ nhân theo ID. Backend: GET /api/artisans/{id} */
export const getAdminArtisanById = async (
  id: number,
): Promise<AdminArtisan> => {
  const response = await api.get<ApiResponse<AdminArtisan>>(
    `/api/artisans/${id}`,
  );
  return response.data.data;
};

/** Tạo nghệ nhân mới. Backend: POST /api/artisans */
export const createArtisan = async (
  data: CreateArtisanRequest,
): Promise<AdminArtisan> => {
  const response = await api.post<ApiResponse<AdminArtisan>>(
    "/api/artisans",
    data,
  );
  return response.data.data;
};

/** Cập nhật nghệ nhân. Backend: PUT /api/artisans/{id} */
export const updateArtisan = async (
  id: number,
  data: UpdateArtisanRequest,
): Promise<AdminArtisan> => {
  const response = await api.put<ApiResponse<AdminArtisan>>(
    `/api/artisans/${id}`,
    data,
  );
  return response.data.data;
};

/** Xóa nghệ nhân. Backend: DELETE /api/artisans/{id} */
export const deleteArtisan = async (id: number): Promise<void> => {
  await api.delete(`/api/artisans/${id}`);
};

// ========== Admin Learn API ==========
// Types khớp API response (quiz: /api/learn/public/quizzes/{id})
export type LearnQuizDifficulty = "BASIC" | "INTERMEDIATE" | "ADVANCED";

export interface AdminLearnQuizOption {
  id: number;
  label: string;
  optionText: string;
  isCorrect: boolean;
}

export interface AdminLearnQuizQuestion {
  id: number;
  questionText: string;
  hintText: string;
  orderIndex: number;
  options: AdminLearnQuizOption[];
}

export interface AdminLearnQuiz {
  id: number;
  moduleId: number;
  title: string;
  timeLimitMinutes: number;
  difficulty: LearnQuizDifficulty;
  objective: string;
  rules: string[];
  totalQuestions: number;
  questions: AdminLearnQuizQuestion[];
}

export interface AdminLearnCategory {
  id: number;
  name: string;
  slug: string;
  orderIndex: number;
}

export interface AdminLearnModuleLesson {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
  duration: number;
  videoUrl: string;
  orderIndex: number;
}

export interface AdminLearnQuizPrompt {
  id: number;
  title: string;
  totalQuestions: number;
  timeLimitMinutes: number;
}

export interface AdminLearnModuleSuggestedTour {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
  location: string;
  description: string;
  price: number;
}

export interface AdminLearnModule {
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
  lessons: AdminLearnModuleLesson[];
  quizPrompt?: AdminLearnQuizPrompt;
  suggestedTours?: AdminLearnModuleSuggestedTour[];
}

export interface AdminLearnLessonAuthor {
  id: number;
  fullName: string;
  profileImageUrl?: string;
}

export interface AdminLearnLesson {
  id: number;
  title: string;
  slug: string;
  imageUrl: string;
  contentJson: string;
  vocabularyJson: string;
  objectiveText: string;
  difficulty: LearnQuizDifficulty;
  estimatedMinutes: number;
  videoUrl: string;
  viewsCount: number;
  orderIndex: number;
  totalLessonsInModule: number;
  author?: AdminLearnLessonAuthor;
  moduleId: number;
  moduleTitle: string;
  categoryName: string;
}

export const getAdminLearnCategories = async (): Promise<
  AdminLearnCategory[]
> => {
  const response = await api.get<ApiResponse<AdminLearnCategory[]>>(
    "/api/learn/public/categories",
  );
  return response.data.data ?? [];
};

export const getAdminLearnModules = async (params?: {
  categoryId?: number;
}): Promise<AdminLearnModule[]> => {
  const response = await api.get<ApiResponse<AdminLearnModule[]>>(
    "/api/learn/public/modules",
    { params },
  );
  return response.data.data ?? [];
};

export const getAdminLearnModuleById = async (
  id: number,
): Promise<AdminLearnModule> => {
  const response = await api.get<ApiResponse<AdminLearnModule>>(
    `/api/learn/public/modules/${id}`,
  );
  return response.data.data;
};

export const getAdminLearnLessonById = async (
  id: number,
): Promise<AdminLearnLesson> => {
  const response = await api.get<ApiResponse<AdminLearnLesson>>(
    `/api/learn/public/lessons/${id}`,
  );
  return response.data.data;
};

export const getAdminLearnQuizzes = async (params?: {
  moduleId?: number;
  page?: number;
  limit?: number;
}): Promise<{ data: AdminLearnQuiz[]; total: number }> => {
  const response = await api.get<
    ApiResponse<
      | AdminLearnQuiz[]
      | { content?: AdminLearnQuiz[]; quizzes?: AdminLearnQuiz[]; total?: number }
    >
  >("/api/learn/quizzes", { params });
  const raw = response.data.data;
  let data: AdminLearnQuiz[] = [];
  let total = 0;
  if (Array.isArray(raw)) {
    data = raw;
    total = raw.length;
  } else if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    data =
      (obj.content as AdminLearnQuiz[]) ??
      (obj.quizzes as AdminLearnQuiz[]) ??
      (obj.data as AdminLearnQuiz[]) ??
      [];
    total =
      (obj.totalElements as number) ?? (obj.total as number) ?? data.length;
  }
  return { data, total };
};

export const getAdminLearnQuizById = async (
  id: number,
): Promise<AdminLearnQuiz> => {
  // Dùng endpoint public như cũ
  const response = await api.get<ApiResponse<any>>(
    `/api/learn/public/quizzes/${id}`,
  );
  const rawData = response.data.data;
  
  // Transform snake_case to camelCase cho options và đảm bảo isCorrect được set đúng
  if (rawData && rawData.questions && Array.isArray(rawData.questions)) {
    rawData.questions = rawData.questions.map((q: any) => {
      if (q.options && Array.isArray(q.options)) {
        q.options = q.options.map((opt: any) => {
          // Xử lý isCorrect: kiểm tra cả camelCase và snake_case
          // Ưu tiên snake_case vì có thể backend trả về is_correct nhưng không map vào isCorrect
          let isCorrect = false;
          
          // Kiểm tra snake_case trước (vì có thể backend trả về đúng field này)
          if (opt.is_correct !== undefined && opt.is_correct !== null) {
            isCorrect = Boolean(opt.is_correct);
          } 
          // Sau đó kiểm tra camelCase
          else if (opt.isCorrect !== undefined && opt.isCorrect !== null) {
            isCorrect = Boolean(opt.isCorrect);
          }
          // Kiểm tra các format khác
          else if (opt["is-correct"] !== undefined && opt["is-correct"] !== null) {
            isCorrect = Boolean(opt["is-correct"]);
          }
          // Nếu cả hai đều null hoặc undefined, mặc định là false
          else {
            isCorrect = false;
          }
          
          const transformed = {
            id: opt.id,
            label: opt.label || opt.label_text || String(opt.id),
            optionText: opt.optionText || opt.option_text || opt.text || "",
            isCorrect,
          };
          
          // Debug log để kiểm tra (chỉ trong development)
          if (import.meta.env.DEV) {
            console.log(`[Quiz Transform] Option ${opt.id}:`, {
              original: {
                id: opt.id,
                label: opt.label,
                optionText: opt.optionText || opt.option_text,
                isCorrect: opt.isCorrect,
                is_correct: opt.is_correct,
                allKeys: Object.keys(opt),
              },
              transformed,
            });
          }
          
          return transformed;
        });
      }
      return q;
    });
  }
  
  // Debug log toàn bộ response sau khi transform
  if (import.meta.env.DEV) {
    console.log("[Quiz Transform] Final transformed data:", rawData);
  }
  
  return rawData as AdminLearnQuiz;
};

// Admin CRUD - dùng khi backend có /api/admin/learn/*
export const createAdminLearnCategory = async (data: {
  name: string;
  slug?: string;
  orderIndex?: number;
}): Promise<AdminLearnCategory> => {
  const response = await api.post<ApiResponse<AdminLearnCategory>>(
    "/api/admin/learn/categories",
    data,
  );
  return response.data.data;
};

export const updateAdminLearnCategory = async (
  id: number,
  data: Partial<{ name: string; slug: string; orderIndex: number }>,
): Promise<AdminLearnCategory> => {
  const response = await api.put<ApiResponse<AdminLearnCategory>>(
    `/api/admin/learn/categories/${id}`,
    data,
  );
  return response.data.data;
};

export const deleteAdminLearnCategory = async (id: number): Promise<void> => {
  await api.delete(`/api/admin/learn/categories/${id}`);
};

export const createAdminLearnModule = async (data: {
  title: string;
  slug?: string;
  categoryId: number;
  thumbnailUrl?: string;
  quickNotesJson?: string;
  culturalEtiquetteTitle?: string;
  culturalEtiquetteText?: string;
}): Promise<AdminLearnModule> => {
  const response = await api.post<ApiResponse<AdminLearnModule>>(
    "/api/learn/modules",
    data,
  );
  // Đảm bảo response được parse đúng theo structure từ API
  const moduleData = response.data.data;
  
  // Transform nếu cần (đảm bảo các field optional được set đúng)
  return {
    ...moduleData,
    lessons: moduleData.lessons || [],
    suggestedTours: moduleData.suggestedTours || [],
  };
};

export const updateAdminLearnModule = async (
  id: number,
  data: Partial<Parameters<typeof createAdminLearnModule>[0]>,
): Promise<AdminLearnModule> => {
  const response = await api.put<ApiResponse<AdminLearnModule>>(
    `/api/learn/modules/${id}`,
    data,
  );
  return response.data.data;
};

export const deleteAdminLearnModule = async (id: number): Promise<void> => {
  await api.delete(`/api/learn/modules/${id}`);
};

export const createAdminLearnLesson = async (data: {
  title: string;
  slug?: string;
  moduleId: number;
  contentJson?: string;
  vocabularyJson?: string;
  objectiveText?: string;
  difficulty?: LearnQuizDifficulty;
  estimatedMinutes?: number;
  videoUrl?: string;
  imageUrl?: string;
  orderIndex?: number;
}): Promise<AdminLearnLesson> => {
  const response = await api.post<ApiResponse<AdminLearnLesson>>(
    "/api/learn/lessons",
    data,
  );
  return response.data.data;
};

export const updateAdminLearnLesson = async (
  id: number,
  data: Partial<Parameters<typeof createAdminLearnLesson>[0]>,
): Promise<AdminLearnLesson> => {
  const response = await api.put<ApiResponse<AdminLearnLesson>>(
    `/api/learn/lessons/${id}`,
    data,
  );
  return response.data.data;
};

export const deleteAdminLearnLesson = async (id: number): Promise<void> => {
  await api.delete(`/api/learn/lessons/${id}`);
};

export const createAdminLearnQuiz = async (data: {
  moduleId: number;
  title: string;
  timeLimitMinutes: number;
  difficulty: LearnQuizDifficulty;
  objective?: string;
  rules?: string[];
  questions: Array<{
    questionText: string;
    hintText?: string;
    orderIndex: number;
    options: Array<{ label: string; optionText: string; isCorrect: boolean }>;
  }>;
}): Promise<AdminLearnQuiz> => {
  const response = await api.post<ApiResponse<AdminLearnQuiz>>(
    "/api/learn/quizzes",
    data,
  );
  return response.data.data;
};

export interface UpdateAdminLearnQuizPayload {
  title?: string;
  timeLimitMinutes?: number;
  difficulty?: LearnQuizDifficulty;
  objective?: string;
  rules?: string[];
  questions?: Array<{
    id?: number;
    questionText: string;
    hintText?: string;
    orderIndex: number;
    options: Array<{
      id?: number;
      label: string;
      optionText: string;
      isCorrect: boolean;
    }>;
  }>;
}

export const updateAdminLearnQuiz = async (
  id: number,
  data: UpdateAdminLearnQuizPayload,
): Promise<AdminLearnQuiz> => {
  const response = await api.put<ApiResponse<AdminLearnQuiz>>(
    `/api/learn/quizzes/${id}`,
    data,
  );
  return response.data.data;
};

export const deleteAdminLearnQuiz = async (id: number): Promise<void> => {
  await api.delete(`/api/learn/quizzes/${id}`);
};

/** Thêm câu hỏi vào quiz - POST /api/learn/quizzes/{quizId}/questions */
export interface AdminLearnQuizQuestionCreate {
  questionText: string;
  hintText?: string;
  orderIndex: number;
  options: Array<{ label: string; optionText: string; isCorrect: boolean }>;
}

export interface AdminLearnQuizQuestionResponse {
  id: number;
  questionText: string;
  hintText: string;
  orderIndex: number;
  options: AdminLearnQuizOption[];
}

export const addQuizQuestion = async (
  quizId: number,
  data: AdminLearnQuizQuestionCreate,
): Promise<AdminLearnQuizQuestionResponse> => {
  const response = await api.post<ApiResponse<AdminLearnQuizQuestionResponse>>(
    `/api/learn/quizzes/${quizId}/questions`,
    data,
  );
  return response.data.data;
};

// ========== Admin Vouchers API ==========
// Response structure: { success, code, message, data, errors, timestamp }
export type VoucherDiscountType = "PERCENTAGE" | "FIXED_AMOUNT" | string;

export interface AdminVoucher {
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

export interface CreateVoucherRequest {
  code: string;
  discountType: string;
  discountValue: number;
  minPurchase: number;
  maxUsage: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export interface UpdateVoucherRequest extends Partial<CreateVoucherRequest> {
  isActive?: boolean;
}

export const getAdminVouchers = async (params?: {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}): Promise<{ data: AdminVoucher[]; total: number }> => {
  const response = await api.get<
    ApiResponse<
      | AdminVoucher[]
      | { content?: AdminVoucher[]; totalElements?: number }
      | { vouchers?: AdminVoucher[]; total?: number }
      | { items?: AdminVoucher[] }
    >
  >("/api/vouchers", { params });
  const raw = response.data.data;
  let data: AdminVoucher[] = [];
  let total = 0;
  if (Array.isArray(raw)) {
    data = raw;
    total = raw.length;
  } else if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    data =
      (obj.content as AdminVoucher[]) ??
      (obj.vouchers as AdminVoucher[]) ??
      (obj.items as AdminVoucher[]) ??
      [];
    total =
      (obj.totalElements as number) ?? (obj.total as number) ?? data.length;
  }
  return { data, total };
};

export const getAdminVoucherById = async (
  id: number,
): Promise<AdminVoucher> => {
  const response = await api.get<ApiResponse<AdminVoucher>>(
    `/api/vouchers/${id}`,
  );
  return response.data.data;
};

export const createVoucher = async (
  data: CreateVoucherRequest,
): Promise<AdminVoucher> => {
  const response = await api.post<ApiResponse<AdminVoucher>>(
    "/api/vouchers",
    data,
  );
  return response.data.data;
};

export const updateVoucher = async (
  id: number,
  data: UpdateVoucherRequest,
): Promise<AdminVoucher> => {
  const response = await api.put<ApiResponse<AdminVoucher>>(
    `/api/vouchers/${id}`,
    data,
  );
  return response.data.data;
};

export const deleteVoucher = async (id: number): Promise<void> => {
  await api.delete(`/api/vouchers/${id}`);
};

// ========== Admin Tour Schedules API ==========
// Theo spec: { success, code, message, data, errors, timestamp }
// GET /api/tour-schedules/{id} -> data: AdminTourSchedule
// GET /api/tour-schedules/tour/{tourId} -> data: AdminTourSchedule[] | { content: AdminTourSchedule[] }
export type TourScheduleStatus = "SCHEDULED" | "CANCELLED" | "COMPLETED" | string;

export interface AdminTourSchedule {
  id: number;
  tour: {
    id: number;
    title: string;
    slug?: string;
    province?: { id: number; name: string; slug?: string; region?: string };
    price?: number;
    maxParticipants?: number;
    artisan?: { id: number; fullName: string };
    [key: string]: unknown;
  };
  tourDate: string; // "YYYY-MM-DD"
  startTime?: { hour: number; minute: number; second?: number; nano?: number } | string; // API có thể trả về "HH:mm:ss" hoặc object
  maxSlots: number;
  bookedSlots: number;
  currentPrice?: number; // Backend có thể trả price thay vì currentPrice
  discountPercent?: number;
  status: TourScheduleStatus;
  createdAt: string;
}

/** Response wrapper đúng theo API spec */
export interface TourScheduleApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  errors?: Record<string, unknown>;
  timestamp: string;
}

/** startTime theo response: { hour, minute, second, nano } */
export interface TourScheduleStartTime {
  hour: number;
  minute: number;
  second?: number;
  nano?: number;
}

export interface CreateTourScheduleRequest {
  tourId: number;
  tourDate: string; // "YYYY-MM-DD"
  startTime?: TourScheduleStartTime | string;
  maxSlots: number;
  currentPrice: number;
  discountPercent?: number;
  status?: TourScheduleStatus;
}

export interface UpdateTourScheduleRequest {
  tourDate?: string;
  startTime?: TourScheduleStartTime | string;
  maxSlots?: number;
  currentPrice?: number;
  discountPercent?: number;
  status?: TourScheduleStatus;
}

export const getTourSchedules = async (params?: {
  tourId?: number;
  page?: number;
  limit?: number;
}): Promise<{ data: AdminTourSchedule[]; total: number }> => {
  const response = await api.get<unknown>("/api/tour-schedules", { params });
  const body = response.data as Record<string, unknown>;
  const raw = body.data ?? body;
  let data = parseScheduleResponse(raw);
  let total = data.length;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    total = (obj.totalElements as number) ?? (obj.total as number) ?? data.length;
  }
  return { data, total };
};

/** Parse linh hoạt response - backend có thể trả data trực tiếp hoặc nested */
function parseScheduleResponse(raw: unknown): AdminTourSchedule[] {
  if (Array.isArray(raw)) return raw as AdminTourSchedule[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    return (
      (obj.schedules as AdminTourSchedule[]) ??
      (obj.content as AdminTourSchedule[]) ??
      (obj.data as AdminTourSchedule[]) ??
      (obj.items as AdminTourSchedule[]) ??
      []
    );
  }
  return [];
}

export const getTourSchedulesByTourId = async (
  tourId: number,
): Promise<AdminTourSchedule[]> => {
  const response = await api.get<TourScheduleApiResponse<
    AdminTourSchedule[] | { content?: AdminTourSchedule[] }
  >>(`/api/tour-schedules/tour/${tourId}`);
  const body = response.data;
  const raw = body.data;
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && "content" in raw)
    return (raw.content as AdminTourSchedule[]) ?? [];
  return parseScheduleResponse(raw);
};

export const getTourScheduleById = async (
  id: number,
): Promise<AdminTourSchedule> => {
  const response = await api.get<TourScheduleApiResponse<AdminTourSchedule>>(
    `/api/tour-schedules/${id}`,
  );
  const body = response.data;
  if (!body.data) throw new Error("API không trả về data");
  return body.data;
};

export const createTourSchedule = async (
  data: CreateTourScheduleRequest,
): Promise<AdminTourSchedule> => {
  const response = await api.post<TourScheduleApiResponse<AdminTourSchedule>>(
    "/api/tour-schedules",
    data,
  );
  const body = response.data;
  if (!body.data) throw new Error("API không trả về data");
  return body.data;
};

export const updateTourSchedule = async (
  id: number,
  data: UpdateTourScheduleRequest,
): Promise<AdminTourSchedule> => {
  const response = await api.put<TourScheduleApiResponse<AdminTourSchedule>>(
    `/api/tour-schedules/${id}`,
    data,
  );
  const body = response.data;
  if (!body.data) throw new Error("API không trả về data");
  return body.data;
};

export const deleteTourSchedule = async (id: number): Promise<void> => {
  await api.delete(`/api/tour-schedules/${id}`);
};

// ========== Admin Dashboard API ==========
export interface DashboardStats {
  totalTours: number;
  totalBookings: number;
  totalUsers: number;
  totalRevenue: number;
  bookingsToday: number;
  toursGrowth: number;
  bookingsGrowth: number;
  revenueGrowth: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get<ApiResponse<DashboardStats>>(
    "/api/admin/dashboard/stats",
  );
  return response.data.data;
};
