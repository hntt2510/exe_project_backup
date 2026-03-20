import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin, Calendar, ChevronRight, X } from "lucide-react";
import { getBlogPostById } from "../../../services/api";
import type { BlogPost } from "../../../types";
import "../../../styles/components/blog/_blog-detail.scss";

const FALLBACK_IMG = "/dauvao.png";

export interface NarrativeSection {
  title: string;
  content: string;
  imageUrl: string;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/** Parse narrativeContent JSON: [{title, content, imageUrl}, ...] */
function parseNarrativeContent(raw?: string): NarrativeSection[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is NarrativeSection =>
          x && typeof x.title === "string" && typeof x.content === "string"
      )
      .map((x) => ({
        title: x.title,
        content: x.content,
        imageUrl: x.imageUrl || "",
      }));
  } catch {
    return [];
  }
}

/** Thu thập tất cả ảnh: images field (single/comma) + narrativeContent.imageUrl */
function collectImages(post: BlogPost): string[] {
  const urls: string[] = [];

  // images field: single URL hoặc comma-separated
  if (post.images?.trim()) {
    const trimmed = post.images.trim();
    if (trimmed.startsWith("[")) {
      try {
        const arr = JSON.parse(trimmed);
        if (Array.isArray(arr))
          arr.forEach((u) => typeof u === "string" && urls.push(u));
      } catch {
        urls.push(trimmed);
      }
    } else {
      trimmed.split(",").forEach((s) => {
        const u = s.trim();
        if (u) urls.push(u);
      });
    }
  }

  // narrativeContent imageUrl
  const sections = parseNarrativeContent(post.narrativeContent);
  sections.forEach((s) => {
    if (s.imageUrl && !urls.includes(s.imageUrl)) urls.push(s.imageUrl);
  });

  return urls;
}

export default function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getBlogPostById(Number(id));
        if (!cancelled) setPost(data);
      } catch (err) {
        console.error("[BlogDetail] Fetch failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="blog-detail-loading">
        <div className="blog-detail-loading__spinner" />
        <p>Đang tải bài viết...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="blog-detail-loading">
        <p>Không tìm thấy bài viết này.</p>
        <Link to="/blog" className="blog-detail-back-btn">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const featuredImg = post.featuredImageUrl || FALLBACK_IMG;
  const publishedDate = formatDate(post.publishedAt || post.createdAt);
  const provinceName = post.province?.name ?? post.provinceName;
  const narrativeSections = parseNarrativeContent(post.narrativeContent);
  const hasNarrative = narrativeSections.length > 0;
  const images = collectImages(post);

  return (
    <div className="blog-detail">
      {/* Hero */}
      <motion.section
        className="blog-detail-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.img
          className="blog-detail-hero__bg blog-detail-hero__bg--clickable"
          src={featuredImg}
          alt={post.title}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          onClick={() => setLightboxImage(featuredImg)}
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_IMG;
          }}
        />
        <div className="blog-detail-hero__overlay" />

        <Link to="/blog" className="blog-detail-hero__back">
          <ArrowLeft size={20} />
        </Link>

        <motion.div
          className="blog-detail-hero__content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {provinceName && (
            <Link
              to={`/tours?province=${post.province?.id || ""}`}
              className="blog-detail-hero__location"
            >
              <MapPin size={16} />
              {provinceName}
            </Link>
          )}
          <h1 className="blog-detail-hero__title">{post.title}</h1>
          {post.heroSubtitle && (
            <p className="blog-detail-hero__subtitle">{post.heroSubtitle}</p>
          )}
          <div className="blog-detail-hero__meta">
            {provinceName && (
              <span className="blog-detail-hero__meta-item">
                <MapPin size={14} />
                {provinceName}
              </span>
            )}
            {publishedDate && (
              <span className="blog-detail-hero__meta-item">
                <Calendar size={14} />
                {publishedDate}
              </span>
            )}
          </div>
        </motion.div>
      </motion.section>

      {/* Body */}
      <motion.div
        className="blog-detail-body-wrap"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <article className="blog-detail-body">
          <nav className="blog-detail-body__breadcrumb">
            <Link to="/">Trang chủ</Link>
            <ChevronRight size={14} />
            <Link to="/blog">Blog</Link>
            <ChevronRight size={14} />
            <span className="blog-detail-body__breadcrumb-current">
              {post.title}
            </span>
          </nav>

          {/* Intro content (HTML) - luôn hiện trước */}
          {post.content && (
            <div
              className="blog-detail-body__content prose blog-detail-body__content--intro"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          )}

          {/* Narrative sections - layout đẹp: ảnh + tiêu đề + nội dung */}
          {hasNarrative && (
            <div className="blog-detail-narrative">
              {narrativeSections.map((section, idx) => (
                <motion.section
                  key={idx}
                  className={`blog-detail-narrative__item blog-detail-narrative__item--${idx % 2 === 0 ? "image-left" : "image-right"}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  {section.imageUrl && (
                    <div
                      className="blog-detail-narrative__img"
                      onClick={() => setLightboxImage(section.imageUrl)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        e.key === "Enter" && setLightboxImage(section.imageUrl)
                      }
                    >
                      <img
                        src={section.imageUrl}
                        alt={section.title}
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACK_IMG;
                        }}
                      />
                    </div>
                  )}
                  <div className="blog-detail-narrative__text">
                    <h3 className="blog-detail-narrative__title">
                      {section.title}
                    </h3>
                    <p className="blog-detail-narrative__content">
                      {section.content}
                    </p>
                  </div>
                </motion.section>
              ))}
            </div>
          )}

          {/* Gallery */}
          {images.length > 0 && (
            <motion.div
              className={`blog-detail-body__gallery blog-detail-gallery--count-${images.length <= 8 ? images.length : "many"}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="blog-detail-body__gallery-title">Hình ảnh</h3>
              <div className="blog-detail-body__gallery-grid">
                {images.map((url, idx) => (
                  <motion.div
                    key={idx}
                    className="blog-detail-body__gallery-item blog-detail-body__gallery-item--clickable"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    onClick={() => setLightboxImage(url)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && setLightboxImage(url)
                    }
                  >
                    <img
                      src={url}
                      alt={`${post.title} - ${idx + 1}`}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_IMG;
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </article>

        {/* Sidebar - Địa điểm nổi bật */}
        {post.province && (
          <motion.aside
            className="blog-detail-sidebar"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="blog-detail-sidebar__card">
              <div className="blog-detail-sidebar__location-header">
                <MapPin size={20} className="blog-detail-sidebar__location-icon" />
                <span className="blog-detail-sidebar__location-label">
                  Địa điểm
                </span>
              </div>
              {post.province.thumbnailUrl && (
                <div className="blog-detail-sidebar__thumb">
                  <img
                    src={post.province.thumbnailUrl}
                    alt={post.province.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
              <h3 className="blog-detail-sidebar__title">
                <MapPin size={18} />
                {post.province.name}
              </h3>
              {post.province.region && (
                <p className="blog-detail-sidebar__region">
                  {post.province.region}
                </p>
              )}
              {post.province.description && (
                <p className="blog-detail-sidebar__desc">
                  {post.province.description}
                </p>
              )}
              {post.province.bestSeason && (
                <div className="blog-detail-sidebar__meta">
                  <strong>Mùa đẹp:</strong> {post.province.bestSeason}
                </div>
              )}
              {post.province.transportation && (
                <div className="blog-detail-sidebar__meta">
                  <strong>Di chuyển:</strong> {post.province.transportation}
                </div>
              )}
              {post.province.culturalTips && (
                <div className="blog-detail-sidebar__tip">
                  <strong>Lưu ý văn hóa:</strong> {post.province.culturalTips}
                </div>
              )}
              <Link
                to={`/tours?province=${post.province.id}`}
                className="blog-detail-sidebar__cta"
              >
                Xem tour tại {post.province.name}
              </Link>
            </div>
          </motion.aside>
        )}
      </motion.div>

      {/* Lightbox - phóng to ảnh khi click */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            className="blog-detail-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
          >
            <button
              type="button"
              className="blog-detail-lightbox__close"
              onClick={() => setLightboxImage(null)}
              aria-label="Đóng"
            >
              <X size={28} />
            </button>
            <motion.img
              src={lightboxImage}
              alt="Phóng to"
              className="blog-detail-lightbox__img"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
