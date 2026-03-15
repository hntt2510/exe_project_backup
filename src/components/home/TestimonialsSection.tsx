'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Review } from '../../types';
import { getTourReviews } from '../../services/api';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerView = 3;

  useEffect(() => {
    let mounted = true;

    const fetchReviews = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('[TestimonialsSection] 🚀 Fetching reviews for tours 1, 2, 3, 4...');
        const tourIds = [1, 2, 3, 4];

        const results = await Promise.all(
          tourIds.map((tourId) =>
            getTourReviews(tourId).catch((err) => {
              console.error(`[TestimonialsSection] ❌ Reviews error for tour ${tourId}:`, err);
              return [];
            })
          )
        );

        if (!mounted) return;
        const merged = results.flat();
        const uniqueMap = new Map<number, Review>();
        merged.forEach((review) => {
          uniqueMap.set(review.id, review);
        });
        const list = Array.from(uniqueMap.values());

        console.log('[TestimonialsSection] ✅ Reviews received:', {
          tours: tourIds.length,
          reviews: list.length,
          reviewsData: list,
        });
        setReviews(list);
      } catch (err) {
        if (!mounted) return;
        console.error('[TestimonialsSection] ❌ API error:', err);
        setError('Không thể tải dữ liệu đánh giá');
      } finally {
        if (mounted) {
          console.log('[TestimonialsSection] 🏁 Fetch completed');
          setLoading(false);
        }
      }
    };

    fetchReviews();

    return () => {
      mounted = false;
    };
  }, []);

  const displayTestimonials = useMemo(() => reviews, [reviews]);

  const nextSlide = () => {
    setCurrentIndex(
      (prev) =>
        (prev + 1) % Math.max(1, displayTestimonials.length - itemsPerView + 1)
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev === 0
        ? Math.max(0, displayTestimonials.length - itemsPerView)
        : prev - 1
    );
  };

  const visibleTestimonials = displayTestimonials.slice(
    currentIndex,
    currentIndex + itemsPerView
  );

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
          i < Math.floor(rating)
            ? 'testimonials__star--filled'
            : 'testimonials__star--empty'
        }`}
      />
    ));
  };

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

        {!loading && !error && displayTestimonials.length === 0 && (
          <div className="testimonials__state">
            <p className="testimonials__state-text">Chưa có dữ liệu đánh giá</p>
          </div>
        )}

        {!loading && !error && displayTestimonials.length > 0 && (
          <div className="testimonials__carousel">
            <div className="testimonials__grid">
              {visibleTestimonials.map((testimonial, idx) => (
                <div
                  key={`${testimonial.id}-${currentIndex}-${idx}`}
                  className="testimonials__card"
                >
                  <div className="testimonials__card-header">
                    {testimonial.userAvatar ? (
                      <div
                        className="testimonials__avatar"
                        style={{
                          backgroundImage: `url('${testimonial.userAvatar}')`,
                        }}
                        role="img"
                        aria-label={`Avatar of ${testimonial.userName}`}
                      />
                    ) : (
                      <div
                        className="testimonials__avatar testimonials__avatar--fallback"
                        aria-label={`Avatar of ${testimonial.userName}`}
                      >
                        {getInitials(testimonial.userName)}
                      </div>
                    )}
                    <div className="testimonials__user-info">
                      <p className="testimonials__user-name">
                        {testimonial.userName || 'Khách hàng'}
                      </p>
                      <p className="testimonials__user-role">
                        Khách hàng
                      </p>
                    </div>
                  </div>

                  <div className="testimonials__stars">{renderStars(testimonial.rating || 0)}</div>

                  <p className="testimonials__comment">
                    {testimonial.comment}
                  </p>
                </div>
              ))}
            </div>

            {displayTestimonials.length > itemsPerView && (
              <>
                <button
                  onClick={prevSlide}
                  className="testimonials__nav-btn testimonials__nav-btn--prev"
                  aria-label="Previous testimonials"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextSlide}
                  className="testimonials__nav-btn testimonials__nav-btn--next"
                  aria-label="Next testimonials"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>
        )}

        {displayTestimonials.length > itemsPerView && (
          <div className="testimonials__dots">
            {Array.from({
              length: Math.max(1, displayTestimonials.length - itemsPerView + 1),
            }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`testimonials__dot ${
                  index === currentIndex ? 'testimonials__dot--active' : ''
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

