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

/** Gọi POST /api/auth/logout để invalidate token trên server */
export const adminLogout = async (): Promise<void> => {
  await api.post("/api/auth/logout");
};

// ========== Admin Tours API ==========
/** GET /api/tours/public/{id} - Response structure từ backend */
export interface PublicTourDetail {
  id: number;
  province?: {
    id: number;
    name: string;
    slug?: string;
    region?: string;
    latitude?: number;
    longitude?: number;
    thumbnailUrl?: string;
    description?: string;
    isActive?: boolean;
    bestSeason?: string;
    transportation?: string;
    culturalTips?: string;
  };
  title: string;
  slug?: string;
  description: string;
  bestSeason?: string;
  transportation?: string;
  culturalTips?: string;
  preparationTips?: string;
  durationHours: number;
  maxParticipants: number;
  price: number;
  thumbnailUrl?: string;
  images?: string | string[]; // Backend trả string (JSON array)
  artisan?: {
    id: number;
    fullName?: string;
    user?: Record<string, unknown>;
    province?: Record<string, unknown>;
    [key: string]: unknown;
  };
  totalBookings?: number;
  averageRating?: number;
  status?: string;
  createdAt?: string;
}

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
  status:
    | "OPEN"
    | "NEAR_DEADLINE"
    | "FULL"
    | "NOT_ENOUGH"
    | "CANCELLED"
    | "ACTIVE"
    | "INACTIVE";
  thumbnailUrl: string;
  images: string[];
  artisanId?: number;
  artisanName?: string;
  bestSeason?: string;
  transportation?: string;
  culturalTips?: string;
  preparationTips?: string;
  totalBookings?: number;
  averageRating?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt?: string;
}

/** Parse images từ string (JSON) hoặc array */
function parseTourImages(images?: string | string[]): string[] {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  const trimmed = (typeof images === "string" ? images : "").trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Chuẩn hóa PublicTourDetail thành AdminTour - chỉ dùng field từ API */
export function normalizePublicTourDetail(
  raw: PublicTourDetail | Record<string, unknown>,
): AdminTour {
  const r = raw as Record<string, unknown>;
  const province = r.province as { id?: number; name?: string } | undefined;
  const artisan = r.artisan as { id?: number; fullName?: string } | undefined;
  return {
    id: r.id as number,
    title: (r.title as string) ?? "",
    description: (r.description as string) ?? "",
    provinceId: (r.provinceId as number) ?? province?.id ?? 0,
    provinceName: (r.provinceName as string) ?? province?.name,
    price: (r.price as number) ?? 0,
    minParticipants: 0, // API không có - dùng maxParticipants cho Đăng ký
    maxParticipants: (r.maxParticipants as number) ?? 0,
    durationHours: (r.durationHours as number) ?? 0,
    status: (r.status as AdminTour["status"]) ?? "ACTIVE",
    thumbnailUrl: (r.thumbnailUrl as string) ?? "",
    images: parseTourImages(r.images as string | string[]),
    artisanId: (r.artisanId as number) ?? artisan?.id,
    artisanName: (r.artisanName as string) ?? artisan?.fullName,
    bestSeason: r.bestSeason as string | undefined,
    transportation: r.transportation as string | undefined,
    culturalTips: r.culturalTips as string | undefined,
    preparationTips: r.preparationTips as string | undefined,
    totalBookings: r.totalBookings as number | undefined,
    averageRating: r.averageRating as number | undefined,
    createdAt: (r.createdAt as string) ?? "",
    updatedAt: (r.updatedAt as string) ?? "",
  };
}

/** Payload cho POST /api/tours và PUT /api/tours/{id} - khớp BE (multipart/form-data) */
export interface CreateTourRequest {
  title: string;
  description: string;
  provinceId: number;
  price: number;
  durationHours: number;
  maxParticipants: number;
  slug?: string;
  /** BE nhận MultipartFile - gửi File thay vì URL */
  thumbnail?: File;
  /** BE nhận MultipartFile[] - gửi File[] */
  images?: File[];
  artisanId?: number | null;
  /** true khi cần xóa nghệ nhân khỏi tour (chỉ PUT) */
  clearArtisan?: boolean;
  cultureItemIds?: number[];
  preparationTips?: string;
  bestSeason?: string;
  transportation?: string;
  culturalTips?: string;
  status?: "ACTIVE" | "INACTIVE";
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
      | PublicTourDetail[]
      | AdminTour[]
      | {
          tours?: PublicTourDetail[] | AdminTour[];
          content?: PublicTourDetail[] | AdminTour[];
          total?: number;
        }
    >
  >("/api/tours/public", { params });
  const raw = response.data.data;
  let items: (PublicTourDetail | AdminTour | Record<string, unknown>)[] = [];
  let total = 0;
  if (Array.isArray(raw)) {
    items = raw;
    total = items.length;
  } else if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    items =
      (obj.tours as (PublicTourDetail | AdminTour)[]) ??
      (obj.content as (PublicTourDetail | AdminTour)[]) ??
      [];
    total = (obj.total as number) ?? items.length;
  }
  const data = items.map((item) =>
    "provinceId" in item && typeof item.provinceId === "number"
      ? (item as AdminTour)
      : normalizePublicTourDetail(item as PublicTourDetail),
  );
  return { data, total };
};

/** GET /api/tours/public/{id} - Chi tiết tour theo JSON spec */
export const getAdminTourById = async (id: number): Promise<AdminTour> => {
  const response = await api.get<
    ApiResponse<PublicTourDetail | Record<string, unknown>>
  >(`/api/tours/public/${id}`);
  const raw = response.data.data;
  if (!raw || typeof raw !== "object") throw new Error("API không trả về data");
  return normalizePublicTourDetail(raw as PublicTourDetail);
};

/** BE: multipart/form-data - thumbnail (File), images (File[]), cultureItemIds (List) */
function buildTourFormData(
  data: CreateTourRequest | Partial<CreateTourRequest>,
): FormData {
  const form = new FormData();
  const entries: (keyof CreateTourRequest)[] = [
    "provinceId",
    "title",
    "slug",
    "description",
    "bestSeason",
    "transportation",
    "culturalTips",
    "preparationTips",
    "durationHours",
    "maxParticipants",
    "price",
    "artisanId",
  ];
  for (const k of entries) {
    const v = data[k];
    if (v === undefined || v === null) continue;
    if (k === "artisanId" && (v === 0 || v === "0")) continue;
    if (typeof v === "string" && !v.trim()) continue;
    form.append(k, typeof v === "number" ? String(v) : String(v).trim());
  }
  if (data.clearArtisan === true) {
    form.append("clearArtisan", "true");
  }
  if (data.cultureItemIds?.length) {
    data.cultureItemIds.forEach((id) => form.append("cultureItemIds", String(id)));
  }
  if (data.thumbnail instanceof File) {
    form.append("thumbnail", data.thumbnail);
  }
  if (data.images && Array.isArray(data.images)) {
    data.images.forEach((f) => {
      if (f instanceof File) form.append("images", f);
    });
  }
  return form;
}

export const createTour = async (
  data: CreateTourRequest,
): Promise<AdminTour> => {
  const formData = buildTourFormData(data);
  const response = await api.post<
    ApiResponse<PublicTourDetail | Record<string, unknown>>
  >("/api/tours", formData);
  const raw = response.data?.data;
  if (raw && typeof raw === "object") {
    return normalizePublicTourDetail(raw as PublicTourDetail);
  }
  throw new Error("API không trả về data");
};

export const updateTour = async (
  id: number,
  data: Partial<CreateTourRequest>,
): Promise<AdminTour> => {
  const formData = buildTourFormData(data);
  const response = await api.put<
    ApiResponse<PublicTourDetail | Record<string, unknown>>
  >(`/api/tours/${id}`, formData);
  const raw = response.data?.data;
  if (raw && typeof raw === "object") {
    return normalizePublicTourDetail(raw as PublicTourDetail);
  }
  return { id, title: "", provinceId: 0, price: 0, minParticipants: 0, maxParticipants: 0, durationHours: 0, status: "ACTIVE", thumbnailUrl: "", images: [], createdAt: "" } as AdminTour;
};

export const deleteTour = async (id: number): Promise<void> => {
  await api.delete(`/api/tours/${id}`);
};

/** POST /api/tours/{id}/culture-items - Gắn culture items (thay thế toàn bộ, rỗng = xóa hết) */
export const setTourCultureItems = async (
  tourId: number,
  cultureItemIds: number[],
): Promise<void> => {
  const params = new URLSearchParams();
  cultureItemIds.forEach((id) => params.append("cultureItemIds", String(id)));
  const query = params.toString();
  const url = `/api/tours/${tourId}/culture-items${query ? `?${query}` : ""}`;
  await api.post(url);
};

/** DELETE /api/tours/{id}/culture-items/{cultureItemId} - Bỏ 1 culture item khỏi tour */
export const removeTourCultureItem = async (
  tourId: number,
  cultureItemId: number,
): Promise<void> => {
  await api.delete(`/api/tours/${tourId}/culture-items/${cultureItemId}`);
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
  size?: number;
  limit?: number;
  status?: string;
  tourId?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}): Promise<{ data: AdminBooking[]; total: number }> => {
  const { limit, ...rest } = params ?? {};
  const apiParams: Record<string, string | number> = {
    page: rest.page ?? 0,
    size: rest.size ?? limit ?? 10,
  };
  if (rest.status != null && rest.status !== "") apiParams.status = rest.status;
  if (rest.tourId != null) apiParams.tourId = rest.tourId;
  if (rest.startDate) apiParams.startDate = rest.startDate;
  if (rest.endDate) apiParams.endDate = rest.endDate;
  if (rest.search) apiParams.search = rest.search;
  const response = await api.get<unknown>("/api/bookings", { params: apiParams });
  const body = response.data as Record<string, unknown>;
  const raw = body.data ?? body;
  let data = parseBookingResponse(raw);
  let total = data.length;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    total =
      (obj.totalElements as number) ?? (obj.total as number) ?? data.length;
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

/** BE: DELETE /api/bookings/{id} - Hủy booking */
export const cancelBooking = async (id: number): Promise<void> => {
  await api.delete(`/api/bookings/${id}`);
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
  role: "CUSTOMER" | "ADMIN" | "STAFF" | "ARTISAN";
  status: "ACTIVE" | "INACTIVE";
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
  role?: "CUSTOMER" | "ADMIN" | "STAFF" | "ARTISAN";
  status?: "ACTIVE" | "INACTIVE";
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

    // Thêm timestamp để bypass cache và đảm bảo luôn lấy data mới nhất
    const cacheBustParams = {
      ...params,
      _t: Date.now(), // Cache busting parameter
    };

    const response = await api.get<ApiResponse<AdminUser[]>>("/api/users", {
      params: cacheBustParams,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
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
  console.log(`[updateUser] 🚀 Updating user ${id} with data:`, data);
  try {
    const response = await api.put<ApiResponse<AdminUser>>(
      `/api/users/${id}`,
      data,
    );
    console.log(`[updateUser] ✅ Success:`, response.data);
    return response.data.data;
  } catch (error: any) {
    console.error(`[updateUser] ❌ Error updating user ${id}:`, error);
    console.error(`[updateUser] ❌ Request data:`, data);
    console.error(`[updateUser] ❌ Error response:`, error?.response?.data);
    throw error;
  }
};

/** Cập nhật role của user. Backend: PUT /api/admin/users/{id}/role */
export const updateUserRole = async (
  id: number,
  role: "CUSTOMER" | "ADMIN" | "STAFF" | "ARTISAN",
): Promise<AdminUser> => {
  const response = await api.put<ApiResponse<AdminUser>>(
    `/api/admin/users/${id}/role`,
    { role },
  );
  if (!response.data.data) {
    throw new Error("API không trả về data");
  }
  return response.data.data;
};

/** Cập nhật status của user. Backend: PUT /api/admin/users/{id}/status */
export const updateUserStatus = async (
  id: number,
  status: "ACTIVE" | "INACTIVE",
): Promise<AdminUser> => {
  // Đảm bảo payload là object với field "status" là string
  const payload = { status: String(status) };
  console.log(
    `[updateUserStatus] 🚀 Updating user ${id} status to ${status}`,
    payload,
  );
  console.log(`[updateUserStatus] 🚀 Payload JSON:`, JSON.stringify(payload));
  try {
    const response = await api.put<ApiResponse<AdminUser>>(
      `/api/admin/users/${id}/status`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    console.log(`[updateUserStatus] ✅ Success:`, response.data);
    if (!response.data.data) {
      throw new Error("API không trả về data");
    }
    return response.data.data;
  } catch (error: any) {
    console.error(
      `[updateUserStatus] ❌ Error updating user ${id} status:`,
      error,
    );
    console.error(`[updateUserStatus] ❌ Request payload:`, payload);
    console.error(
      `[updateUserStatus] ❌ Request payload JSON:`,
      JSON.stringify(payload),
    );
    console.error(
      `[updateUserStatus] ❌ Error response:`,
      error?.response?.data,
    );
    console.error(
      `[updateUserStatus] ❌ Error response status:`,
      error?.response?.status,
    );
    console.error(
      `[updateUserStatus] ❌ Error response headers:`,
      error?.response?.headers,
    );
    throw error;
  }
};

/** Cập nhật cả role và status của user. Gọi cả 2 API endpoint */
export const updateUserRoleAndStatus = async (
  id: number,
  role: "CUSTOMER" | "ADMIN" | "STAFF" | "ARTISAN",
  status: "ACTIVE" | "INACTIVE",
): Promise<AdminUser> => {
  // Gọi cả 2 API song song để tối ưu performance
  const [, statusResponse] = await Promise.all([
    api.put<ApiResponse<AdminUser>>(`/api/admin/users/${id}/role`, { role }),
    api.put<ApiResponse<AdminUser>>(`/api/admin/users/${id}/status`, {
      status,
    }),
  ]);

  // Trả về response từ status (response cuối cùng, có đầy đủ thông tin)
  if (!statusResponse.data.data) {
    throw new Error("API không trả về data");
  }
  return statusResponse.data.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/api/users/${id}`);
};

/**
 * Admin reset mật khẩu cho user.
 * Theo Swagger BE hiện tại: admin-user-controller có PUT /api/admin/users/{id}/status và /role.
 * Không có reset-password trong Swagger. Thử PUT /api/admin/users/{id}/password
 * (cùng pattern với status, role - admin cập nhật field của user).
 */
export const adminResetUserPassword = async (
  userId: number,
  newPassword: string,
): Promise<void> => {
  await api.put(`/api/admin/users/${userId}/password`, { newPassword });
};

// ========== Admin Culture Items API (Quản lý Nội dung) ==========
// Backend: /api/culture-items - FESTIVAL, FOOD, COSTUME, INSTRUMENT, DANCE, LEGEND, CRAFT
export type CultureCategory =
  | "FESTIVAL"
  | "FOOD"
  | "COSTUME"
  | "INSTRUMENT"
  | "DANCE"
  | "LEGEND"
  | "CRAFT";

export type CultureItemStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface AdminCultureItem {
  id: number;
  title: string;
  description?: string;
  category: CultureCategory;
  provinceId?: number;
  province?: { id: number; name: string; [key: string]: unknown };
  thumbnailUrl?: string;
  images?: string;
  videoUrl?: string;
  status: CultureItemStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCultureItemRequest {
  provinceId: number;
  category: CultureCategory;
  title: string;
  description?: string;
  videoUrl?: string;
  thumbnail?: File;
  images?: File[];
}

export interface UpdateCultureItemRequest {
  provinceId?: number;
  category?: CultureCategory;
  title?: string;
  description?: string;
  videoUrl?: string;
  thumbnail?: File;
  images?: File[];
}

/** Lấy danh sách culture items từ BE */
export const getAdminCultureItems = async (params?: {
  provinceId?: number;
  category?: CultureCategory;
}): Promise<{ data: AdminCultureItem[]; total: number }> => {
  const provincesRes = await api.get<ApiResponse<{ id: number }[]>>(
    "/api/provinces/public",
  );
  const provinces =
    (provincesRes.data?.data as { id: number }[]) ??
    (Array.isArray(provincesRes.data?.data) ? provincesRes.data.data : []);

  let items: AdminCultureItem[] = [];

  if (params?.provinceId != null && params?.category) {
    const res = await api.get<ApiResponse<AdminCultureItem[]>>(
      `/api/culture-items/public/province/${params.provinceId}/category/${params.category}`,
    );
    items = (res.data?.data as AdminCultureItem[]) ?? [];
  } else if (params?.provinceId != null) {
    const res = await api.get<ApiResponse<AdminCultureItem[]>>(
      `/api/culture-items/public/province/${params.provinceId}`,
    );
    items = (res.data?.data as AdminCultureItem[]) ?? [];
  } else if (params?.category) {
    const res = await api.get<ApiResponse<AdminCultureItem[]>>(
      `/api/culture-items/public/category/${params.category}`,
    );
    items = (res.data?.data as AdminCultureItem[]) ?? [];
  } else {
    const results = await Promise.all(
      provinces.map((p) =>
        api.get<ApiResponse<AdminCultureItem[]>>(
          `/api/culture-items/public/province/${p.id}`,
        ),
      ),
    );
    const seen = new Set<number>();
    for (const r of results) {
      const arr = (r.data?.data as AdminCultureItem[]) ?? [];
      for (const item of arr) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          items.push(item);
        }
      }
    }
  }

  return { data: items, total: items.length };
};

export const getAdminCultureItemById = async (
  id: number,
): Promise<AdminCultureItem> => {
  const response = await api.get<ApiResponse<AdminCultureItem>>(
    `/api/culture-items/public/${id}`,
  );
  return response.data.data;
};

export const createCultureItem = async (
  data: CreateCultureItemRequest,
): Promise<AdminCultureItem> => {
  const form = new FormData();
  form.append("provinceId", String(data.provinceId));
  form.append("category", data.category);
  form.append("title", data.title);
  if (data.description) form.append("description", data.description);
  if (data.videoUrl) form.append("videoUrl", data.videoUrl);
  if (data.thumbnail) form.append("thumbnail", data.thumbnail);
  if (data.images?.length) data.images.forEach((f) => form.append("images", f));
  const response = await api.post<ApiResponse<AdminCultureItem>>(
    "/api/culture-items",
    form,
  );
  return response.data.data;
};

export const updateCultureItem = async (
  id: number,
  data: UpdateCultureItemRequest,
): Promise<AdminCultureItem> => {
  const form = new FormData();
  if (data.provinceId != null) form.append("provinceId", String(data.provinceId));
  if (data.category) form.append("category", data.category);
  if (data.title) form.append("title", data.title);
  if (data.description !== undefined) form.append("description", data.description ?? "");
  if (data.videoUrl !== undefined) form.append("videoUrl", data.videoUrl ?? "");
  if (data.thumbnail) form.append("thumbnail", data.thumbnail);
  if (data.images?.length) data.images.forEach((f) => form.append("images", f));
  const response = await api.put<ApiResponse<AdminCultureItem>>(
    `/api/culture-items/${id}`,
    form,
  );
  return response.data.data;
};

export const updateCultureItemStatus = async (
  id: number,
  status: CultureItemStatus,
): Promise<AdminCultureItem> => {
  const response = await api.put<ApiResponse<AdminCultureItem>>(
    `/api/culture-items/${id}/status`,
    null,
    { params: { status } },
  );
  return response.data.data;
};

export const deleteCultureItem = async (id: number): Promise<void> => {
  await api.delete(`/api/culture-items/${id}`);
};

/** @deprecated Dùng getAdminCultureItems */
export const getAdminContent = getAdminCultureItems;

// ========== Admin Feedback API ==========
export interface AdminFeedback {
  id: number;
  name?: string;
  fullName?: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  content?: string;
  status?: "PENDING" | "READ" | "RESOLVED";
  createdAt: string;
  updatedAt?: string;
}

/** GET /api/admin/feedback - Danh sách feedback */
export const getAdminFeedback = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<{ data: AdminFeedback[]; total: number }> => {
  const response = await api.get<
    ApiResponse<
      | AdminFeedback[]
      | { content?: AdminFeedback[]; totalElements?: number; total?: number }
    >
  >("/api/admin/feedback", { params });
  const d = response.data?.data;
  if (!d) return { data: [], total: 0 };
  const data = Array.isArray(d)
    ? d
    : ((d as { content?: AdminFeedback[] }).content ?? []);
  const total = Array.isArray(d)
    ? d.length
    : ((d as { totalElements?: number; total?: number }).totalElements ??
      (d as { total?: number }).total ??
      data.length);
  return { data, total };
};

/** GET /api/admin/feedback/:id - Chi tiết feedback */
export const getAdminFeedbackById = async (
  id: number,
): Promise<AdminFeedback | null> => {
  const response = await api.get<ApiResponse<AdminFeedback>>(
    `/api/admin/feedback/${id}`,
  );
  return response.data?.data ?? null;
};

// ========== Admin Reviews (Feedback Tour) API ==========
/** Review từ GET /api/reviews - đánh giá tour của khách */
export interface AdminReview {
  id: number;
  bookingId: number;
  userId: number;
  userName?: string;
  userAvatar?: string;
  tourId: number;
  tourTitle?: string;
  rating: number;
  comment: string;
  images: string[];
  status?: string; // VISIBLE, HIDDEN, etc.
  createdAt: string;
}

/** GET /api/reviews - Danh sách đánh giá tour (feedback tour) */
export const getAdminReviews = async (): Promise<{
  data: AdminReview[];
  total: number;
}> => {
  const response = await api.get<ApiResponse<AdminReview[]>>("/api/reviews");
  const d = response.data?.data;
  if (!d) return { data: [], total: 0 };
  const data = Array.isArray(d) ? d : [];
  return { data, total: data.length };
};

/** GET /api/reviews/{id} - Chi tiết đánh giá theo ID */
export const getAdminReviewById = async (
  id: number,
): Promise<AdminReview | null> => {
  const response = await api.get<ApiResponse<AdminReview>>(
    `/api/reviews/${id}`,
  );
  return response.data?.data ?? null;
};

/** DELETE /api/reviews/{id} - Xóa đánh giá (Admin auth qua Bearer token) */
export const deleteAdminReview = async (id: number): Promise<void> => {
  await api.delete<ApiResponse<unknown>>(`/api/reviews/${id}`);
};

/** GET /api/reviews/tour/{tourId} - Đánh giá theo tour */
export const getAdminReviewsByTourId = async (
  tourId: number,
): Promise<{ data: AdminReview[]; total: number }> => {
  const response = await api.get<ApiResponse<AdminReview[]>>(
    `/api/reviews/tour/${tourId}`,
  );
  const d = response.data?.data;
  if (!d) return { data: [], total: 0 };
  const data = Array.isArray(d) ? d : [];
  return { data, total: data.length };
};

// ========== Admin Mail API ==========
/** Khớp GET /api/admin/mails - content item */
export interface AdminMail {
  id: number;
  recipientEmail: string;
  subject?: string;
  templateType?: string;
  relatedId?: number | null;
  relatedType?: string | null;
  status: string;
  sentAt: string;
  openedAt?: string | null;
  openedCount?: number | null;
  createdAt: string;
  opened?: boolean;
}

/** Khớp GET /api/admin/mails - data: { totalPages, totalElements, size, content, number, ... } */
interface AdminMailPageResponse {
  totalPages: number;
  totalElements: number;
  size: number;
  content: AdminMail[];
  number: number;
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
  empty?: boolean;
  sort?: { empty?: boolean; sorted?: boolean; unsorted?: boolean };
  pageable?: Record<string, unknown>;
}

/**
 * GET /api/admin/mails - Danh sách email đã gửi
 * Query: recipient, templateType, opened, from, to (yyyy-MM-dd), page, size
 */
export const getAdminMails = async (params?: {
  page?: number;
  size?: number;
  recipient?: string;
  templateType?: string;
  opened?: boolean;
  from?: string;
  to?: string;
}): Promise<{ data: AdminMail[]; total: number }> => {
  const q: Record<string, unknown> = {
    page: params?.page ?? 0,
    size: params?.size ?? 10,
  };
  if (params?.recipient?.trim()) q.recipient = params.recipient.trim();
  if (params?.templateType) q.templateType = params.templateType;
  if (params?.opened === true) q.opened = true;
  if (params?.opened === false) q.opened = false;
  if (params?.from) q.from = params.from;
  if (params?.to) q.to = params.to;
  const response = await api.get<ApiResponse<AdminMailPageResponse>>(
    "/api/admin/mails",
    {
      params: q,
    },
  );
  // response.data = { success, code, message, data, errors, timestamp }
  // response.data.data = { totalPages, totalElements, size, content, number, ... }
  const d = response.data?.data as AdminMailPageResponse | undefined;
  if (!d || typeof d !== "object") return { data: [], total: 0 };
  const content = Array.isArray(d.content) ? d.content : [];
  const total =
    typeof d.totalElements === "number" ? d.totalElements : content.length;
  return { data: content, total };
};

/**
 * GET /api/admin/mails/:id - Chi tiết email log
 * Response: { success, code, message, data: { id, recipientEmail, subject, templateType, relatedId, relatedType, status, sentAt, openedAt, openedCount, createdAt, opened } }
 */
export const getAdminMailById = async (
  id: number,
): Promise<AdminMail | null> => {
  const response = await api.get<ApiResponse<AdminMail>>(
    `/api/admin/mails/${id}`,
  );
  return response.data?.data ?? null;
};

// ========== Admin Lead API ==========
/** Khớp GET /api/admin/leads/{id} - Khách hàng tiềm năng */
export interface AdminLead {
  id: number;
  name: string;
  email: string;
  phone?: string;
  tourId?: number;
  tourTitle?: string;
  message?: string;
  source?: string;
  status?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminLeadPageResponse {
  totalPages?: number;
  totalElements?: number;
  size?: number;
  content: AdminLead[];
  number?: number;
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
  empty?: boolean;
}

/** GET /api/admin/leads - Danh sách lead (phân trang) */
export const getAdminLeads = async (params?: {
  page?: number;
  size?: number;
  status?: string;
  tourId?: number;
}): Promise<{ data: AdminLead[]; total: number }> => {
  const q: Record<string, unknown> = {
    page: params?.page ?? 0,
    size: params?.size ?? 10,
  };
  if (params?.status) q.status = params.status;
  if (params?.tourId != null) q.tourId = params.tourId;
  const response = await api.get<ApiResponse<AdminLeadPageResponse>>(
    "/api/admin/leads",
    {
      params: q,
    },
  );
  const d = response.data?.data as AdminLeadPageResponse | undefined;
  if (!d || typeof d !== "object") return { data: [], total: 0 };
  const content = Array.isArray(d.content) ? d.content : [];
  const total =
    typeof d.totalElements === "number" ? d.totalElements : content.length;
  return { data: content, total };
};

/** GET /api/admin/leads/:id - Chi tiết lead */
export const getAdminLeadById = async (
  id: number,
): Promise<AdminLead | null> => {
  const response = await api.get<ApiResponse<AdminLead>>(
    `/api/admin/leads/${id}`,
  );
  return response.data?.data ?? null;
};

/** PUT /api/admin/leads/:id - Cập nhật status, adminNote */
export const updateAdminLead = async (
  id: number,
  data: { status?: string; adminNote?: string },
): Promise<AdminLead | null> => {
  const response = await api.put<ApiResponse<AdminLead>>(
    `/api/admin/leads/${id}`,
    data,
  );
  return response.data?.data ?? null;
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
  ethnicity?: string;
  dateOfBirth?: string;
  images?: string | string[];
  heroSubtitle?: string;
  narrativeContent?: string;
  panoramaImageUrl?: string;
  totalTours?: number;
  averageRating?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** POST /api/artisans - Tạo nghệ nhân mới - khớp backend request/response */
export interface CreateArtisanRequest {
  userId: number;
  fullName: string;
  specialization: string;
  bio?: string;
  profileImageUrl?: string;
  provinceId?: number;
  province?: { id: number };
  workshopAddress?: string;
  ethnicity?: string;
  dateOfBirth?: string;
  images?: string | string[];
  heroSubtitle?: string;
  narrativeContent?: string;
  panoramaImageUrl?: string;
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
  ethnicity?: string;
  dateOfBirth?: string;
  images?: string | string[];
  heroSubtitle?: string;
  narrativeContent?: string;
  panoramaImageUrl?: string;
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

/** Chi tiết đầy đủ nghệ nhân (narrative, relatedTours, relatedCultureItems). GET /api/artisans/public/{id}/detail */
export interface AdminArtisanDetail {
  id: number;
  fullName: string;
  specialization: string;
  bio: string;
  profileImageUrl: string;
  heroSubtitle: string;
  ethnicity: string;
  age: number;
  location: string;
  images: string[];
  panoramaImageUrl: string | null;
  narrativeContent: { title: string; content: string; imageUrl?: string }[];
  relatedTours: {
    id: number;
    title: string;
    slug: string;
    thumbnailUrl: string;
    location: string;
    description: string;
    price: number;
  }[];
  relatedCultureItems: {
    id: number;
    title: string;
    thumbnailUrl: string;
    description: string;
  }[];
  otherArtisans: { id: number; fullName: string; profileImageUrl: string }[];
}

export const getAdminArtisanDetail = async (
  id: number,
): Promise<AdminArtisanDetail> => {
  const response = await api.get<ApiResponse<AdminArtisanDetail>>(
    `/api/artisans/public/${id}/detail`,
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
  // Đảm bảo id là number và hợp lệ
  const artisanId = Number(id);
  if (isNaN(artisanId) || artisanId <= 0) {
    throw new Error(`Invalid artisan ID: ${id}`);
  }

  console.log(
    `[updateArtisan] 🚀 Updating artisan ${artisanId} (type: ${typeof artisanId}) with data:`,
    data,
  );
  console.log(`[updateArtisan] 🚀 Request URL: /api/artisans/${artisanId}`);

  try {
    const response = await api.put<ApiResponse<AdminArtisan>>(
      `/api/artisans/${artisanId}`,
      data,
    );
    console.log(`[updateArtisan] ✅ Success:`, response.data);
    return response.data.data;
  } catch (error: any) {
    console.error(
      `[updateArtisan] ❌ Error updating artisan ${artisanId}:`,
      error,
    );
    console.error(`[updateArtisan] ❌ Request URL: /api/artisans/${artisanId}`);
    console.error(`[updateArtisan] ❌ Request data:`, data);
    console.error(`[updateArtisan] ❌ Error response:`, error?.response?.data);
    console.error(
      `[updateArtisan] ❌ Error response status:`,
      error?.response?.status,
    );
    throw error;
  }
};

/**
 * Xóa nghệ nhân. Backend: DELETE /api/artisans/{id}
 * Response: { success: true, code, message, data: {}, errors: {}, timestamp }
 */
export const deleteArtisan = async (id: number): Promise<void> => {
  const artisanId = Number(id);
  if (isNaN(artisanId) || artisanId <= 0) {
    throw new Error(`Invalid artisan ID: ${id}`);
  }
  await api.delete(`/api/artisans/${artisanId}`);
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
      | {
          content?: AdminLearnQuiz[];
          quizzes?: AdminLearnQuiz[];
          total?: number;
        }
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
          else if (
            opt["is-correct"] !== undefined &&
            opt["is-correct"] !== null
          ) {
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
export type TourScheduleStatus =
  | "SCHEDULED"
  | "CANCELLED"
  | "COMPLETED"
  | string;

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
  startTime?:
    | { hour: number; minute: number; second?: number; nano?: number }
    | string; // API có thể trả về "HH:mm:ss" hoặc object
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
    total =
      (obj.totalElements as number) ?? (obj.total as number) ?? data.length;
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
  date?: string,
): Promise<AdminTourSchedule[]> => {
  const params = date ? { date } : undefined;
  const response = await api.get<
    TourScheduleApiResponse<
      AdminTourSchedule[] | { content?: AdminTourSchedule[] }
    >
  >(`/api/tour-schedules/tour/${tourId}`, { params });
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

/** Chuyển startTime (object hoặc string) thành "HH:mm" cho BE @RequestParam */
function startTimeToHHmm(st: TourScheduleStartTime | string | undefined): string {
  if (!st) return "08:00";
  if (typeof st === "string") {
    const parts = st.trim().split(":");
    return `${(parts[0] ?? "08").padStart(2, "0")}:${(parts[1] ?? "00").padStart(2, "0")}`;
  }
  const h = st.hour ?? 8;
  const m = st.minute ?? 0;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** BE dùng @RequestParam - gửi params trong query string */
export const createTourSchedule = async (
  data: CreateTourScheduleRequest,
): Promise<AdminTourSchedule> => {
  const params = new URLSearchParams();
  params.append("tourId", String(data.tourId));
  params.append("tourDate", data.tourDate);
  params.append("startTime", startTimeToHHmm(data.startTime));
  params.append("maxSlots", String(data.maxSlots));
  params.append("currentPrice", String(data.currentPrice));
  if (data.discountPercent != null && data.discountPercent > 0) {
    params.append("discountPercent", String(data.discountPercent));
  }
  if (data.status) params.append("status", data.status);
  const response = await api.post<TourScheduleApiResponse<AdminTourSchedule>>(
    `/api/tour-schedules?${params.toString()}`,
  );
  const body = response.data;
  if (!body.data) throw new Error("API không trả về data");
  return body.data;
};

/** BE dùng @RequestParam - gửi params trong query string, startTime format "HH:mm" */
export const updateTourSchedule = async (
  id: number,
  data: UpdateTourScheduleRequest,
): Promise<AdminTourSchedule> => {
  const params: Record<string, string | number | undefined> = {};
  if (data.tourDate != null) params.tourDate = data.tourDate;
  if (data.startTime != null) params.startTime = startTimeToHHmm(data.startTime);
  if (data.maxSlots != null) params.maxSlots = data.maxSlots;
  if (data.currentPrice != null) params.currentPrice = data.currentPrice;
  if (data.discountPercent != null) params.discountPercent = data.discountPercent;
  if (data.status != null) params.status = data.status;
  const response = await api.put<TourScheduleApiResponse<AdminTourSchedule>>(
    `/api/tour-schedules/${id}`,
    null,
    { params },
  );
  const body = response.data;
  if (!body.data) throw new Error("API không trả về data");
  return body.data;
};

export const deleteTourSchedule = async (id: number): Promise<void> => {
  await api.delete(`/api/tour-schedules/${id}`);
};

// ========== Admin Dashboard API ==========
/** GET /api/admin/dashboard/summary - Tổng quan dashboard */
export interface DashboardSummary {
  fromDate: string;
  toDate: string;
  users: {
    total: number;
    newInRange: number;
    byStatus?: Record<string, number>;
  };
  tours: {
    total: number;
    active: number;
  };
  tourSchedules: {
    total: number;
    upcoming: number;
    byStatus?: Record<string, number>;
  };
  bookings: {
    total: number;
    newInRange: number;
    completed: number;
    cancelled: number;
  };
  payments: {
    total: number;
    newInRange: number;
    byStatus?: Record<string, number>;
    totalRevenue: number;
    revenueInRange: number;
  };
  reviews: {
    total: number;
    newInRange: number;
    byStatus?: Record<string, number>;
    averageRating: number;
  };
  content: {
    blogPostsTotal: number;
    blogPostsByStatus?: Record<string, number>;
    videosTotal: number;
    videosByStatus?: Record<string, number>;
    cultureItemsTotal: number;
    cultureItemsByStatus?: Record<string, number>;
    userMemoriesTotal: number;
    userMemoriesByStatus?: Record<string, number>;
  };
  notifications: {
    total: number;
    newInRange: number;
    unread: number;
  };
}

export const getDashboardSummary = async (params?: {
  fromDate?: string;
  toDate?: string;
}): Promise<DashboardSummary> => {
  const response = await api.get<ApiResponse<DashboardSummary>>(
    "/api/admin/dashboard/summary",
    { params },
  );
  return response.data.data;
};

/** @deprecated Dùng getDashboardSummary thay thế */
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
