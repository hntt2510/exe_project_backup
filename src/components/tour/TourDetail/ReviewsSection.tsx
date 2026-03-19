import type { Review } from '../../../types';
import { renderStars } from './utils';

interface ReviewsSectionProps {
  reviews: Review[];
  loading?: boolean;
  sectionRef: (el: HTMLElement | null) => void;
}

export default function ReviewsSection({
  reviews,
  loading,
  sectionRef,
}: ReviewsSectionProps) {
  const visibleReviews = reviews.filter(
    (r) => r.status === 'VISIBLE' || !r.status
  );

  return (
    <section className="td-section td-reviews" ref={sectionRef}>
      <div className="td-section__container">
        <h2 className="td-section__title td-section__title--decorated">
          ĐÁNH GIÁ TỪ KHÁCH HÀNG
        </h2>

        {loading ? (
          <div className="td-reviews__loading">
            <div className="td-loading__spinner" />
            <p>Đang tải đánh giá...</p>
          </div>
        ) : visibleReviews.length === 0 ? (
          <div className="td-reviews__empty">
            <p>Chưa có đánh giá nào cho tour này.</p>
          </div>
        ) : (
          <div className="td-reviews__list">
            {visibleReviews.map((r) => (
              <div key={r.id} className="td-reviews__card">
                <div className="td-reviews__card-header">
                  <div className="td-reviews__avatar">
                    {r.userAvatar ? (
                      <img src={r.userAvatar} alt={r.userName || ''} />
                    ) : (
                      <span>
                        {(r.userName || 'KH').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="td-reviews__meta">
                    <div className="td-reviews__stars">
                      {renderStars(r.rating ?? 0, `review-${r.id}`)}
                    </div>
                    <strong>{r.userName || 'Khách hàng'}</strong>
                    <span className="td-reviews__date">
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleDateString('vi-VN')
                        : ''}
                    </span>
                  </div>
                </div>
                <p className="td-reviews__comment">{r.comment || '—'}</p>
                {r.images && r.images.length > 0 && (
                  <div className="td-reviews__images">
                    {r.images.slice(0, 5).map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Ảnh ${i + 1}`}
                        className="td-reviews__thumb"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
