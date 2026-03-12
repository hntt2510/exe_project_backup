import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import type { BlogPost } from "../../types";
import "../../styles/components/blog/_blog-card.scss";

const FALLBACK_IMG = "/dauvao.png";
const EXCERPT_LENGTH = 150;

interface Props {
  post: BlogPost;
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

function getExcerpt(content: string, maxLen: number): string {
  const text = content.replace(/\s+/g, " ").trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trim() + "...";
}

export default function BlogCard({ post }: Props) {
  const excerpt = getExcerpt(post.content, EXCERPT_LENGTH);
  const publishedDate = formatDate(post.publishedAt || post.createdAt);

  return (
    <Link to={`/blog/${post.id}`} className="blog-card">
      <div className="blog-card__img-wrap">
        <img
          src={post.featuredImageUrl || FALLBACK_IMG}
          alt={post.title}
          className="blog-card__img"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_IMG;
          }}
        />
      </div>

      <div className="blog-card__content">
        <h3 className="blog-card__title">{post.title}</h3>
        <p className="blog-card__excerpt">{excerpt}</p>
        <div className="blog-card__meta">
          {post.provinceName && (
            <span className="blog-card__badge">{post.provinceName}</span>
          )}
          <span className="blog-card__views">
            <Eye size={12} />
            {post.viewCount}
          </span>
          {publishedDate && (
            <span className="blog-card__date">{publishedDate}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
