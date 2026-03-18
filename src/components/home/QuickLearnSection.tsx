import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { BlogPost, Video, LearnModule, LearnModuleLesson } from '../../types';
import { getBlogPosts, getVideos, getLearnModules, getPublicLessons } from '../../services/api';
import { Play, BookOpen, ArrowRight, GraduationCap } from 'lucide-react';
import LoginRequiredModal from '../LoginRequiredModal';
import '../../styles/components/quickLearnSection.scss';

function hasAuthToken(): boolean {
  return !!localStorage.getItem('accessToken');
}

const DEFAULT_LIMIT = 3;

interface QuickLearnSectionProps {
  blogPosts?: BlogPost[];
  videos?: Video[];
}

export default function QuickLearnSection({ blogPosts: blogProp, videos: videosProp }: QuickLearnSectionProps = {}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'blog' | 'video' | 'learn'>('blog');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(blogProp ?? []);
  const [videos, setVideos] = useState<Video[]>(videosProp ?? []);
  const [lessonVideos, setLessonVideos] = useState<LearnModuleLesson[]>([]);
  const [learnModules, setLearnModules] = useState<LearnModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginModalRedirect, setLoginModalRedirect] = useState('');

  useEffect(() => {
    if (blogProp) setBlogPosts(blogProp);
    if (videosProp) setVideos(videosProp);
  }, [blogProp, videosProp]);

  // Fetch blog/lesson-videos/modules; dùng video từ lesson (có video theo từng bài học)
  useEffect(() => {
    let mounted = true;
    const blogFromParent = blogProp !== undefined && (blogProp?.length ?? 0) > 0;
    const videosFromParent = videosProp !== undefined && (videosProp?.length ?? 0) > 0;

    const fetchData = async () => {
      if (!blogFromParent) setLoading(true);
      setError(null);
      try {
        const promises: Promise<unknown>[] = [
          getLearnModules().then((d) => ({ learn: d })),
          getPublicLessons().then((d) => ({ lessonVideos: d })),
        ];
        if (!blogFromParent) promises.push(getBlogPosts().then((d) => ({ blog: d })));
        if (!videosFromParent) promises.push(getVideos().then((d) => ({ video: d })));

        const results = await Promise.all(promises);
        if (!mounted) return;
        for (const r of results) {
          const x = r as {
            blog?: BlogPost[];
            video?: Video[];
            learn?: LearnModule[];
            lessonVideos?: LearnModuleLesson[];
          };
          if (x.blog) setBlogPosts(x.blog ?? []);
          if (x.video) setVideos(x.video ?? []);
          if (x.learn) setLearnModules(x.learn ?? []);
          if (x.lessonVideos) setLessonVideos(x.lessonVideos ?? []);
        }
      } catch (err) {
        if (!mounted) return;
        setError('Không thể tải dữ liệu học nhanh văn hoá');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [blogProp, videosProp]);

  const blogItems = useMemo(() => blogPosts.slice(0, DEFAULT_LIMIT), [blogPosts]);
  // Ưu tiên video từ lessons (có video theo từng bài); fallback sang getVideos nếu không có
  const lessonVideoItems = useMemo(
    () => lessonVideos.filter((l) => l.videoUrl?.trim()).slice(0, DEFAULT_LIMIT),
    [lessonVideos]
  );
  const videoItems = useMemo(() => videos.slice(0, DEFAULT_LIMIT), [videos]);
  const videoItemsToShow = lessonVideoItems.length > 0 ? lessonVideoItems : videoItems;
  const useLessonVideos = lessonVideoItems.length > 0;
  const learnItems = useMemo(() => learnModules.slice(0, DEFAULT_LIMIT), [learnModules]);

  const hasItems =
    activeTab === 'blog'
      ? blogItems.length > 0
      : activeTab === 'video'
        ? videoItemsToShow.length > 0
        : learnItems.length > 0;
  const shouldShowError = Boolean(error) && !loading && !hasItems;

  return (
    <section className="section-container quick-learn">
      <div className="quick-learn__container">
        <h2 className="section-title">HỌC NHANH VĂN HÓA TÂY NGUYÊN</h2>
        <p className="section-subtitle">
          Tìm hiểu văn hóa Tây Nguyên qua bài viết và video ngắn
        </p>

        {/* Tabs */}
        <div className="quick-learn__tabs">
          <button
            onClick={() => setActiveTab('blog')}
            className={`quick-learn__tab ${activeTab === 'blog' ? 'quick-learn__tab--active' : ''}`}
          >
            <BookOpen className="quick-learn__tab-icon" />
            Bài viết
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`quick-learn__tab ${activeTab === 'video' ? 'quick-learn__tab--active' : ''}`}
          >
            <Play className="quick-learn__tab-icon" />
            Video
          </button>
          <button
            onClick={() => setActiveTab('learn')}
            className={`quick-learn__tab ${activeTab === 'learn' ? 'quick-learn__tab--active' : ''}`}
          >
            <GraduationCap className="quick-learn__tab-icon" />
            Bài học
          </button>
        </div>

        {loading && (
          <div className="quick-learn__state">
            <p>Đang tải dữ liệu...</p>
          </div>
        )}

        {shouldShowError && (
          <div className="quick-learn__state">
            <p>{error}</p>
          </div>
        )}

        {!loading && !shouldShowError && (
          <>
            {/* Content Grid */}
            {activeTab === 'blog' && (
              <div className="quick-learn__grid">
                {blogItems.map((post) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.id}`}
                    className="card quick-learn__card"
                  >
                    {/* Image */}
                    <div className="quick-learn__image">
                      <div
                        className="quick-learn__image-bg"
                        style={{
                          backgroundImage: `url('${post.featuredImageUrl}')`,
                        }}
                        role="img"
                        aria-label={post.title}
                      />
                      <div className="quick-learn__badge">
                        {post.province?.name || post.provinceName || 'Tây Nguyên'}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="quick-learn__content">
                      <h3 className="quick-learn__title">
                        {post.title}
                      </h3>
                      <p className="quick-learn__excerpt">
                        {(() => {
                          const text = (post.content || '').replace(/<[^>]+>/g, '').trim();
                          return text.length > 100 ? `${text.substring(0, 100)}...` : text;
                        })()}
                      </p>
                      <div className="quick-learn__meta">
                        <span className="quick-learn__views">
                          👁️ {post.viewCount ?? 0} lượt xem
                        </span>
                        <span className="quick-learn__link">
                          Xem thêm <ArrowRight size={16} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {activeTab === 'video' && (
              <div className="quick-learn__grid">
                {useLessonVideos
                  ? (videoItemsToShow as LearnModuleLesson[]).map((lesson) => {
                      const lessonPath = `/lesson?id=${lesson.id}`;
                      const handleClick = () => {
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
                          className="card quick-learn__card"
                          onClick={handleClick}
                        >
                          <div className="quick-learn__image">
                            <div
                              className="quick-learn__image-bg"
                              style={{
                                backgroundImage: `url('${lesson.thumbnailUrl || '/nen.png'}')`,
                              }}
                              role="img"
                              aria-label={lesson.title}
                            />
                            <div className="quick-learn__video-overlay">
                              <span className="quick-learn__play">
                                <Play size={24} style={{ fill: 'currentColor' }} />
                              </span>
                            </div>
                            <div className="quick-learn__badge">
                              {lesson.duration} phút
                            </div>
                          </div>
                          <div className="quick-learn__content">
                            <h3 className="quick-learn__title">{lesson.title}</h3>
                            <div className="quick-learn__meta">
                              <span className="quick-learn__link">
                                Xem bài học <ArrowRight size={16} />
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  : (videoItemsToShow as Video[]).map((video) => (
                      <div key={video.id} className="card quick-learn__card">
                        <div className="quick-learn__image">
                          <div
                            className="quick-learn__image-bg"
                            style={{
                              backgroundImage: `url('${video.thumbnailUrl}')`,
                            }}
                            role="img"
                            aria-label={video.title}
                          />
                          <div className="quick-learn__video-overlay">
                            <button className="quick-learn__play">
                              <Play size={24} style={{ fill: 'currentColor' }} />
                            </button>
                          </div>
                          <div className="quick-learn__badge">
                            {video.provinceName || 'Tây Nguyên'}
                          </div>
                        </div>
                        <div className="quick-learn__content">
                          <h3 className="quick-learn__title">{video.title}</h3>
                          <div className="quick-learn__meta">
                            <span className="quick-learn__views">
                              👁️ {video.viewCount ?? 0} lượt xem
                            </span>
                            <span className="quick-learn__link">Xem video</span>
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
            )}
            {activeTab === 'learn' && (
              <div className="quick-learn__grid">
                {learnItems.map((mod) => (
                  <Link
                    key={mod.id}
                    to={`/learn/${mod.id}`}
                    className="card quick-learn__card"
                  >
                    <div className="quick-learn__image">
                      <div
                        className="quick-learn__image-bg"
                        style={{
                          backgroundImage: `url('${mod.thumbnailUrl || '/nen.png'}')`,
                        }}
                        role="img"
                        aria-label={mod.title}
                      />
                      <div className="quick-learn__badge">
                        {mod.categoryName || 'Học nhanh'}
                      </div>
                    </div>
                    <div className="quick-learn__content">
                      <h3 className="quick-learn__title">{mod.title}</h3>
                      <div className="quick-learn__meta">
                        <span className="quick-learn__views">
                          {mod.lessonsCount ?? 0} bài • {(mod.durationMinutes ?? 0)} phút
                        </span>
                        <span className="quick-learn__link">
                          Học ngay <ArrowRight size={16} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {!hasItems && (
              <div className="quick-learn__state">
                <p>
                  Chưa có{' '}
                  {activeTab === 'blog'
                    ? 'bài viết'
                    : activeTab === 'video'
                      ? 'video'
                      : 'bài học'}{' '}
                  nào
                </p>
              </div>
            )}
          </>
        )}

        {/* View All Button */}
        {hasItems && !loading && !shouldShowError && (
          <div className="quick-learn__footer">
            <Link
              to={activeTab === 'blog' ? '/blog' : '/learn'}
              className="btn btn-primary quick-learn__btn-all"
            >
              Xem tất cả <ArrowRight size={20} />
            </Link>
          </div>
        )}
      </div>

      <LoginRequiredModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        redirectPath={loginModalRedirect}
        content="Vui lòng đăng nhập để xem bài học."
      />
    </section>
  );
}
