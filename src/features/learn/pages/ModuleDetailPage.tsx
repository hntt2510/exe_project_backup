import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import Breadcrumbs from "../../../components/Breadcrumbs";
import LoginRequiredModal from "../../../components/LoginRequiredModal";
import { getApiErrorMessage, getModuleById } from "../../../services/api";
import { getModuleUserProgress } from "../../../services/learnApi";
import type { LearnModule } from "../../../types";
import "../../../styles/features/learn/_learn-public.scss";

function hasAuthToken(): boolean {
  return !!localStorage.getItem("accessToken");
}

function parseQuickNotes(json?: string): string[] {
  if (!json?.trim()) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

export default function ModuleDetailPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [module, setModule] = useState<LearnModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<number>>(new Set());
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginModalRedirect, setLoginModalRedirect] = useState<string>("");

  useEffect(() => {
    const id = Number(moduleId);
    if (!id || Number.isNaN(id)) {
      setError("Module không hợp lệ.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    getModuleById(id)
      .then(async (data) => {
        if (!cancelled) setModule(data);
        if (data && localStorage.getItem("accessToken")) {
          try {
            const progress = await getModuleUserProgress(id);
            if (!cancelled) setCompletedLessonIds(new Set(progress.completedLessonIds));
          } catch {
            // Guest / lỗi
          }
        }
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  const notes = useMemo(() => parseQuickNotes(module?.quickNotesJson), [module?.quickNotesJson]);
  const lessons = useMemo(
    () => [...(module?.lessons ?? [])].sort((a, b) => a.orderIndex - b.orderIndex),
    [module?.lessons]
  );

  if (loading) {
    return <div className="learn-public__state">Đang tải module...</div>;
  }

  if (error || !module) {
    return (
      <div className="learn-public__state">
        {error || "Không tìm thấy module."}{" "}
        <Link to="/learn" className="learn-link">
          Quay lại
        </Link>
      </div>
    );
  }

  const sectionMotion = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 0.5 },
  };

  return (
    <div className="learn-public module-detail">
      {/* Hero — ảnh lên trên cùng, bo góc, ko viền */}
      <motion.div
        className="learn-hero-wrap"
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="md-hero__image-wrap">
          <img
            src={module.thumbnailUrl || "/nen.png"}
            alt={module.title}
            className="md-hero__image"
            onError={(e) => { (e.target as HTMLImageElement).src = "/nen.png"; }}
          />
        </div>
      </motion.div>

      {/* White — breadcrumbs, info */}
      <motion.section
        className="learn-section learn-section--white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="learn-public__container">
          <Breadcrumbs
            items={[
              { label: "Học nhanh", path: "/learn" },
              { label: module.categoryName || "Danh mục" },
              { label: module.title },
            ]}
          />
          <div className="md-hero__info">
            <span className="md-hero__badge">{module.categoryName || "Module"}</span>
            <h1 className="md-hero__title">{module.title}</h1>
            <p className="md-hero__meta">
              {module.lessonsCount ?? lessons.length} bài <span>•</span> {module.durationMinutes ?? 0} phút
            </p>
            {module.quizPrompt && (
              <button
                type="button"
                className="learn-btn md-hero__cta"
                onClick={() => {
                  const path = `/learn/${module.id}/quiz`;
                  if (hasAuthToken()) {
                    navigate(path, { state: { quizId: module.quizPrompt?.id } });
                  } else {
                    setLoginModalRedirect(path);
                    setLoginModalOpen(true);
                  }
                }}
              >
                Làm Quiz ngay
              </button>
            )}
          </div>
        </div>
      </motion.section>

      {/* Paper — chỉ 1 lần ở giữa: Ghi chú + Danh sách bài học */}
      <motion.section
        className="learn-section learn-section--paper"
        {...sectionMotion}
      >
        <div className="learn-public__container">
          <div className="md-body">
            {notes.length > 0 && (
              <div className="md-card">
                <h2 className="md-card__title">Ghi chú nhanh</h2>
                <ol className="md-card__list">
                  {notes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ol>
              </div>
            )}

            <div className="md-card">
              <h2 className="md-card__title">Danh sách bài học</h2>
              <div className="md-lesson-list">
                {lessons.map((lesson) => {
                  const isCompleted = completedLessonIds.has(lesson.id);
                  const lessonPath = `/lesson?id=${lesson.id}&moduleId=${module.id}`;
                  const handleLessonClick = () => {
                    if (hasAuthToken()) {
                      navigate(lessonPath);
                    } else {
                      setLoginModalRedirect(lessonPath);
                      setLoginModalOpen(true);
                    }
                  };
                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      className={`md-lesson-item ${isCompleted ? "md-lesson-item--completed" : ""}`}
                      onClick={handleLessonClick}
                    >
                      <img
                        src={lesson.thumbnailUrl || "/nen.png"}
                        alt={lesson.title}
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.onerror = null;
                          img.src = "/nen.png";
                        }}
                      />
                      <div className="md-lesson-item__info">
                        <h4>{lesson.title}</h4>
                        <span>{lesson.duration ?? 0} phút</span>
                        {isCompleted && (
                          <div className="md-lesson-item__progress">
                            <div className="md-lesson-item__progress-bar">
                              <div className="md-lesson-item__progress-fill" style={{ width: "100%" }} />
                            </div>
                            <span className="md-lesson-item__progress-label">100% hoàn thành</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* White — Văn hóa */}
      {(module.culturalEtiquetteTitle || module.culturalEtiquetteText) && (
        <motion.section
          className="learn-section learn-section--white"
          {...sectionMotion}
        >
          <div className="learn-public__container">
            <div className="md-culture">
              <div className="md-card">
                <h2 className="md-card__title">{module.culturalEtiquetteTitle || "Lưu ý văn hóa"}</h2>
                <p className="md-card__text">{module.culturalEtiquetteText}</p>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      <LoginRequiredModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        redirectPath={loginModalRedirect}
        content="Vui lòng đăng nhập để xem bài học và làm quiz."
      />
    </div>
  );
}
