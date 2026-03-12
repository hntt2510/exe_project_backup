import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { BlogPost, Video, LearnModule } from '../../types';
import { getBlogPosts, getVideos, getLearnModules } from '../../services/api';
import { Play, BookOpen, ArrowRight, GraduationCap } from 'lucide-react';
import '../../styles/components/quickLearnSection.scss';

const DEFAULT_LIMIT = 3;

export default function QuickLearnSection() {
  const [activeTab, setActiveTab] = useState<'blog' | 'video' | 'learn'>('blog');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [learnModules, setLearnModules] = useState<LearnModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchQuickLearnData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [blogData, videoData, learnData] = await Promise.all([
          getBlogPosts(),
          getVideos(),
          getLearnModules(),
        ]);
        if (!mounted) return;
        setBlogPosts(blogData ?? []);
        setVideos(videoData ?? []);
        setLearnModules(learnData ?? []);
      } catch (err) {
        if (!mounted) return;
        setError('Không thể tải dữ liệu học nhanh văn hoá');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchQuickLearnData();
    return () => { mounted = false; };
  }, []);

  const blogItems = useMemo(() => blogPosts.slice(0, DEFAULT_LIMIT), [blogPosts]);
  const videoItems = useMemo(() => videos.slice(0, DEFAULT_LIMIT), [videos]);
  const learnItems = useMemo(() => learnModules.slice(0, DEFAULT_LIMIT), [learnModules]);

  const hasItems =
    activeTab === 'blog'
      ? blogItems.length > 0
      : activeTab === 'video'
        ? videoItems.length > 0
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
                        {post.provinceName || 'Tây Nguyên'}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="quick-learn__content">
                      <h3 className="quick-learn__title">
                        {post.title}
                      </h3>
                      <p className="quick-learn__excerpt">
                        {post.content.substring(0, 100)}...
                      </p>
                      <div className="quick-learn__meta">
                        <span className="quick-learn__views">
                          👁️ {post.viewCount} lượt xem
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
                {videoItems.map((video) => (
                  <div key={video.id} className="card quick-learn__card">
                    {/* Video Thumbnail */}
                    <div className="quick-learn__image">
                      <div
                        className="quick-learn__image-bg"
                        style={{
                          backgroundImage: `url('${video.thumbnailUrl}')`,
                        }}
                        role="img"
                        aria-label={video.title}
                      />
                      {/* Play Button */}
                      <div className="quick-learn__video-overlay">
                        <button className="quick-learn__play">
                          <Play size={24} style={{ fill: 'currentColor' }} />
                        </button>
                      </div>
                      <div className="quick-learn__badge">
                        {video.provinceName || 'Tây Nguyên'}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="quick-learn__content">
                      <h3 className="quick-learn__title">
                        {video.title}
                      </h3>
                      <div className="quick-learn__meta">
                        <span className="quick-learn__views">
                          👁️ {video.viewCount} lượt xem
                        </span>
                        <button className="quick-learn__link">
                          Xem video <ArrowRight size={16} />
                        </button>
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
    </section>
  );
}
