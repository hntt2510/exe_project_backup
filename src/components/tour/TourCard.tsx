import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Star, User } from 'lucide-react';
import type { Tour } from '../../types';
import { formatPrice } from '../tour/TourDetail/utils';
import '../../styles/components/tourCard.scss';

const buildImageUrl = (tour: Tour) => {
  if (tour.thumbnailUrl) return tour.thumbnailUrl;
  if (tour.images && tour.images.length > 0) return tour.images[0];
  return '/nen.png';
};

const formatDuration = (hours?: number) => {
  if (!hours) return null;
  if (hours < 1) return `${Math.round(hours * 60)} phút`;
  if (hours < 24) return `${hours} giờ`;
  const days = Math.floor(hours / 24);
  const remainder = hours % 24;
  return remainder > 0 ? `${days} ngày ${Math.round(remainder)}h` : `${days} ngày`;
};

type TourCardProps = {
  tour: Tour;
};

export default function TourCard({ tour }: TourCardProps) {
  const navigate = useNavigate();

  return (
    <article
      className="tour-card"
      onClick={() => navigate(`/tours/${tour.id}`)}
      style={{ cursor: 'pointer' }}
    >
      <div className="tour-card__image-wrapper">
        <div className="tour-card__image-frame">
          <img
            className="tour-card__image"
            src={buildImageUrl(tour)}
            alt={tour.title}
          />
        </div>
        {tour.provinceName && (
          <span className="tour-card__badge tour-card__badge--location">
            <MapPin size={12} />
            {tour.provinceName}
          </span>
        )}
      </div>

      <div className="tour-card__content">
        <h3 className="tour-card__title">{tour.title}</h3>

        <div className="tour-card__meta">
          {tour.durationHours != null && (
            <span className="tour-card__meta-item">
              <Clock size={14} />
              {formatDuration(tour.durationHours)}
            </span>
          )}
          {tour.averageRating != null && tour.averageRating > 0 && (
            <span className="tour-card__meta-item tour-card__meta-item--rating">
              <Star size={14} fill="currentColor" />
              {tour.averageRating.toFixed(1)}
            </span>
          )}
        </div>

        {tour.artisanName && (
          <div className="tour-card__artisan">
            <User size={12} />
            <span>{tour.artisanName}</span>
          </div>
        )}

        <p className="tour-card__description">{tour.description}</p>

        <div className="tour-card__footer">
          <div className="tour-card__price">
            <span className="tour-card__price-value">
              {formatPrice(tour.price ?? 0)} VND
            </span>
          </div>
          <button type="button" className="tour-card__cta">
            Đặt ngay
          </button>
        </div>
      </div>
    </article>
  );
}
