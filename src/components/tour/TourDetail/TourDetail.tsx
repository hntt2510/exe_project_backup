import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Breadcrumbs from '../../Breadcrumbs';
import {
  getTourById,
  getToursByProvince,
  getCultureItemsByProvince,
  getProvinceById,
  getTourReviews,
} from '../../../services/api';
import type { Tour, CultureItem, Province, Review } from '../../../types';
import '../../../styles/pages/tourDetail.scss';

import StickyTabs, { type TabKey } from './StickyTabs';
import IntroSection from './IntroSection';
import HighlightsSection from './HighlightsSection';
import FestivalsSection from './FestivalsSection';
import FoodSection from './FoodSection';
import ReviewsSection from './ReviewsSection';
import CTABanner from './CTABanner';
import { formatPrice, parseImages, renderStars } from './utils';

export default function TourDetail() {
  const { id } = useParams<{ id: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [province, setProvince] = useState<Province | null>(null);
  const [cultureItems, setCultureItems] = useState<CultureItem[]>([]);
  const [relatedTours, setRelatedTours] = useState<Tour[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('intro');
  const sectionRefs = useRef<Record<TabKey, HTMLElement | null>>({
    intro: null,
    highlights: null,
    videos: null,
    festivals: null,
    food: null,
    reviews: null,
  });

  useEffect(() => {
    if (!id) return;
    const tourId = Number(id);
    setLoading(true);

    const fetchData = async () => {
      try {
        const tourData = await getTourById(tourId);
        console.log('=== TOUR DETAIL RAW ===', JSON.parse(JSON.stringify(tourData)));
        setTour(tourData);

        const [provinceData, culture, related] = await Promise.all([
          tourData.provinceId ? getProvinceById(tourData.provinceId) : Promise.resolve(null),
          tourData.provinceId ? getCultureItemsByProvince(tourData.provinceId) : Promise.resolve([]),
          tourData.provinceId ? getToursByProvince(tourData.provinceId) : Promise.resolve([]),
        ]);

        setProvince(provinceData);
        setCultureItems(culture);
        setRelatedTours(related.filter((t) => t.id !== tourId).slice(0, 3));

        setReviewsLoading(true);
        getTourReviews(tourId)
          .then((list) => setReviews(list ?? []))
          .catch(() => setReviews([]))
          .finally(() => setReviewsLoading(false));
      } catch (err) {
        console.error('Failed to load tour detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const scrollToSection = (key: TabKey) => {
    setActiveTab(key);
    sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ---------- Loading / Not found ---------- */
  if (loading) {
    return (
      <div className="td-loading">
        <div className="td-loading__spinner" />
        <p>Đang tải thông tin tour...</p>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="td-loading">
        <p>Không tìm thấy tour này.</p>
        <Link to="/tours" className="btn btn-primary">Quay lại danh sách tour</Link>
      </div>
    );
  }

  /* ---------- Derived data ---------- */
  const festivals = cultureItems.filter(
    (c) => c.category === 'FESTIVAL',
  );
  const foodItems = cultureItems.filter((c) => c.category === 'FOOD');
  const highlights = cultureItems.filter(
    (c) => c.category === 'CRAFT',
  );
  const videoItem = cultureItems.find((c) => c.videoUrl);

  const breadcrumbItems = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Bản đồ', path: '/tours' },
    ...(province ? [{ label: province.name, path: `/tours?province=${province.id}` }] : []),
    { label: tour.title },
  ];

  return (
    <div className="tour-detail">
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* Hero */}
      <section className="td-hero">
        <img className="td-hero__image" src={tour.thumbnailUrl || '/nen.png'} alt={tour.title} />
      </section>

      {/* Sticky Tabs */}
      <StickyTabs activeTab={activeTab} onTabClick={scrollToSection} />

      {/* Giới thiệu chung + Video */}
      <IntroSection
        tour={tour}
        province={province}
        videoItem={videoItem}
        introRef={(el) => { sectionRefs.current.intro = el; }}
        videosRef={(el) => { sectionRefs.current.videos = el; }}
      />

      {/* Địa điểm nổi bật */}
      <HighlightsSection
        tour={tour}
        province={province}
        cultureItems={cultureItems}
        highlights={highlights}
        sectionRef={(el) => { sectionRefs.current.highlights = el; }}
      />

      {/* Lễ hội - Phong tục */}
      <FestivalsSection
        festivals={highlights}
        sectionRef={(el) => { sectionRefs.current.festivals = el; }}
      />

      {/* Ẩm thực địa phương */}
      <FoodSection
        foodItems={foodItems}
        sectionRef={(el) => { sectionRefs.current.food = el; }}
      />

      {/* Đánh giá */}
      <ReviewsSection
        reviews={reviews}
        loading={reviewsLoading}
        sectionRef={(el) => { sectionRefs.current.reviews = el; }}
      />

      {/* CTA Banner */}
      <CTABanner tour={tour} province={province} />

      {/* Tour gợi ý liên quan */}
      {relatedTours.length > 0 && (
        <section className="td-section td-related">
          <div className="td-section__container">
            <h2 className="td-section__title td-section__title--decorated">TOUR GỢI Ý LIÊN QUAN</h2>
            <div className="td-related__grid">
              {relatedTours.map((t) => (
                <Link to={`/tours/${t.id}`} key={t.id} className="td-related__card">
                  <div className="td-related__card-images">
                    {parseImages(t.images).slice(0, 3).map((img, i) => (
                      <img key={i} src={img} alt={`${t.title} ${i + 1}`} className="td-related__thumb" />
                    ))}
                    {parseImages(t.images).length === 0 && (
                      <img src={t.thumbnailUrl || '/nen.png'} alt={t.title} className="td-related__thumb td-related__thumb--full" />
                    )}
                  </div>
                  <div className="td-related__card-content">
                    <h4>{t.title}</h4>
                    <p className="td-related__price">{formatPrice(t.price)} VND</p>
                    <div className="td-related__stars">{renderStars(t.averageRating, `related-${t.id}`)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
