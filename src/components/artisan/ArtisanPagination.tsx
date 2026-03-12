import '../../styles/components/tourPagination.scss';

type ArtisanPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const buildPages = (currentPage: number, totalPages: number) => {
  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);
  pages.add(currentPage);
  pages.add(currentPage - 1);
  pages.add(currentPage + 1);
  pages.add(currentPage - 2);
  pages.add(currentPage + 2);

  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
};

export default function ArtisanPagination({
  currentPage,
  totalPages,
  onPageChange,
}: ArtisanPaginationProps) {
  if (totalPages <= 1) return null;
  const pages = buildPages(currentPage, totalPages);

  return (
    <div className="tour-pagination">
      <button
        type="button"
        className="tour-pagination__button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Trước
      </button>

      <div className="tour-pagination__pages">
        {pages.map((page, index) => {
          const prev = pages[index - 1];
          const showGap = prev && page - prev > 1;
          return (
            <span key={page} className="tour-pagination__page-group">
              {showGap && <span className="tour-pagination__ellipsis">…</span>}
              <button
                type="button"
                className={`tour-pagination__page ${
                  page === currentPage ? 'tour-pagination__page--active' : ''
                }`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            </span>
          );
        })}
      </div>

      <button
        type="button"
        className="tour-pagination__button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Sau
      </button>
    </div>
  );
}
