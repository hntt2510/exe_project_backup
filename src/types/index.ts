// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  errors?: object;
  timestamp: string;
}

// Province
export interface Province {
  id: number;
  name: string;
  slug: string;
  region: string;
  latitude: number;
  longitude: number;
  description: string;
  thumbnailUrl: string;
  isActive: boolean;
  bestSeason?: string;
  transportation?: string;
  culturalTips?: string;
  createdAt: string;
  updatedAt: string;
}

// Tour
export interface Tour {
  id: number;
  provinceId: number;
  provinceName?: string;
  title: string;
  slug: string;
  description: string;
  /** Thời điểm đẹp nhất (e.g. "Tháng 10 - Tháng 3 mùa khô") */
  bestSeason?: string;
  /** Cách di chuyển đến vùng (e.g. "Xe máy, xe khách từ Pleiku") */
  transportation?: string;
  /** Lưu ý ứng xử văn hoá */
  culturalTips?: string;
  durationHours?: number;
  maxParticipants: number;
  price: number;
  thumbnailUrl: string;
  images: string[];
  artisanId?: number;
  artisanName?: string;
  averageRating: number;
  totalReviews: number;
  totalBookings?: number;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

// Culture Item
export interface CultureItem {
  id: number;
  province?: {
    id: number;
    name: string;
    slug: string;
    region: string;
    latitude: number;
    longitude: number;
    thumbnailUrl: string;
    description: string;
    isActive: boolean;
    bestSeason?: string;
    transportation?: string;
    culturalTips?: string;
  };
  provinceId?: number;
  provinceName?: string;
  category: CultureCategory;
  title: string;
  description: string;
  thumbnailUrl: string;
  images: string | string[];
  videoUrl?: string;
  status?: string;
  createdAt: string;
  updatedAt?: string;
}

export type CultureCategory =
  | "FESTIVAL"
  | "FOOD"
  | "COSTUME"
  | "INSTRUMENT"
  | "DANCE"
  | "LEGEND"
  | "CRAFT";

// Artisan
export interface Artisan {
  id: number;
  userId: number;
  fullName: string;
  specialization: string;
  bio: string;
  profileImageUrl: string;
  images: string[];
  provinceId?: number;
  provinceName?: string;
  workshopAddress?: string;
  averageRating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
}

// Public Artisan (from /api/artisans/public)
export interface PublicArtisanProvince {
  id: number;
  name: string;
  slug: string;
  region: string;
  latitude: number;
  longitude: number;
  thumbnailUrl: string;
  description: string;
  isActive: boolean;
  bestSeason: string;
  transportation: string;
  culturalTips: string;
}

export interface PublicArtisan {
  id: number;
  user: User;
  fullName: string;
  specialization: string;
  bio: string;
  province: PublicArtisanProvince;
  workshopAddress: string;
  profileImageUrl: string;
  totalTours: number;
  averageRating: number;
  isActive: boolean;
  createdAt: string;
}

// Blog Post
export interface BlogPostProvince {
  id: number;
  name: string;
  slug: string;
  region?: string;
  description?: string;
  bestSeason?: string;
  transportation?: string;
  culturalTips?: string;
}

export interface BlogPost {
  id: number;
  authorId?: number;
  authorName?: string;
  title: string;
  slug: string;
  content: string;
  blocksJson?: string;
  featuredImageUrl: string;
  provinceId?: number;
  provinceName?: string;
  province?: BlogPostProvince;
  images?: string; // comma-separated URLs
  status: string;
  viewCount?: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// Video
export interface Video {
  id: number;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  provinceId?: number;
  provinceName?: string;
  cultureItemId?: number;
  status: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

// User Memory
export interface UserMemory {
  id: number;
  userId: number;
  userName?: string;
  title: string;
  description: string;
  images: string[];
  audioUrl?: string;
  videoUrl?: string;
  provinceId?: number;
  provinceName?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Review
export interface Review {
  id: number;
  userId: number;
  userName?: string;
  userAvatar?: string;
  bookingId: number;
  tourId: number;
  tourTitle?: string;
  rating: number;
  comment: string;
  images: string[];
  createdAt: string;
}

// Lead (POST /api/leads)
export interface LeadRequest {
  name: string;
  email: string;
  phone: string;
  tourId?: number;
  message?: string;
  source: string;
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  tourId: number;
  tourTitle?: string;
  message?: string;
  source: string;
  status: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

// Home Page Response
export interface HomePageResponse {
  provinces: Province[];
  featuredTours: Tour[];
  cultureItems: CultureItem[];
  artisans: Artisan[];
  blogPosts: BlogPost[];
  videos: Video[];
  userMemories: UserMemory[];
}

// Tour Schedule
export interface TourScheduleStartTime {
  hour: number;
  minute: number;
  second: number;
  nano: number;
}

export interface TourSchedule {
  id: number;
  tourId: number;
  tourDate: string;
  startTime: TourScheduleStartTime | string;
  maxSlots: number;
  bookedSlots: number;
  availableSlots: number;
  currentPrice: number | null;
  discountPercent: number | null;
  status: "SCHEDULED" | "CANCELLED" | "COMPLETED" | "FULL";
}

// User
export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  role: "CUSTOMER" | "ADMIN" | "STAFF" | "ARTISAN";
  status: string;
  createdAt: string;
}

// Auth
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ========== Learn (public) ==========
export type LearnQuizDifficulty = "BASIC" | "INTERMEDIATE" | "ADVANCED";

export interface LearnQuizOption {
  id: number;
  label: string;
  optionText: string;
  isCorrect?: boolean;
}

export interface LearnQuizQuestion {
  id: number;
  questionText: string;
  hintText: string;
  orderIndex: number;
  options: LearnQuizOption[];
}

export interface LearnQuiz {
  id: number;
  moduleId: number;
  title: string;
  timeLimitMinutes: number;
  difficulty: LearnQuizDifficulty;
  objective: string;
  rules: string[];
  totalQuestions: number;
  questions: LearnQuizQuestion[];
}

// GET /api/learn/public/modules
export interface LearnModuleLesson {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
  duration: number;
  videoUrl: string;
  orderIndex: number;
}

// GET /api/learn/public/categories
export interface LearnCategory {
  id: number;
  name: string;
  slug: string;
  orderIndex: number;
}

export interface LearnQuizPrompt {
  id: number;
  title: string;
  totalQuestions: number;
  timeLimitMinutes: number;
}

export interface LearnSuggestedTour {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
  location: string;
  description: string;
  price: number;
}

export interface LearnModule {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
  categoryId?: number;
  categoryName?: string;
  categorySlug?: string;
  quickNotesJson?: string;
  culturalEtiquetteTitle?: string;
  culturalEtiquetteText?: string;
  lessonsCount?: number;
  durationMinutes?: number;
  lessons?: LearnModuleLesson[];
  quizPrompt?: LearnQuizPrompt;
  suggestedTours?: LearnSuggestedTour[];
}

// User learn stats (GET /api/learn/users/me/stats)
export interface LearnUserStats {
  totalLessonsCompleted: number;
  averageScore: number;
  learningStreak: number;
  totalCoursesCompleted: number;
  overallLearningProgressPercent: number;
  featuredCourses: LearnModule[];
}

// GET /api/learn/public/lessons/{id}
export type LearnLessonDifficulty = "BASIC" | "INTERMEDIATE" | "ADVANCED";

export interface LearnLessonAuthor {
  id: number;
  fullName: string;
  profileImageUrl: string;
}

export interface LearnLesson {
  id: number;
  title: string;
  slug: string;
  imageUrl: string;
  contentJson: string;
  vocabularyJson: string;
  objectiveText: string;
  difficulty: LearnLessonDifficulty;
  estimatedMinutes: number;
  videoUrl: string;
  viewsCount: number;
  orderIndex: number;
  totalLessonsInModule: number;
  author?: LearnLessonAuthor;
  moduleId: number;
  moduleTitle: string;
  categoryName: string;
}

// ── Artisan Detail (GET /api/artisans/public/{id}/detail) ──

export interface ArtisanNarrativeBlock {
  title: string;
  content: string;
  imageUrl?: string;
}

export interface ArtisanRelatedTour {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
  location: string;
  description: string;
  price: number;
}

export interface ArtisanRelatedCulture {
  id: number;
  title: string;
  thumbnailUrl: string;
  description: string;
}

export interface ArtisanOther {
  id: number;
  fullName: string;
  profileImageUrl: string;
}

export interface ArtisanDetail {
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
  narrativeContent: ArtisanNarrativeBlock[];
  relatedTours: ArtisanRelatedTour[];
  relatedCultureItems: ArtisanRelatedCulture[];
  otherArtisans: ArtisanOther[];
}
