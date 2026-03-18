import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, MapPin, Calendar, ChevronRight } from "lucide-react";
import { getBlogPostById } from "../../../services/api";
import type { BlogPost } from "../../../types";
import "../../../styles/components/blog/_blog-detail.scss";

const FALLBACK_IMG = "/dauvao.png";

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/** Trích xuất nội dung HTML từ blocksJson (Editor.js format: data.text) hoặc content */
function extractHtmlContent(post: BlogPost): string {
  if (post.blocksJson) {
    try {
      const blocks = JSON.parse(post.blocksJson) as Array<{
        type?: string;
        content?: string;
        data?: { text?: string };
      }>;
      if (!Array.isArray(blocks)) return post.content;

      const parts = blocks.map((b) => {
        if (!b || typeof b !== "object") return "";

        // Editor.js: paragraph/heading có data.text
        if (b.data?.text) return b.data.text;

        // Fallback: một số format dùng content
        if (b.content) return b.content;

        return "";
      });

      const html = parts.filter(Boolean).join("\n\n");
      return html || post.content;
    } catch {
      return post.content;
    }
  }
  // Ưu tiên narrativeContent nếu có (nội dung kể chuyện)
  if (post.narrativeContent?.trim()) return post.narrativeContent;
  return post.content;
}

/** Parse chuỗi images (phân cách bởi dấu phẩy hoặc JSON array) */
function parseImages(imagesStr?: string): string[] {
  if (!imagesStr?.trim()) return [];
  const trimmed = imagesStr.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
    } catch {
      // fallback to comma split
    }
  }
  return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
}

export default function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

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
  const contentHtml = extractHtmlContent(post);
  const images = parseImages(post.images);
  const viewCount = post.viewCount ?? 0;
  const hasPanorama = Boolean(post.panoramaImageUrl?.trim());

  const sectionMotion = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.5 },
  };

  return (
    <div className="blog-detail">
      {/* Hero banner - featuredImageUrl + title + heroSubtitle */}
      <motion.section
        className="blog-detail-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.img
          className="blog-detail-hero__bg"
          src={featuredImg}
          alt={post.title}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
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
            <span className="blog-detail-hero__meta-item">
              <Eye size={14} />
              {viewCount} lượt xem
            </span>
          </div>
        </motion.div>
      </motion.section>

      {/* Panorama full-width (panoramaImageUrl) */}
      {hasPanorama && (
        <motion.section
          className="blog-detail-panorama"
          {...sectionMotion}
        >
          <img
            src={post.panoramaImageUrl!}
            alt={`${post.title} - Toàn cảnh`}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </motion.section>
      )}

      {/* Article body - layout 2 cột: nội dung + sidebar */}
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
            <span className="blog-detail-body__breadcrumb-current">{post.title}</span>
          </nav>

          <div
            className="blog-detail-body__content prose"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

          {/* Gallery - bố cục ảnh thông minh theo số lượng */}
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
                    className="blog-detail-body__gallery-item"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
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

        {/* Sidebar - thông tin tỉnh (province đầy đủ từ API) */}
        {post.province && (
          <motion.aside
            className="blog-detail-sidebar"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="blog-detail-sidebar__card">
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
                <p className="blog-detail-sidebar__region">{post.province.region}</p>
              )}
              {post.province.description && (
                <p className="blog-detail-sidebar__desc">{post.province.description}</p>
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
            </div>
          </motion.aside>
        )}
      </motion.div>
    </div>
  );
}
