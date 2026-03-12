/**
 * LessonDetailPage – Trang chi tiết module + bài học
 *
 * Luồng API:
 *   1) GET /api/learn/public/modules/{moduleId}  → lấy module + mảng lessons[]
 *   2) GET /api/learn/public/lessons/{lessonId}   → lấy nội dung bài học cụ thể
 *   3) Khi ấn bài khác ở sidebar → gọi lại (2) với lessonId mới
 */
import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import Breadcrumbs from '../Breadcrumbs';
import {
  LessonHero,
  LessonHeader,
  LessonObjectives,
  LessonSummary,
  LessonVocabulary,
  LessonQuickNotes,
  LessonQuizCTA,
  RelatedTours,
} from '../learn';
import { getModuleById, getLessonById, getPublicLessons, getApiErrorMessage } from '../../services/api';
import { toggleLessonLike, toggleLessonSave, toggleFollowArtisan, completeLesson } from '../../services/learnApi';
import type { LearnModule, LearnLesson, LearnModuleLesson, Tour } from '../../types';
import '../../styles/components/lessonDetailPagescss/_lesson-detail-page.scss';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function parseSections(json: string): { title: string; content: string }[] {
  if (!json || json.trim() === '') return [];
  if (json.trim().startsWith('<')) {
    return [{ title: '', content: json }];
  }
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((x): x is Record<string, unknown> => x != null && typeof x === 'object')
        .map((x) => ({
          title: typeof x.title === 'string' ? x.title : '',
          content: typeof x.content === 'string' ? x.content : '',
        }));
    }
    return [];
  } catch {
    return [{ title: '', content: json }];
  }
}

function parseVocabulary(json: string): { term: string; definition: string }[] {
  if (!json || json.trim() === '') return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is Record<string, unknown> => x != null && typeof x === 'object')
      .map((x) => ({
        term: typeof x.term === 'string' ? x.term : '',
        definition: typeof x.definition === 'string' ? x.definition : '',
      }))
      .filter((x) => x.term || x.definition);
  } catch {
    return [];
  }
}

function parseQuickNotes(json: string): string[] {
  if (!json || json.trim() === '') return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string')
      : [];
  } catch {
    return [];
  }
}

/** duration từ BE là phút (estimatedMinutes) */
function formatDurationFromMinutes(minutes: number): string {
  if (!minutes || minutes < 1) return '0:00';
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return s > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${m} phút`;
}

/** Trích video ID từ YouTube URL (watch, youtu.be, embed) */
function getYoutubeVideoId(url: string): string | null {
  if (!url?.trim()) return null;
  const u = url.trim();
  const watchMatch = u.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  const shortMatch = u.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  return null;
}

// ---------------------------------------------------------------------------
// LessonSidebar – danh sách bài học trong module
// ---------------------------------------------------------------------------
interface LessonSidebarProps {
  lessons: LearnModuleLesson[];
  activeLessonId: number | null;
  onSelectLesson: (id: number) => void;
  sectionTitle?: string;
}

function LessonSidebar({ lessons, activeLessonId, onSelectLesson, sectionTitle }: LessonSidebarProps) {
  const sorted = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="lesson-sidebar">
      {sectionTitle && (
        <h3 className="lesson-sidebar__section-title">{sectionTitle}</h3>
      )}
      {sorted.map((lesson) => (
        <button
          key={lesson.id}
          type="button"
          className={`lesson-sidebar__card ${lesson.id === activeLessonId ? 'lesson-sidebar__card--active' : ''}`}
          onClick={() => onSelectLesson(lesson.id)}
        >
          <img
            src={lesson.thumbnailUrl || '/nen.png'}
            alt={lesson.title}
            className="lesson-sidebar__thumbnail"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/nen.png';
            }}
          />
          <div className="lesson-sidebar__info">
            <h4 className="lesson-sidebar__title">{lesson.title}</h4>
            {(lesson.duration ?? 0) > 0 && (
              <div className="lesson-sidebar__duration">
                <Clock size={14} />
                <span>{formatDurationFromMinutes(lesson.duration ?? 0)}</span>
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function LessonDetailPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const selectLessonIdFromState = (location.state as { selectLessonId?: number })?.selectLessonId;

  const [module, setModule] = useState<LearnModule | null>(null);
  const [allPublicLessons, setAllPublicLessons] = useState<LearnModuleLesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<LearnLesson | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<number | null>(selectLessonIdFromState ?? null);
  const [loading, setLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = Number(moduleId);
    if (!id || isNaN(id)) {
      setError('Module không hợp lệ.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchModule = getModuleById(id)
      .then((data) => {
        if (cancelled) return;
        setModule(data);
        const sortedLessons = [...(data.lessons ?? [])].sort(
          (a, b) => a.orderIndex - b.orderIndex,
        );
        if (selectLessonIdFromState && sortedLessons.some((l) => l.id === selectLessonIdFromState)) {
          setActiveLessonId(selectLessonIdFromState);
        } else if (sortedLessons.length > 0) {
          setActiveLessonId(sortedLessons[0].id);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err) || 'Không tải được module.');
      });

    const fetchLessons = getPublicLessons()
      .then((data) => {
        if (!cancelled) setAllPublicLessons(data);
      })
      .catch(() => {});

    Promise.all([fetchModule, fetchLessons]).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [moduleId, selectLessonIdFromState]);

  useEffect(() => {
    if (!activeLessonId) return;

    let cancelled = false;
    setLessonLoading(true);

    getLessonById(activeLessonId)
      .then((data) => {
        if (!cancelled) setActiveLesson(data);
      })
      .catch((err) => {
        if (!cancelled) console.error('[LessonDetail] Lesson fetch error:', err);
      })
      .finally(() => {
        if (!cancelled) setLessonLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeLessonId]);

  const moduleLessons = module?.lessons ?? [];
  const relatedTours: Tour[] =
    (module?.suggestedTours ?? []).map((t) => ({
      id: t.id,
      provinceId: 0,
      provinceName: t.location,
      title: t.title,
      slug: t.slug,
      description: t.description ?? '',
      bestSeason: undefined,
      transportation: undefined,
      culturalTips: undefined,
      durationHours: undefined,
      maxParticipants: 0,
      price: t.price,
      thumbnailUrl: t.thumbnailUrl ?? '/nen.png',
      images: [],
      artisanId: undefined,
      artisanName: undefined,
      averageRating: 0,
    }));
  const sortedLessons = [...moduleLessons].sort((a, b) => a.orderIndex - b.orderIndex);
  const currentIndex = sortedLessons.findIndex((l) => l.id === activeLessonId);
  const totalLessons = sortedLessons.length;

  const otherLessonsFromApi = allPublicLessons
    .filter((l) => !sortedLessons.some((ml) => ml.id === l.id))
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const progressPercent =
    totalLessons > 0 ? ((currentIndex + 1) / totalLessons) * 100 : 0;

  const handleLessonSelect = (lessonId: number) => {
    if (lessonId === activeLessonId) return;
    setActiveLessonId(lessonId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="lesson-detail-page">
        <div className="lesson-detail-page__container">
          <p className="lesson-detail-page__loading">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="lesson-detail-page">
        <div className="lesson-detail-page__container">
          <Breadcrumbs items={[{ label: 'Học nhanh', path: '/learn' }, { label: 'Lỗi' }]} />
          <div className="lesson-detail-page__error">
            <p>{error || 'Không tìm thấy module.'}</p>
            <a href="/learn" style={{ color: '#8B0000', fontWeight: 600 }}>
              ← Quay lại danh sách
            </a>
          </div>
        </div>
      </div>
    );
  }

  const contentSections = activeLesson
    ? parseSections(activeLesson.contentJson ?? '')
    : [];
  const vocabulary = activeLesson
    ? parseVocabulary(activeLesson.vocabularyJson ?? '')
    : [];
  const objectives = activeLesson?.objectiveText
    ? [activeLesson.objectiveText]
    : [];
  const quickNotes = parseQuickNotes(module.quickNotesJson ?? '');

  const breadcrumbItems = [
    { label: 'Học nhanh', path: '/learn' },
    { label: module.categoryName || 'Bài học' },
    { label: activeLesson?.title || module.title },
  ];

  const heroImageUrl =
    activeLesson?.imageUrl || module.thumbnailUrl || '';
  const videoUrl = activeLesson?.videoUrl ?? '';
  const youtubeId = getYoutubeVideoId(videoUrl);
  const hasYoutube = !!youtubeId;
  const hasDirectVideo = !!videoUrl && !youtubeId && /\.(mp4|webm|ogg)(\?|$)/i.test(videoUrl);

  return (
    <div className="lesson-detail-page">
      <div className="lesson-detail-page__container">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="lesson-detail-page__module-header">
          <span className="lesson-detail-page__module-badge">{module.categoryName || 'Bài học'}</span>
          <h2 className="lesson-detail-page__module-title">{module.title}</h2>
          <p className="lesson-detail-page__module-meta">
            {totalLessons} bài • {module.durationMinutes ?? 0} phút
          </p>
        </div>
        <div className="lesson-detail-page__card">
          <div className="lesson-detail-page__layout">
            <div className="lesson-detail-page__main-col">
              {hasYoutube ? (
                <div className="lesson-detail-page__video lesson-detail-page__video--youtube">
                  <div className="lesson-detail-page__video-wrapper">
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
                      title={activeLesson?.title || 'Video bài học'}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="lesson-detail-page__video-iframe"
                    />
                  </div>
                </div>
              ) : hasDirectVideo ? (
                <div className="lesson-detail-page__video">
                  <video
                    key={videoUrl}
                    controls
                    poster={heroImageUrl}
                    className="lesson-detail-page__video-player"
                  >
                    <source src={videoUrl} type="video/mp4" />
                  </video>
                </div>
              ) : (
                <LessonHero
                  imageUrl={heroImageUrl}
                  alt={activeLesson?.title || module.title}
                />
              )}

              <LessonHeader
                title={activeLesson?.title || module.title}
                authorName={
                  activeLesson?.author?.fullName ||
                  module.categoryName ||
                  'Học nhanh'
                }
                authorAvatar={activeLesson?.author?.profileImageUrl}
                viewCount={activeLesson?.viewsCount ?? 0}
                lessonId={activeLesson?.id}
                artisanId={activeLesson?.author?.id}
                onLike={
                  activeLesson?.id && localStorage.getItem('accessToken')
                    ? () => toggleLessonLike(activeLesson.id)
                    : undefined
                }
                onSave={
                  activeLesson?.id && localStorage.getItem('accessToken')
                    ? () => toggleLessonSave(activeLesson.id)
                    : undefined
                }
                onFollow={
                  activeLesson?.author?.id && localStorage.getItem('accessToken')
                    ? () => toggleFollowArtisan(activeLesson!.author!.id)
                    : undefined
                }
              />

              {(objectives.length > 0 || totalLessons > 0) && (
                <div className="lesson-detail-page__objectives-row">
                  <LessonObjectives
                    objectives={objectives}
                    difficulty={activeLesson?.difficulty}
                    estimatedMinutes={activeLesson?.estimatedMinutes}
                    progressPercent={progressPercent}
                    currentIndex={currentIndex}
                    totalLessons={totalLessons}
                  />
                </div>
              )}

              {lessonLoading ? (
                <div className="lesson-detail-page__content">
                  <p className="lesson-detail-page__loading">Đang tải bài học...</p>
                </div>
              ) : (
                <div className="lesson-detail-page__content">
                  <div className="lesson-detail-page__main">
                    {contentSections.length > 0 && (
                      <LessonSummary sections={contentSections} />
                    )}
                    {contentSections.length === 0 && activeLesson && (
                      <div className="lesson-detail-page__content-placeholder">
                        <p>Nội dung bài học đang được cập nhật.</p>
                      </div>
                    )}
                  </div>
                  <div className="lesson-detail-page__sidebar">
                    {vocabulary.length > 0 && (
                      <LessonVocabulary items={vocabulary} />
                    )}
                  </div>
                </div>
              )}

              <div className="lesson-detail-page__bottom">
                {(quickNotes.length > 0 || (module.culturalEtiquetteTitle && module.culturalEtiquetteText)) && (
                  <LessonQuickNotes
                    notes={quickNotes}
                    tip={
                      module.culturalEtiquetteTitle && module.culturalEtiquetteText
                        ? {
                          title: module.culturalEtiquetteTitle,
                          content: module.culturalEtiquetteText,
                        }
                        : undefined
                    }
                  />
                )}
              </div>

              {activeLesson?.id && localStorage.getItem('accessToken') && (
                <div className="lesson-detail-page__complete-row">
                  <button
                    type="button"
                    className="lesson-detail-page__complete-btn"
                    onClick={() =>
                      completeLesson(activeLesson!.id).then(() => {})
                    }
                  >
                    Đánh dấu hoàn thành
                  </button>
                </div>
              )}
              {module.quizPrompt && (
                <LessonQuizCTA
                  moduleId={module.id}
                  questionCount={module.quizPrompt.totalQuestions}
                  quizId={module.quizPrompt.id}
                />
              )}
            </div>

            <aside className="lesson-detail-page__side-col">
              {sortedLessons.length > 0 && (
                <LessonSidebar
                  lessons={sortedLessons}
                  activeLessonId={activeLessonId}
                  onSelectLesson={handleLessonSelect}
                  sectionTitle="Danh sách bài học"
                />
              )}
              {otherLessonsFromApi.length > 0 && (
                <div className="lesson-sidebar lesson-sidebar--other">
                  <h3 className="lesson-sidebar__section-title">Bài học khác</h3>
                  {otherLessonsFromApi.slice(0, 4).map((lesson) => (
                    <button
                      key={lesson.id}
                      type="button"
                      className="lesson-sidebar__card"
                      onClick={() => {
                        getLessonById(lesson.id)
                          .then((detail) => {
                            const mid = detail.moduleId;
                            if (mid) {
                              navigate(`/learn/${mid}`, {
                                state: { selectLessonId: lesson.id },
                                replace: false,
                              });
                            }
                          })
                          .catch(() => {});
                      }}
                    >
                      <img
                        src={lesson.thumbnailUrl || '/nen.png'}
                        alt={lesson.title}
                        className="lesson-sidebar__thumbnail"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/nen.png';
                        }}
                      />
                      <div className="lesson-sidebar__info">
                        <h4 className="lesson-sidebar__title">{lesson.title}</h4>
                        {(lesson.duration ?? 0) > 0 && (
                          <div className="lesson-sidebar__duration">
                            <Clock size={14} />
                            <span>{formatDurationFromMinutes(lesson.duration ?? 0)}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </div>
        {relatedTours.length > 0 && <RelatedTours tours={relatedTours} />}
      </div>
    </div>
  );
}
