import { useState } from "react";
import type { BlogPost } from "../../types";
import BlogCard from "./BlogCard";
import ArtisanPagination from "../artisan/ArtisanPagination";
import "../../styles/components/blog/_blog-grid.scss";

const PAGE_SIZE = 6;

interface Props {
  posts: BlogPost[];
  loading: boolean;
}

function SkeletonCard() {
  return (
    <article className="blog-skeleton">
      <div className="blog-skeleton__img" />
      <div className="blog-skeleton__content">
        <div className="blog-skeleton__line blog-skeleton__line--title" />
        <div className="blog-skeleton__line blog-skeleton__line--excerpt" />
        <div className="blog-skeleton__line blog-skeleton__line--excerpt" />
        <div className="blog-skeleton__line blog-skeleton__line--meta" />
      </div>
    </article>
  );
}

export default function BlogGrid({ posts, loading }: Props) {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedPosts = posts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <section className="blog-grid">
      <div className="blog-grid__inner">
        <div className="blog-grid__list">
          {loading
            ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <SkeletonCard key={i} />
              ))
            : paginatedPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
        </div>

        {!loading && posts.length === 0 && (
          <p className="blog-grid__empty">
            Chưa có bài viết nào được hiển thị.
          </p>
        )}

        {!loading && posts.length > PAGE_SIZE && (
          <div className="blog-grid__pagination">
            <ArtisanPagination
              currentPage={currentPage}
              totalPages={Math.ceil(posts.length / PAGE_SIZE)}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
