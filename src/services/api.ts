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
  Lead,
  LeadRequest,
} from "../types";

// API Base Configuration
// Must use ngrok URL directly - backend requires auth and redirects to OAuth2/Google.
// Vite proxy cannot bypass this CORS requirement.
export const API_BASE_URL = "https://legally-actual-mollusk.ngrok-free.app/";

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
    // FormData: bỏ Content-Type để browser/axios tự set multipart/form-data + boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"];
    }
    const skipAuth = (config as { skipAuth?: boolean }).skipAuth;
    if (!skipAuth) {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
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

// ========== Session cache (1 lần fetch, lưu đến khi đóng tab) ==========
// Cache không hết hạn trong session - chỉ load 1 lần mỗi endpoint
const cache = new Map<string, unknown>();
const inFlight = new Map<string, Promise<unknown>>();

export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = cache.get(key) as T | undefined;
  if (cached !== undefined) return cached;

  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = fetcher()
    .then((data) => {
      cache.set(key, data);
      inFlight.delete(key);
      return data;
    })
    .catch((err) => {
      inFlight.delete(key);
      throw err;
    });
  inFlight.set(key, promise);
  return promise;
}

/** Xóa cache (gọi sau khi admin sửa data nếu cần). */
export function clearApiCache(): void {
  cache.clear();
  inFlight.clear();
}

// ========== Home API ==========
export const getHomePageData = async (
  limit = 10,
): Promise<HomePageResponse> => {
  const key = `home:${limit}`;
  return cachedFetch(key, async () => {
    const response = await api.get<ApiResponse<HomePageResponse>>(
      `/api/public/home?limit=${limit}`,
    );
    const data = response.data.data;
    // Đồng bộ vào cache con - tránh gọi lại provinces, blogPosts, videos
    if (data.provinces?.length) cache.set("provinces", data.provinces);
    if (data.blogPosts?.length) cache.set("blogPosts", data.blogPosts);
    if (data.videos?.length) cache.set("videos", data.videos);
    return data;
  });
};

// ========== Provinces API ==========
export const getProvinces = async (): Promise<Province[]> => {
  return cachedFetch("provinces", async () => {
    const response = await api.get<ApiResponse<Province[]>>(
      "/api/provinces/public",
      { skipAuth: true } as object,
    );
    return response.data.data;
  });
};

export const getProvinceById = async (id: number): Promise<Province> => {
  return cachedFetch(`province:id:${id}`, async () => {
    const response = await api.get<ApiResponse<Province>>(
      `/api/provinces/public/${id}`,
      { skipAuth: true } as object,
    );
    return response.data.data;
  });
};

export const getProvinceBySlug = async (slug: string): Promise<Province> => {
  return cachedFetch(`province:slug:${slug}`, async () => {
    const response = await api.get<ApiResponse<Province>>(
      `/api/provinces/public/slug/${slug}`,
      { skipAuth: true } as object,
    );
    return response.data.data;
  });
};

// ========== Tours API ==========
export const getTours = async (): Promise<Tour[]> => {
  return cachedFetch("tours", async () => {
    const response = await api.get<ApiResponse<Tour[]>>("/api/tours/public");
    return response.data.data;
  });
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
  return cachedFetch("publicTours", async () => {
    const response =
      await api.get<ApiResponse<PublicTourResponse[]>>("/api/tours/public");
    const raw = response.data.data ?? [];
    return raw.map((item) => ({
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
  });
};

export const getTourById = async (id: number): Promise<Tour> => {
  return cachedFetch(`tour:${id}`, async () => {
    const response = await api.get<ApiResponse<Record<string, unknown>>>(
      `/api/tours/public/${id}`,
    );
    const raw = response.data.data ?? {};
    return normalizeTour(raw);
  });
};

export const getToursByProvince = async (
  provinceId: number,
): Promise<Tour[]> => {
  return cachedFetch(`tours:province:${provinceId}`, async () => {
    const response = await api.get<ApiResponse<Array<Record<string, unknown>>>>(
      `/api/tours/public/province/${provinceId}`,
    );
    const rawList = response.data.data ?? [];
    return rawList.map((r) => normalizeTour(r));
  });
};

// ========== Tour Highlights & Culture Items (per tour) ==========
export const getTourHighlights = async (
  tourId: number,
): Promise<CultureItem[]> => {
  return cachedFetch(`tour:${tourId}:highlights`, async () => {
    const response = await api.get<ApiResponse<CultureItem[]>>(
      `/api/tours/public/${tourId}/highlights`,
    );
    return response.data.data;
  });
};

export const getTourCultureItems = async (
  tourId: number,
): Promise<CultureItem[]> => {
  return cachedFetch(`tour:${tourId}:cultureItems`, async () => {
    const response = await api.get<ApiResponse<CultureItem[]>>(
      `/api/tours/public/${tourId}/culture-items`,
    );
    return response.data.data;
  });
};

// ========== Reviews API ==========
/** GET /api/reviews - Lấy tất cả reviews (dùng cho homepage) */
export const getReviews = async (): Promise<Review[]> => {
  return cachedFetch("reviews:all", async () => {
    const response = await api.get<ApiResponse<Review[]>>("/api/reviews");
    return response.data.data ?? [];
  });
};

export const getTourReviews = async (tourId: number): Promise<Review[]> => {
  return cachedFetch(`reviews:tour:${tourId}`, async () => {
    const response = await api.get<ApiResponse<Review[]>>(
      `/api/reviews/tour/${tourId}`,
    );
    return response.data.data;
  });
};

// ========== Culture Items API ==========
export const getCultureItems = async (): Promise<CultureItem[]> => {
  return cachedFetch("cultureItems", async () => {
    const response = await api.get<ApiResponse<CultureItem[]>>(
      "/api/culture-items/public",
    );
    return response.data.data;
  });
};

export const getCultureItemById = async (id: number): Promise<CultureItem> => {
  return cachedFetch(`cultureItem:${id}`, async () => {
    const response = await api.get<ApiResponse<CultureItem>>(
      `/api/culture-items/public/${id}`,
    );
    return response.data.data;
  });
};

export const getCultureItemsByProvince = async (
  provinceId: number,
): Promise<CultureItem[]> => {
  return cachedFetch(`cultureItems:province:${provinceId}`, async () => {
    const response = await api.get<ApiResponse<CultureItem[]>>(
      `/api/culture-items/public/province/${provinceId}`,
    );
    return response.data.data;
  });
};

// ========== Artisans API ==========
export const getArtisans = async (): Promise<Artisan[]> => {
  return cachedFetch("artisans", async () => {
    const response = await api.get<ApiResponse<Artisan[]>>(
      "/api/artisans/public",
    );
    return response.data.data;
  });
};

export const getArtisanById = async (id: number): Promise<Artisan> => {
  return cachedFetch(`artisan:${id}`, async () => {
    const response = await api.get<ApiResponse<Artisan>>(
      `/api/artisans/public/${id}`,
    );
    return response.data.data;
  });
};

// ========== Blog Posts API ==========
export const getBlogPosts = async (): Promise<BlogPost[]> => {
  return cachedFetch("blogPosts", async () => {
    const response = await api.get<ApiResponse<BlogPost[]>>(
      "/api/blog-posts/public",
    );
    return response.data.data;
  });
};

export const getBlogPostById = async (id: number): Promise<BlogPost> => {
  return cachedFetch(`blogPost:${id}`, async () => {
    const response = await api.get<ApiResponse<BlogPost>>(
      `/api/blog-posts/public/${id}`,
    );
    return response.data.data;
  });
};

// ========== Videos API ==========
export const getVideos = async (): Promise<Video[]> => {
  return cachedFetch("videos", async () => {
    const response = await api.get<ApiResponse<Video[]>>("/api/videos/public");
    return response.data.data;
  });
};

export const getVideoById = async (id: number): Promise<Video> => {
  return cachedFetch(`video:${id}`, async () => {
    const response = await api.get<ApiResponse<Video>>(
      `/api/videos/public/${id}`,
    );
    return response.data.data;
  });
};

// ========== Learn (public) ==========
export const getPublicLessons = async (): Promise<LearnModuleLesson[]> => {
  return cachedFetch("learn:publicLessons", async () => {
    const response = await api.get<ApiResponse<LearnModuleLesson[]>>(
      "/api/learn/public/lessons",
    );
    return response.data.data ?? [];
  });
};

export const getLearnCategories = async (): Promise<LearnCategory[]> => {
  return cachedFetch("learn:categories", async () => {
    const response = await api.get<ApiResponse<LearnCategory[]>>(
      "/api/learn/public/categories",
    );
    return response.data.data ?? [];
  });
};

export const getLearnModules = async (
  categoryId?: number,
): Promise<LearnModule[]> => {
  const key = categoryId
    ? `learn:modules:category:${categoryId}`
    : "learn:modules";
  return cachedFetch(key, async () => {
    const url = categoryId
      ? `/api/learn/public/modules?categoryId=${categoryId}`
      : "/api/learn/public/modules";
    const response = await api.get<ApiResponse<LearnModule[]>>(url);
    return response.data.data ?? [];
  });
};

export const getModuleById = async (id: number): Promise<LearnModule> => {
  return cachedFetch(`learn:module:${id}`, async () => {
    const response = await api.get<ApiResponse<LearnModule>>(
      `/api/learn/public/modules/${id}`,
    );
    return response.data.data;
  });
};

export const getLessonById = async (id: number): Promise<LearnLesson> => {
  return cachedFetch(`learn:lesson:${id}`, async () => {
    const response = await api.get<ApiResponse<LearnLesson>>(
      `/api/learn/public/lessons/${id}`,
    );
    return response.data.data;
  });
};

export const getQuizById = async (id: number): Promise<LearnQuiz> => {
  return cachedFetch(`learn:quiz:${id}`, async () => {
    const response = await api.get<ApiResponse<LearnQuiz>>(
      `/api/learn/public/quizzes/${id}`,
    );
    return response.data.data;
  });
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

// ========== AI Chat API ==========
export interface AIChatResponse {
  success: boolean;
  code: number;
  message: string;
  data: { reply: string };
  errors?: object;
  timestamp: string;
}

export const sendAIChatMessage = async (content: string): Promise<string> => {
  const response = await api.post<AIChatResponse>("/api/ai-chat/messages", {
    content,
  });
  const data = response.data.data;
  if (!data?.reply) throw new Error("Không nhận được phản hồi từ AI.");
  return data.reply;
};

// ========== Leads API (public, no auth) ==========
export interface LeadApiResponse {
  success: boolean;
  code: number;
  message: string;
  data: Lead;
  errors?: object;
  timestamp: string;
}

export const submitLead = async (payload: LeadRequest): Promise<Lead> => {
  const body: Record<string, unknown> = {
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    message: payload.message ?? "",
    source: "WEBSITE",
  };
  if (payload.tourId != null && payload.tourId > 0) {
    body.tourId = payload.tourId;
  }
  const response = await api.post<LeadApiResponse>("/api/leads", body);
  return response.data.data;
};

export default api;
