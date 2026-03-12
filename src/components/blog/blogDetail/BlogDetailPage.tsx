import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, User, MapPin, Calendar } from "lucide-react";
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

export default function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
  const contentToRender = post.blocksJson
    ? (() => {
        try {
          const blocks = JSON.parse(post.blocksJson) as unknown[];
          return Array.isArray(blocks)
            ? blocks
                .map((b: unknown) => {
                  if (b && typeof b === "object" && "type" in b) {
                    const block = b as { type: string; content?: string };
                    if (block.type === "paragraph" && block.content) return block.content;
                    if (block.type === "heading" && block.content) return block.content + "\n\n";
                  }
                  return "";
                })
                .join("\n\n")
            : post.content;
        } catch {
          return post.content;
        }
      })()
    : post.content;

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
            {post.authorName && (
              <span className="blog-detail-hero__meta-item">
                <User size={14} />
                {post.authorName}
              </span>
            )}
            {post.provinceName && (
              <span className="blog-detail-hero__meta-item">
                <MapPin size={14} />
                {post.provinceName}
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
              {post.viewCount} lượt xem
            </span>
          </div>
        </div>
      </section>

      {/* Article body */}
      <article className="blog-detail-body">
        <nav className="blog-detail-body__breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <Link to="/blog">Blog</Link>
          <span>/</span>
          <span>{post.title}</span>
        </nav>
        <div className="blog-detail-body__content">{contentToRender}</div>
      </article>
    </div>
  );
}
