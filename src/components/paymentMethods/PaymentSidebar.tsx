import { MapPin } from 'lucide-react';
import type { Tour } from '../../types';
import type { BookingDetailsData } from '../tourBooking/BookingDetails';
import { formatPrice } from '../tour/TourDetail/utils';
import '../../styles/components/paymentMethodscss/_payment-sidebar.scss';

interface PaymentSidebarProps {
  tour: Tour;
  bookingDetails: BookingDetailsData;
}

function formatDuration(hours: number): string {
  const days = Math.ceil(hours / 24);
  const nights = days - 1;
  if (days <= 1) return `${hours} giờ`;
  return `${days}N${nights}Đ`;
}

export default function PaymentSidebar({ tour, bookingDetails }: PaymentSidebarProps) {
  const unitPrice = bookingDetails.schedulePrice ?? tour.price;
  const totalPrice = bookingDetails.participants * unitPrice;

  return (
    <div className="payment-sidebar">
      {/* Tour thumbnail */}
      <div className="payment-sidebar__image">
        <img src={tour.thumbnailUrl || '/nen.png'} alt={tour.title} />
      </div>

      {/* Tour title */}
      <div className="payment-sidebar__content">
        <h3 className="payment-sidebar__title">
          {tour.title}
          <span className="payment-sidebar__duration">
            {' '}
            {formatDuration(tour.durationHours)}
          </span>
        </h3>
        <p className="payment-sidebar__subtitle">
          Khám phá văn hoá đại ngàn
        </p>

        {/* Price breakdown */}
        <div className="payment-sidebar__pricing">
          {/* Show discount comparison when schedule has lower price */}
          {bookingDetails.schedulePrice != null && bookingDetails.schedulePrice < tour.price ? (
            <div className="payment-sidebar__price-discount">
              <span className="payment-sidebar__price-original">
                {formatPrice(tour.price)} VND
              </span>
              <span className="payment-sidebar__price-sale">
                {formatPrice(bookingDetails.schedulePrice)} VND
              </span>
            </div>
          ) : null}

          <div className="payment-sidebar__price-row">
            <span>{formatPrice(unitPrice)} × {bookingDetails.participants} người</span>
            <strong>{formatPrice(totalPrice)} VND</strong>
          </div>
        </div>

        <div className="payment-sidebar__total">
          <span>Tổng tiền</span>
          <strong>{formatPrice(totalPrice)} VND</strong>
        </div>

        <p className="payment-sidebar__tax-note">
          Giá đã bao gồm thuế &amp; phí cơ bản. Đã tính chiết khấu hợp tác viên.
        </p>

        {/* Location */}
        <div className="payment-sidebar__location">
          <MapPin size={14} className="payment-sidebar__location-icon" />
          <span>{tour.provinceName || 'Việt Nam'}</span>
        </div>
      </div>
    </div>
  );
}
