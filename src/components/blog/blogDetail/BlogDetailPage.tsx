import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
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
  return post.content;
}

/** Parse chuỗi images (phân cách bởi dấu phẩy) */
function parseImages(imagesStr?: string): string[] {
  if (!imagesStr?.trim()) return [];
  return imagesStr.split(",").map((s) => s.trim()).filter(Boolean);
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

  return (
    <div className="blog-detail">
      {/* Hero banner */}
      <section className="blog-detail-hero">
        <img
          className="blog-detail-hero__bg"
          src={featuredImg}
          alt={post.title}
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_IMG;
          }}
        />
        <div className="blog-detail-hero__overlay" />

        <Link to="/blog" className="blog-detail-hero__back">
          <ArrowLeft size={20} />
        </Link>

        <div className="blog-detail-hero__content">
          <h1 className="blog-detail-hero__title">{post.title}</h1>
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
        </div>
      </section>

      {/* Article body - layout 2 cột: nội dung + sidebar */}
      <div className="blog-detail-body-wrap">
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

          {images.length > 0 && (
            <div className="blog-detail-body__gallery">
              <h3 className="blog-detail-body__gallery-title">Hình ảnh</h3>
              <div className="blog-detail-body__gallery-grid">
                {images.map((url, idx) => (
                  <div key={idx} className="blog-detail-body__gallery-item">
                    <img
                      src={url}
                      alt={`${post.title} - ${idx + 1}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_IMG;
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Sidebar - thông tin tỉnh */}
        {post.province && (
          <aside className="blog-detail-sidebar">
            <div className="blog-detail-sidebar__card">
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
          </aside>
        )}
      </div>
    </div>
  );
}
