import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Breadcrumbs from "../../../components/Breadcrumbs";
import { getApiErrorMessage, getLessonById, getModuleById } from "../../../services/api";
import {
  completeLesson,
  followArtisan,
  unfollowArtisan,
  getLessonUserStatus,
  getModuleUserProgress,
  likeLesson,
  unlikeLesson,
  saveLesson,
  unsaveLesson,
} from "../../../services/learnApi";
import type { LearnLesson, LearnModule } from "../../../types";
import "../../../styles/features/learn/_learn-public.scss";

interface ContentSection {
  title: string;
  content: string;
}

interface VocabularyItem {
  term: string;
  definition: string;
}

function parseSections(json: string): ContentSection[] {
  if (!json?.trim()) return [];
  if (json.trim().startsWith("<")) return [{ title: "", content: json }];
  try {
    const parsed = JSON.parse(json);
    // Handle {sections: [{heading, text}]} format from API
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && Array.isArray(parsed.sections)) {
      return parsed.sections.map((x: Record<string, unknown>) => ({
        title: (x?.heading as string) ?? (x?.title as string) ?? "",
        content: (x?.text as string) ?? (x?.content as string) ?? "",
      }));
    }
    // Handle direct array format [{title, content}]
    if (Array.isArray(parsed)) {
      return parsed.map((x) => ({
        title: (x?.title as string) ?? (x?.heading as string) ?? "",
        content: (x?.content as string) ?? (x?.text as string) ?? "",
      }));
    }
    return [{ title: "", content: json }];
  } catch {
    return [{ title: "", content: json }];
  }
}

function parseVocabulary(json: string): VocabularyItem[] {
  if (!json?.trim()) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => ({
        term: typeof x?.term === "string" ? x.term : "",
        definition: typeof x?.definition === "string" ? x.definition : "",
      }))
      .filter((x) => x.term || x.definition);
  } catch {
    return [];
  }
}

function parseQuickNotes(json?: string): string[] {
  if (!json?.trim()) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function youtubeEmbed(url?: string): string | null {
  if (!url) return null;
  const watch = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/)([\w-]{11})/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}?rel=0`;
  const short = url.match(/youtu\.be\/([\w-]{11})/);
  if (short) return `https://www.youtube.com/embed/${short[1]}?rel=0`;
  return null;
}

export default function LessonPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const lessonId = Number(params.get("id"));
  const moduleIdFromQuery = Number(params.get("moduleId"));

  const [lesson, setLesson] = useState<LearnLesson | null>(null);
  const [module, setModule] = useState<LearnModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // User actions state (cập nhật sau khi gọi API)
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<number>>(new Set());
  const [actionLoading, setActionLoading] = useState<"like" | "save" | "follow" | "complete" | null>(null);

  useEffect(() => {
    if (!lessonId || Number.isNaN(lessonId)) {
      setLoading(false);
      setError("Thiếu lesson id.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    getLessonById(lessonId)
      .then(async (lessonData) => {
        if (cancelled) return;
        setLesson(lessonData);
        const mid = moduleIdFromQuery || lessonData.moduleId;
        if (mid) {
          const moduleData = await getModuleById(mid);
          if (!cancelled) setModule(moduleData);
        }
        if (localStorage.getItem("accessToken")) {
          try {
            const [status, progress] = await Promise.all([
              getLessonUserStatus(lessonId),
              mid ? getModuleUserProgress(mid).catch(() => null) : Promise.resolve(null),
            ]);
            if (!cancelled) {
              setIsLiked(status.isLiked);
              setIsSaved(status.isSaved);
              setIsFollowing(status.isFollowingArtisan);
              setIsCompleted(status.isCompleted);
              setProgressPercent(status.progressPercent > 0 ? status.progressPercent : null);
              if (progress) setCompletedLessonIds(new Set(progress.completedLessonIds));
            }
          } catch {
            // Guest/error — giữ state mặc định
          }
        }
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [lessonId, moduleIdFromQuery]);

  const sections = useMemo(() => (lesson ? parseSections(lesson.contentJson) : []), [lesson]);
  const vocabulary = useMemo(() => (lesson ? parseVocabulary(lesson.vocabularyJson) : []), [lesson]);
  const embedUrl = useMemo(() => youtubeEmbed(lesson?.videoUrl), [lesson?.videoUrl]);
  const lessons = useMemo(
    () => [...(module?.lessons ?? [])].sort((a, b) => a.orderIndex - b.orderIndex),
    [module?.lessons],
  );
  const notes = useMemo(() => parseQuickNotes(module?.quickNotesJson), [module?.quickNotesJson]);
  const currentIndex = useMemo(
    () => lessons.findIndex((l) => l.id === lesson?.id),
    [lessons, lesson?.id],
  );

  const hasAuth = !!localStorage.getItem("accessToken");

  const handleLike = async () => {
    if (!hasAuth || actionLoading) return;
    setActionLoading("like");
    try {
      // BE trả về ApiResponse<boolean>: data = trạng thái mới (true = đã like, false = đã bỏ like)
      const newVal = isLiked ? await unlikeLesson(lesson.id) : await likeLesson(lesson.id);
      setIsLiked(newVal);
    } catch {
      // Lỗi — bỏ qua
    } finally {
      setActionLoading(null);
    }
  };

  const handleSave = async () => {
    if (!hasAuth || actionLoading) return;
    setActionLoading("save");
    try {
      // BE trả về ApiResponse<boolean>: data = trạng thái mới (true = đã lưu, false = đã bỏ lưu)
      const newVal = isSaved ? await unsaveLesson(lesson.id) : await saveLesson(lesson.id);
      setIsSaved(newVal);
    } catch {
      // Lỗi — bỏ qua
    } finally {
      setActionLoading(null);
    }
  };

  const handleFollow = async () => {
    if (!hasAuth || !lesson.author?.id || actionLoading) return;
    setActionLoading("follow");
    try {
      const newVal = isFollowing ? await unfollowArtisan(lesson.author.id) : await followArtisan(lesson.author.id);
      setIsFollowing(isFollowing ? false : newVal);
    } catch {
      // Guest hoặc lỗi — bỏ qua
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async () => {
    if (!hasAuth || actionLoading || isCompleted) return;
    setActionLoading("complete");
    try {
      await completeLesson(lesson.id);
      setIsCompleted(true);
      setProgressPercent(100);
      setCompletedLessonIds((prev) => new Set([...prev, lesson.id]));
    } catch {
      // Guest hoặc lỗi
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="learn-public__state">Đang tải bài học...</div>;
  if (error || !lesson) return <div className="learn-public__state">{error || "Không tải được bài học."}</div>;

  const totalInModule = lesson.totalLessonsInModule || lessons.length;
  const progressPct = progressPercent ?? ((currentIndex + 1) / Math.max(1, totalInModule)) * 100;
  const difficultyLabel =
    lesson.difficulty === "BASIC" ? "Cơ bản" : lesson.difficulty === "INTERMEDIATE" ? "Trung bình" : "Nâng cao";

  const breadcrumb = [
    { label: "Học nhanh", path: "/learn" },
    module ? { label: module.title, path: `/learn/${module.id}` } : { label: lesson.categoryName || "Module" },
    { label: `Bài ${lesson.orderIndex}: ${lesson.title}` },
  ];

  return (
    <div className="learn-public lesson-page">
      {/* Hero — ảnh lên trên cùng, full width, bo góc, ko viền */}
      <div className="learn-hero-wrap">
        <section className="lesson-hero">
          {embedUrl ? (
            <div className="lesson-hero__video">
              <iframe
                src={embedUrl}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <img
              src={lesson.imageUrl || module?.thumbnailUrl || "/nen.png"}
              alt={lesson.title}
              className="lesson-hero__image"
              onError={(e) => { (e.target as HTMLImageElement).src = "/nen.png"; }}
            />
          )}
        </section>
      </div>

      {/* White — breadcrumbs, title, author */}
      <section className="learn-section learn-section--white">
        <div className="learn-public__container">
          <Breadcrumbs items={breadcrumb} />
          <h1 className="lesson-page__title">{lesson.title}</h1>
          <section className="lesson-author">
            <div className="lesson-author__left">
              {lesson.author?.profileImageUrl ? (
                <img
                  src={lesson.author.profileImageUrl}
                  alt={lesson.author.fullName || "Nghệ nhân"}
                  className="lesson-author__avatar"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.onerror = null;
                    img.style.display = "none";
                  }}
                />
              ) : (
                <span className="lesson-author__avatar-placeholder">👤</span>
              )}
              <div className="lesson-author__info">
                <strong className="lesson-author__name">
                  Nghệ nhân {lesson.author?.fullName || "Ẩn danh"}
                </strong>
                <span className="lesson-author__meta">
                  {(lesson.viewsCount ?? 0).toLocaleString("vi-VN")} lượt xem
                </span>
              </div>
              {lesson.author?.id && (
                <button
                  type="button"
                  className={`lesson-author__follow ${isFollowing ? "lesson-author__follow--active" : ""}`}
                  onClick={handleFollow}
                  disabled={actionLoading === "follow"}
                >
                  {isFollowing ? "Đang theo dõi" : "+ Theo dõi"}
                </button>
              )}
            </div>
            <div className="lesson-author__actions">
              <button
                type="button"
                className={`lesson-author__action ${isLiked ? "lesson-author__action--liked" : ""}`}
                onClick={handleLike}
                disabled={actionLoading === "like"}
              >
                {isLiked ? "❤️" : "🤍"} Thích
              </button>
              <button
                type="button"
                className={`lesson-author__action ${isSaved ? "lesson-author__action--saved" : ""}`}
                onClick={handleSave}
                disabled={actionLoading === "save"}
              >
                {isSaved ? "🔖" : "📑"} Lưu để xem sau
              </button>
              <button type="button" className="lesson-author__action">↗ Chia sẻ</button>
            </div>
          </section>
        </div>
      </section>

      {/* Section 2: white — Objective */}
      <section className="learn-section learn-section--white">
        <div className="learn-public__container">
          <section className="lesson-objective">
            <div className="lesson-objective__top">
              <div className="lesson-objective__left">
                <h3 className="lesson-objective__heading">Mục tiêu bài học</h3>
                <p className="lesson-objective__text">{lesson.objectiveText || "Tìm hiểu kiến thức cơ bản"}</p>
              </div>
              <div className="lesson-objective__tags">
                <span className="lesson-objective__tag">{difficultyLabel}</span>
                <span className="lesson-objective__tag">{lesson.estimatedMinutes} phút</span>
              </div>
            </div>
            <div className="lesson-objective__progress">
              <span>
                {isCompleted ? "✓ Đã hoàn thành" : `Tiến độ: ${currentIndex + 1}/${totalInModule} bài`}
              </span>
              <div className="lesson-objective__bar">
                <div className="lesson-objective__bar-fill" style={{ width: `${Math.min(100, progressPct)}%` }} />
              </div>
            </div>
            {hasAuth && !isCompleted && (
              <button
                type="button"
                className="learn-btn lesson-objective__complete-btn"
                onClick={handleComplete}
                disabled={actionLoading === "complete"}
              >
                {actionLoading === "complete" ? "Đang xử lý..." : "Đánh dấu hoàn thành"}
              </button>
            )}
          </section>
        </div>
      </section>

      {/* Section 3: paper-bg — Content + Vocabulary */}
      <section className="learn-section learn-section--paper">
        <div className="learn-public__container">
          <section className="lesson-twin-cards">
            {sections.length > 0 && (
              <div className="lesson-twin-card">
                <h2 className="lesson-twin-card__title">Tóm tắt nội dung</h2>
                {sections.map((section, idx) => (
                  <div key={idx} className="lesson-twin-card__section">
                    {section.title && <h4>{section.title}</h4>}
                    {section.content.trim().startsWith("<") ? (
                      <div dangerouslySetInnerHTML={{ __html: section.content }} />
                    ) : (
                      <p>{section.content}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {vocabulary.length > 0 && (
              <div className="lesson-twin-card">
                <h2 className="lesson-twin-card__title">Từ vựng & Khái niệm</h2>
                <div className="lesson-vocab-list">
                  {vocabulary.map((item, idx) => (
                    <div key={idx} className="lesson-vocab-item">
                      <strong>{item.term}</strong>
                      <p>{item.definition}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </section>

      {/* Section 4: white — Notes + Related lessons */}
      <section className="learn-section learn-section--white">
        <div className="learn-public__container">
          <section className="lesson-bottom">
            <div className="lesson-bottom__left">
              {notes.length > 0 && (
                <div className="lesson-notes">
                  <h2 className="lesson-notes__title">Ghi chú nhanh</h2>
                  <ol className="lesson-notes__list">
                    {notes.map((note, idx) => <li key={idx}>{note}</li>)}
                  </ol>
                  {(module?.culturalEtiquetteTitle || module?.culturalEtiquetteText) && (
                    <div className="lesson-notes__tip">
                      <span className="lesson-notes__tip-icon">💡</span>
                      <div>
                        <strong>{module?.culturalEtiquetteTitle || "Điều nên lưu ý khi tham gia nghi lễ"}</strong>
                        <p>{module?.culturalEtiquetteText}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="lesson-bottom__right">
              {lessons.filter((l) => l.id !== lesson.id).slice(0, 3).map((item) => {
                const completed = completedLessonIds.has(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`lesson-sidebar-card ${completed ? "lesson-sidebar-card--completed" : ""}`}
                    onClick={() => navigate(`/lesson?id=${item.id}&moduleId=${module?.id ?? lesson.moduleId}`)}
                  >
                    <img
                      src={item.thumbnailUrl || "/nen.png"}
                      alt={item.title}
                      onError={(e) => { (e.target as HTMLImageElement).src = "/nen.png"; }}
                    />
                    <div className="lesson-sidebar-card__info">
                      <h4>{item.title}</h4>
                      <span>{item.duration ?? 0} phút</span>
                      {completed && (
                        <div className="lesson-sidebar-card__progress">
                          <div className="lesson-sidebar-card__progress-bar">
                            <div className="lesson-sidebar-card__progress-fill" style={{ width: "100%" }} />
                          </div>
                          <span className="lesson-sidebar-card__progress-label">100%</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </section>

      {/* White — Quiz CTA */}
      {module?.quizPrompt && (
        <section className="learn-section learn-section--white">
          <div className="learn-public__container">
            <section className="lesson-quiz-cta">
              <h2>Sẵn sàng kiểm tra kiến thức?</h2>
              <p>Hoàn thành {module.quizPrompt.totalQuestions} câu hỏi để củng cố kiến thức vừa học.</p>
              <button
                type="button"
                className="learn-btn"
                onClick={() => navigate(`/learn/${module.id}/quiz`, { state: { quizId: module.quizPrompt?.id } })}
              >
                Làm Quiz ngay
              </button>
            </section>
          </div>
        </section>
      )}
    </div>
  );
}
