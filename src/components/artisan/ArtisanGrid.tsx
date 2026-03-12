import { useState } from "react";
import type { PublicArtisan } from "../../types";
import ArtisanCard from "./ArtisanCard";
import ArtisanPagination from "./ArtisanPagination";
import "../../styles/components/artisan/_artisan-grid.scss";

const PAGE_SIZE = 6;

interface Props {
  artisans: PublicArtisan[];
  loading: boolean;
}

function SkeletonCard() {
  return (
    <article className="artisan-card artisan-card--skeleton">
      <div className="artisan-card__stamp">
        <div className="artisan-card__img-wrap skeleton-pulse" />
      </div>
      <div className="artisan-card__info">
        <div className="skeleton-line skeleton-line--name" />
        <div className="skeleton-line skeleton-line--spec" />
        <div className="skeleton-line skeleton-line--link" />
      </div>
    </article>
  );
}

export default function ArtisanGrid({ artisans, loading }: Props) {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedArtisans = artisans.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <section className="artisan-grid">
      <div className="artisan-grid__inner">
        <h2 className="artisan-grid__title">Nghệ nhân tiêu biểu</h2>

        <div className="artisan-grid__list">
          {loading
            ? Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)
            : paginatedArtisans.map((a) => <ArtisanCard key={a.id} artisan={a} />)}
        </div>

        {!loading && artisans.length === 0 && (
          <p className="artisan-grid__empty">
            Chưa có nghệ nhân nào được hiển thị.
          </p>
        )}

        {!loading && artisans.length > PAGE_SIZE && (
          <div className="artisan-grid__pagination">
            <ArtisanPagination
              currentPage={currentPage}
              totalPages={Math.ceil(artisans.length / PAGE_SIZE)}
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
