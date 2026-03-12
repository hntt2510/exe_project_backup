import axios from "axios";
import type {
  ApiResponse,
  HomePageResponse,
  Province,
  Tour,
  CultureItem,
  Artisan,
  BlogPost,
  Video,
  Review,
  LearnQuiz,
  LearnModule,
  LearnModuleLesson,
  LearnLesson,
  LearnCategory,
  LearnUserStats,
} from "../types";

// API Base Configuration
// Must use ngrok URL directly - backend requires auth and redirects to OAuth2/Google.
// Vite proxy cannot bypass this CORS requirement.
export const API_BASE_URL = "https://exe-1-k8ma.onrender.com/";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
  timeout: 60000, // Render.com free tier cold start can be slow
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    console.log(`[API] 🚀 ${config.method?.toUpperCase()} ${config.url}`);
    const token = localStorage.getItem("accessToken");
    if (token) {
      // axios types: headers can be undefined
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for token refresh and error handling
api.interceptors.response.use(
  (response) => {
    console.log(`[API] ✅ ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error("[API] ❌ Error:", error.response?.data || error.message);
    return Promise.reject(error);
  },
);

/** Lấy thông báo lỗi thân thiện từ response API hoặc axios (dùng cho UI). */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
    if (error.response?.status === 500)
      return "Lỗi máy chủ. Vui lòng thử lại sau.";
    if (error.response?.status)
      return `Lỗi ${error.response.status}. Vui lòng thử lại.`;
  }
  return error instanceof Error ? error.message : "Đã xảy ra lỗi.";
}

// ========== In-memory cache (load 1 lần, dùng chung) ==========
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 phút
const cache = new Map<string, { data: unknown; ts: number }>();
const ENABLE_API_CACHE = !import.meta.env.DEV;

function getCached<T>(key: string): T | undefined {
  if (!ENABLE_API_CACHE) return undefined;
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  return entry.data as T;
}

function setCached(key: string, data: unknown): void {
  if (!ENABLE_API_CACHE) return;
  cache.set(key, { data, ts: Date.now() });
}

/** Xóa cache (gọi sau khi admin sửa data nếu cần). */
export function clearApiCache(): void {
  cache.clear();
}

// ========== Home API ==========
export const getHomePageData = async (
  limit = 10,
): Promise<HomePageResponse> => {
  const key = `home:${limit}`;
  const cached = getCached<HomePageResponse>(key);
  if (cached !== undefined) return cached;
  const response = await api.get<ApiResponse<HomePageResponse>>(
    `/api/public/home?limit=${limit}`,
  );
  const data = response.data.data;
  setCached(key, data);
  return data;
};

// ========== Provinces API ==========
export const getProvinces = async (): Promise<Province[]> => {
  const key = "provinces";
  const cached = getCached<Province[]>(key);
  if (cached !== undefined) return cached;
  const response = await api.get<ApiResponse<Province[]>>(
    "/api/provinces/public",
  );
  const data = response.data.data;
  setCached(key, data);
  return data;
};

export const getProvinceById = async (id: number): Promise<Province> => {
  const key = `province:id:${id}`;
  const cached = getCached<Province>(key);
  if (cached !== undefined) return cached;
  const response = await api.get<ApiResponse<Province>>(
    `/api/provinces/public/${id}`,
  );
  const data = response.data.data;
  setCached(key, data);
  return data;
};

export const getProvinceBySlug = async (slug: string): Promise<Province> => {
  const key = `province:slug:${slug}`;
  const cached = getCached<Province>(key);
  if (cached !== undefined) return cached;
  const response = await api.get<ApiResponse<Province>>(
    `/api/provinces/public/slug/${slug}`,
  );
  const data = response.data.data;
  setCached(key, data);
  return data;
};

// ========== Tours API ==========
export const getTours = async (): Promise<Tour[]> => {
  const key = "tours";
  const cached = getCached<Tour[]>(key);
  if (cached !== undefined) return cached;
  const response = await api.get<ApiResponse<Tour[]>>("/api/tours/public");
  const data = response.data.data;
  setCached(key, data);
  return data;
};

type PublicTourResponse = {
  id: number;
  province?: {
    id: number;
    name: string;
  };
  title: string;
  slug: string;
  description: string;
  bestSeason?: string;
  transportation?: string;
  culturalTips?: string;
  durationHours?: number;
  maxParticipants: number;
  price: number;
  thumbnailUrl: string;
  images?: string | string[];
  artisan?: {
    id: number;
    fullName?: string;
  };
  averageRating?: number;
  totalBookings?: number;
  status?: string;
  createdAt?: string;
};

const parseTourImages = (images?: string | string[]): string[] => {
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
    .map((item) => item.trim())
    .filter(Boolean);
};

/** Chuẩn hóa Tour từ API (hỗ trợ nested province/artisan) */
function normalizeTour(raw: Record<string, unknown>): Tour {
  const province = raw.province as { id?: number; name?: string } | undefined;
  const artisan = raw.artisan as { id?: number; fullName?: string } | undefined;
  return {
    id: raw.id as number,
    provinceId: (raw.provinceId as number) ?? province?.id ?? 0,
    provinceName: (raw.provinceName as string) ?? province?.name,
    title: raw.title as string,
    slug: raw.slug as string,
    description: raw.description as string,
    bestSeason: raw.bestSeason as string | undefined,
    transportation: raw.transportation as string | undefined,
    culturalTips: raw.culturalTips as string | undefined,
    durationHours: raw.durationHours as number | undefined,
    maxParticipants: (raw.maxParticipants as number) ?? 0,
    price: raw.price as number,
    thumbnailUrl: raw.thumbnailUrl as string,
    images: parseTourImages(raw.images as string | string[]),
    artisanId: (raw.artisanId as number) ?? artisan?.id,
    artisanName: (raw.artisanName as string) ?? artisan?.fullName,
    averageRating: (raw.averageRating as number) ?? 0,
    totalReviews: (raw.totalReviews as number) ?? 0,
    totalBookings: raw.totalBookings as number | undefined,
    status: raw.status as string | undefined,
    createdAt: (raw.createdAt as string) ?? "",
    updatedAt: (raw.updatedAt as string) ?? (raw.createdAt as string) ?? "",
  };
}

export const getPublicTours = async (): Promise<Tour[]> => {
  const key = "publicTours";
  const cached = getCached<Tour[]>(key);
  if (cached !== undefined) return cached;
  const response =
    await api.get<ApiResponse<PublicTourResponse[]>>("/api/tours/public");
  const raw = response.data.data ?? [];
  const data = raw.map((item) => ({
    id: item.id,
    provinceId: item.province?.id ?? 0,
    provinceName: item.province?.name,
    title: item.title,
    slug: item.slug,
    description: item.description,
    bestSeason: item.bestSeason,
    transportation: item.transportation,
    culturalTips: item.culturalTips,
    durationHours: item.durationHours,
    maxParticipants: item.maxParticipants ?? 0,
    price: item.price,
    thumbnailUrl: item.thumbnailUrl,
    images: parseTourImages(item.images),
    artisanId: item.artisan?.id,
    artisanName: item.artisan?.fullName,
    averageRating: item.averageRating ?? 0,
    totalReviews: 0,
    totalBookings: item.totalBookings,
    createdAt: item.createdAt ?? "",
    updatedAt: item.createdAt ?? "",
  }));
  setCached(key, data);
  return data;
};

export const getTourById = async (id: number): Promise<Tour> => {
  const key = `tour:${id}`;
  const cached = getCached<Tour>(key);
  if (cached !== undefined) return cached;
  const response = await api.get<ApiResponse<Record<string, unknown>>>(
    `/api/tours/public/${id}`,
  );
  const raw = response.data.data ?? {};
  const data = normalizeTour(raw);
  setCached(key, data);
  return data;
};

export const getToursByProvince = async (
  provinceId: number,
): Promise<Tour[]> => {
  const key = `tours:province:${provinceId}`;
  const cached = getCached<Tour[]>(key);
  if (cached !== undefined) return cached;
  const response = await api.get<
    ApiResponse<Array<Record<string, unknown>>>
  >(`/api/tours/public/province/${provinceId}`);
  const rawList = response.data.data ?? [];
  const data = rawList.map((r) => normalizeTour(r));
  setCached(key, data);
  return data;
};

// ========== Tour Highlights & Culture Items (per tour) ==========
export const getTourHighlights = async (
  tourId: number,
): Promise<CultureItem[]> => {
  const key = `tour:${tourId}:highlights`;
  const cached = getCached<CultureItem[]>(key);
  if (cached !== undefined) return cached;
  const response = await api.get<ApiResponse<CultureItem[]>>(
    `/api/tours/public/${tourId}/highlights`,
  );
  const data = response.data.data;
  setCached(key, data);
  return data;
};

export const getTourCultureItems = async (
  tourId: number,
): Promise<CultureItem[]> => {
  const key = `tour:${tourId}:cultureItems`;
  const cached = getCached<CultureItem[]>(key);
  if (cached !== undefined) return cached;
  const response = await api.get<ApiResponse<CultureItem[]>>(
    `/api/tours/public/${tourId}/culture-items`,
  );
  const data = response.data.data;
  setCached(key, data);
  return data;
};

// ========== Reviews API ==========
export const getTourReviews = async (tourId: number): Promise<Review[]> => {
  const key = `reviews:tour:${tourId}`;
  const cached = getCached<Review[]>(key);
  if (cached !== undefined) return cached;
  const response = await api.get<ApiResponse<Review[]>>(
    `/api/reviews/tour/${tourId}`,
  );
  const data = response.data.data;
  setCached(key, data);
  return data;
};

// ========== Culture Items API ==========
export const getCultureItems = async (): Promise<CultureItem[]> => {
  const key = "cultureItems";
  const cached = getCached<CultureItem[]>(key);
  if (cached !== undefined) return cached;
  const response = await api.get<ApiResponse<CultureItem[]>>(
    "/api/culture-items/public",
  );
  const data = response.data.data;
  setCached(key, data);
  return data;
};

export const getCultureItemById = async (id: number): Promise<CultureItem> => {
  const key = `cultureItem:${id}`;
  const cached = getCached<CultureItem>(key);
  if (cached !== undefined) return cached;
  const response = await api.get<ApiResponse<CultureItem>>(
    `/api/culture-items/public/${id}`,
  );
  const data = response.data.data;
  setCached(key, data);
  return data;
};

export const getCultureItemsByProvince = async (
  provinceId: number,
): Promise<CultureItem[]> => {
  const key = `cultureItems:province:${provinceId}`;
  const cached = getCached<CultureItem[]>(key);
  if (cached !== undefined) return cached;
  const response = await api.get<ApiResponse<CultureItem[]>>(
    `/api/culture-items/public/province/${provinceId}`,
  );
  const data = response.data.data;
  setCached(key, data);
  return data;
};

// ========== Artisans API ==========
export const getArtisans = async (): Promise<Artisan[]> => {
  const key = "artisans";
  const cached = getCached<Artisan[]>(key);
  if (cached !== undefined) return cached;
  const response = await api.get<ApiResponse<Artisan[]>>(
    "/api/artisans/public",
  );
  const data = response.data.data;
  setCached(key, data);
  return data;
};

export const getArtisanById = async (id: number): Promise<Artisan> => {
  const key = `artisan:${id}`;
  const cached = getCached<Artisan>(key);
  if (cached !== undefined) return cached;
  const response = await api.get<ApiResponse<Artisan>>(
    `/api/artisans/public/${id}`,
  );
  const data = response.data.data;
  setCached(key, data);
  return data;
};

// ========== Blog Posts API ==========
export const getBlogPosts = async (): Promise<BlogPost[]> => {
  const key = "blogPosts";
  const cached = getCached<BlogPost[]>(key);
  if (cached !== undefined) return cached;
  const response = await api.get<ApiResponse<BlogPost[]>>(
    "/api/blog-posts/public",
  );
  const data = response.data.data;
  setCached(key, data);
  return data;
};

export const getBlogPostById = async (id: number): Promise<BlogPost> => {
  const key = `blogPost:${id}`;
  const cached = getCached<BlogPost>(key);
  if (cached !== undefined) return cached;
  const response = await api.get<ApiResponse<BlogPost>>(
    `/api/blog-posts/public/${id}`,
  );
  const data = response.data.data;
  setCached(key, data);
  return data;
};

// ========== Videos API ==========
export const getVideos = async (): Promise<Video[]> => {
  const key = "videos";
  const cached = getCached<Video[]>(key);
  if (cached !== undefined) return cached;
  const response = await api.get<ApiResponse<Video[]>>("/api/videos/public");
  const data = response.data.data;
  setCached(key, data);
  return data;
};

export const getVideoById = async (id: number): Promise<Video> => {
  const key = `video:${id}`;
  const cached = getCached<Video>(key);
  if (cached !== undefined) return cached;
  const response = await api.get<ApiResponse<Video>>(
    `/api/videos/public/${id}`,
  );
  const data = response.data.data;
  setCached(key, data);
  return data;
};

// ========== Learn (public) ==========
export const getPublicLessons = async (): Promise<LearnModuleLesson[]> => {
  const key = "learn:publicLessons";
  const cached = getCached<LearnModuleLesson[]>(key);
  if (cached !== undefined) return cached;
  const response = await api.get<ApiResponse<LearnModuleLesson[]>>(
    "/api/learn/public/lessons",
  );
  const data = response.data.data ?? [];
  setCached(key, data);
  return data;
};

export const getLearnCategories = async (): Promise<LearnCategory[]> => {
  const key = "learn:categories";
  const cached = getCached<LearnCategory[]>(key);
  if (cached !== undefined) return cached;
  const response = await api.get<ApiResponse<LearnCategory[]>>(
    "/api/learn/public/categories",
  );
  const data = response.data.data ?? [];
  setCached(key, data);
  return data;
};

export const getLearnModules = async (
  categoryId?: number
): Promise<LearnModule[]> => {
  const key = categoryId
    ? `learn:modules:category:${categoryId}`
    : "learn:modules";
  const cached = getCached<LearnModule[]>(key);
  if (cached !== undefined) return cached;
  const url = categoryId
    ? `/api/learn/public/modules?categoryId=${categoryId}`
    : "/api/learn/public/modules";
  const response = await api.get<ApiResponse<LearnModule[]>>(url);
  const data = response.data.data ?? [];
  setCached(key, data);
  return data;
};

export const getModuleById = async (id: number): Promise<LearnModule> => {
  const key = `learn:module:${id}`;
  const cached = getCached<LearnModule>(key);
  if (cached !== undefined) return cached;
  const response = await api.get<ApiResponse<LearnModule>>(
    `/api/learn/public/modules/${id}`,
  );
  const data = response.data.data;
  setCached(key, data);
  return data;
};

export const getLessonById = async (id: number): Promise<LearnLesson> => {
  const key = `learn:lesson:${id}`;
  const cached = getCached<LearnLesson>(key);
  if (cached !== undefined) return cached;
  const response = await api.get<ApiResponse<LearnLesson>>(
    `/api/learn/public/lessons/${id}`,
  );
  const data = response.data.data;
  setCached(key, data);
  return data;
};

export const getQuizById = async (id: number): Promise<LearnQuiz> => {
  const key = `learn:quiz:${id}`;
  const cached = getCached<LearnQuiz>(key);
  if (cached !== undefined) return cached;
  const response = await api.get<ApiResponse<LearnQuiz>>(
    `/api/learn/public/quizzes/${id}`,
  );
  const data = response.data.data;
  setCached(key, data);
  return data;
};

// ========== Learn user stats (requires auth) ==========
export const getLearnUserStats = async (): Promise<LearnUserStats | null> => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    const response = await api.get<
      ApiResponse<{
        totalLessonsCompleted: number;
        averageScore: number | string;
        learningStreak: number;
        totalCoursesCompleted: number;
        overallLearningProgressPercent: number;
        featuredCourses: LearnModule[];
      }>
    >("/api/learn/users/me/stats");
    const raw = response.data.data;
    if (!raw) return null;
    return {
      ...raw,
      averageScore:
        typeof raw.averageScore === "number"
          ? raw.averageScore
          : parseFloat(String(raw.averageScore ?? 0)) || 0,
    };
  } catch {
    return null;
  }
};

export default api;
