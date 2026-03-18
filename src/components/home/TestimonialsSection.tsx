'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Review } from '../../types';
import { getReviews } from '../../services/api';
import { Star } from 'lucide-react';

export default function TestimonialsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchReviews = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await getReviews();
        if (!mounted) return;
        setReviews(list);
      } catch (err) {
        if (!mounted) return;
        console.error('[TestimonialsSection] ❌ API error:', err);
        setError('Không thể tải dữ liệu đánh giá');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchReviews();
    return () => { mounted = false; };
  }, []);

  // Lọc review 5 sao, có nội dung và tên khách hàng
  const displayReviews = useMemo(() => {
    return reviews.filter(
      (r) =>
        (r.rating >= 5 || r.rating === 5) &&
        (r.comment?.trim?.()?.length ?? 0) > 0 &&
        (r.userName?.trim?.()?.length ?? 0) > 0 &&
        (r.status === 'VISIBLE' || !r.status)
    );
  }, [reviews]);

  const getInitials = (name?: string) => {
    if (!name) return 'KH';
    const parts = name.trim().split(/\s+/);
    return parts.slice(-2).map((part) => part[0]).join('').toUpperCase();
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={16}
        className={`testimonials__star ${
          i < Math.floor(rating) ? 'testimonials__star--filled' : 'testimonials__star--empty'
        }`}
      />
    ));
  };

  const renderCard = (review: Review, keySuffix?: string) => (
    <div key={keySuffix ?? review.id} className="testimonials__card testimonials__flow-card">
      <div className="testimonials__card-header">
        {review.userAvatar ? (
          <div
            className="testimonials__avatar"
            style={{ backgroundImage: `url('${review.userAvatar}')` }}
            role="img"
            aria-label={`Avatar of ${review.userName}`}
          />
        ) : (
          <div className="testimonials__avatar testimonials__avatar--fallback" aria-label={`Avatar of ${review.userName}`}>
            {getInitials(review.userName)}
          </div>
        )}
        <div className="testimonials__user-info">
          <p className="testimonials__user-name">{review.userName || 'Khách hàng'}</p>
          {review.tourTitle && (
            <p className="testimonials__user-role">{review.tourTitle}</p>
          )}
        </div>
      </div>
      <div className="testimonials__stars">{renderStars(review.rating || 0)}</div>
      <p className="testimonials__comment">{review.comment}</p>
    </div>
  );

  return (
    <section className="section-container testimonials">
      <div className="testimonials__container">
        <h2 className="section-title">ĐÁNH GIÁ CỦA KHÁCH HÀNG</h2>
        <p className="section-subtitle">
          Những trải nghiệm tuyệt vời từ những du khách yêu thích Tây Nguyên
        </p>

        {loading && (
          <div className="testimonials__state">
            <p className="testimonials__state-text">Đang tải dữ liệu...</p>
          </div>
        )}

        {!loading && error && (
          <div className="testimonials__state">
            <p className="testimonials__state-text">{error}</p>
          </div>
        )}

        {!loading && !error && displayReviews.length === 0 && (
          <div className="testimonials__state">
            <p className="testimonials__state-text">Chưa có đánh giá 5 sao</p>
          </div>
        )}

        {!loading && !error && displayReviews.length > 0 && (
          <div className="testimonials__flow-wrapper">
            <div className="testimonials__flow-track" aria-hidden="true">
              <div className="testimonials__flow-inner">
                {displayReviews.map((r, i) => renderCard(r, `1-${i}`))}
              </div>
              <div className="testimonials__flow-inner" aria-hidden="true">
                {displayReviews.map((r, i) => renderCard(r, `2-${i}`))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
