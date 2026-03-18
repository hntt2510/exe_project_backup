import { useState } from "react";
import { motion } from "framer-motion";
import type { PublicArtisan } from "../../types";
import ArtisanCard from "./ArtisanCard";
import ArtisanPagination from "./ArtisanPagination";
import "../../styles/components/artisan/_artisan-grid.scss";

const PAGE_SIZE = 6;

interface Props {
  artisans: PublicArtisan[];
  loading: boolean;
}

const cardVariants = {
  initial: { opacity: 0, y: 24 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.05 * i },
  }),
};

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
        <motion.h2
          className="artisan-grid__title"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Nghệ nhân tiêu biểu
        </motion.h2>

        <div className="artisan-grid__list">
          {loading
            ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <SkeletonCard />
                </motion.div>
              ))
            : paginatedArtisans.map((a, i) => (
                <motion.div
                  key={a.id}
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  custom={i}
                >
                  <ArtisanCard artisan={a} />
                </motion.div>
              ))}
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
