import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Breadcrumbs from '../../Breadcrumbs';
import {
  getTourById,
  getCultureItemsByProvince,
  getProvinceById,
  getTourReviews,
} from '../../../services/api';
import type { Tour, CultureItem, Province, Review } from '../../../types';
import '../../../styles/pages/tourDetail.scss';

import IntroSection from './IntroSection';
import FestivalsSection from './FestivalsSection';
import HeroGallery from './HeroGallery';
import QuickInfoBar from './QuickInfoBar';
import BookingSidebar from './BookingSidebar';
import GallerySection from './GallerySection';
import FourBlockGrid from './FourBlockGrid';
import ReviewsSection from './ReviewsSection';
import CTABanner from './CTABanner';

export default function TourDetail() {
  const { id } = useParams<{ id: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [province, setProvince] = useState<Province | null>(null);
  const [cultureItems, setCultureItems] = useState<CultureItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!id) return;
    const tourId = Number(id);
    setLoading(true);

    const fetchData = async () => {
      try {
        const tourData = await getTourById(tourId);
        setTour(tourData);

        const provinceId = tourData.province?.id ?? tourData.provinceId;
        const [provinceData, culture] = await Promise.all([
          tourData.province
            ? Promise.resolve(null)
            : provinceId
              ? getProvinceById(provinceId)
              : Promise.resolve(null),
          provinceId ? getCultureItemsByProvince(provinceId) : Promise.resolve([]),
        ]);

        setProvince(provinceData);
        setCultureItems(culture);

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

  const effectiveProvince = tour.province ?? province;
  const festivals = cultureItems.filter((c) => c.category === 'FESTIVAL');
  const foodItems = cultureItems.filter((c) => c.category === 'FOOD');
  const highlights = cultureItems.filter((c) => c.category === 'CRAFT');

  const bestSeason = tour.bestSeason ?? effectiveProvince?.bestSeason;
  const transportation = tour.transportation ?? effectiveProvince?.transportation;
  const culturalTips = tour.culturalTips ?? effectiveProvince?.culturalTips;

  const breadcrumbItems = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Tours', path: '/tours' },
    ...(effectiveProvince ? [{ label: effectiveProvince.name, path: `/tours?province=${effectiveProvince.id}` }] : []),
    { label: tour.title },
  ];

  return (
    <div className="tour-detail">
      <HeroGallery
        tour={tour}
        provinceName={effectiveProvince?.name}
        provinceId={effectiveProvince?.id}
      />

      <div className="td-main">
        {/* Phần trên: 2 cột (content + sidebar sticky) - tới Thời điểm đẹp nhất */}
        <div className="td-main__top">
          <div className="td-main__content">
            <Breadcrumbs items={breadcrumbItems} />

            <h2 className="td-about-title">Giới thiệu trải nghiệm</h2>
            <IntroSection
              tour={tour}
              province={effectiveProvince}
              introRef={() => {}}
            />

            <QuickInfoBar
              tour={tour}
              bestSeason={bestSeason}
              transportation={transportation}
            />

            <GallerySection tour={tour} cultureItems={cultureItems} />

            <ReviewsSection
              reviews={reviews}
              loading={reviewsLoading}
              sectionRef={() => {}}
            />

            <FourBlockGrid
              artisan={tour.artisan ?? null}
              highlights={highlights}
              foodItems={foodItems}
              bestSeason={bestSeason}
              provinceName={effectiveProvince?.name}
              onlyTop
            />
          </div>

          <aside className="td-main__sidebar">
            <BookingSidebar tour={tour} />
          </aside>
        </div>

        {/* Phần dưới: full width - Địa điểm, Nghệ nhân, Ẩm thực, Lễ hội */}
        <div className="td-main__full">
          <FourBlockGrid
            artisan={tour.artisan ?? null}
            highlights={highlights}
            foodItems={foodItems}
            bestSeason={bestSeason}
            provinceName={effectiveProvince?.name}
            onlySections
          />

          {(culturalTips || festivals.length > 0) && (
            <FestivalsSection
              festivals={festivals}
              culturalTips={culturalTips}
              sectionRef={() => {}}
            />
          )}

          <CTABanner tour={tour} province={effectiveProvince} />
        </div>
      </div>
    </div>
  );
}
