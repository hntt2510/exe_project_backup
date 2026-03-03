import { MapPin } from 'lucide-react';
import type { Tour } from '../../types';
import type { BookingDetailsData } from '../tourBooking/BookingDetails';
import { formatPrice } from '../tour/TourDetail/utils';
import type { Voucher } from '../../services/paymentApi';
import { calcVoucherDiscount } from '../../services/paymentApi';
import '../../styles/components/paymentMethodscss/_payment-sidebar.scss';

interface PaymentSidebarProps {
  tour: Tour;
  bookingDetails: BookingDetailsData;
  appliedVoucher?: Voucher | null;
  voucherAnimating?: boolean;
}

function formatDuration(hours: number): string {
  const days = Math.ceil(hours / 24);
  const nights = days - 1;
  if (days <= 1) return `${hours} giờ`;
  return `${days}N${nights}Đ`;
}

export default function PaymentSidebar({ tour, bookingDetails, appliedVoucher, voucherAnimating }: PaymentSidebarProps) {
  const unitPrice = bookingDetails.schedulePrice ?? tour.price;
  const totalPrice = bookingDetails.participants * unitPrice;
  const voucherDiscount = appliedVoucher ? calcVoucherDiscount(appliedVoucher, totalPrice) : 0;
  const finalPrice = totalPrice - voucherDiscount;
  const hasVoucher = voucherDiscount > 0 && appliedVoucher;

  return (
    <div className={`payment-sidebar${voucherAnimating ? ' payment-sidebar--voucher-flash' : ''}`}>
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
          {/* Show discount comparison when schedule has discount */}
          {bookingDetails.scheduleBasePrice != null && bookingDetails.schedulePrice != null && bookingDetails.schedulePrice < bookingDetails.scheduleBasePrice ? (
            <div className="payment-sidebar__price-discount">
              <span className="payment-sidebar__price-original">
                {formatPrice(bookingDetails.scheduleBasePrice)} VND
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

        {/* Voucher discount row */}
        {hasVoucher && (
          <div className={`payment-sidebar__voucher-row${voucherAnimating ? ' payment-sidebar__voucher-row--animate' : ''}`}>
            <span>
              Voucher <strong>{appliedVoucher.code}</strong>
              {appliedVoucher.discountType === 'PERCENTAGE'
                ? ` (-${appliedVoucher.discountValue}%)`
                : ''}
            </span>
            <strong>-{formatPrice(voucherDiscount)} VND</strong>
          </div>
        )}

        <div className="payment-sidebar__total">
          <span>Tổng tiền</span>
          {hasVoucher ? (
            <div className={`payment-sidebar__total-discounted${voucherAnimating ? ' payment-sidebar__total-discounted--animate' : ''}`}>
              <span className="payment-sidebar__total-was">{formatPrice(totalPrice)} VND</span>
              <strong className="payment-sidebar__total-now">{formatPrice(finalPrice)} VND</strong>
            </div>
          ) : (
            <strong>{formatPrice(finalPrice)} VND</strong>
          )}
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
