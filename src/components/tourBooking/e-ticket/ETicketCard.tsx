import { Calendar, Clock, MapPin, Users, Mail, Phone, User, CreditCard, Hash, Tag } from 'lucide-react';
import type { Tour, Province } from '../../../types';
import type { BookingResponse } from '../../../services/paymentApi';
import type { ContactInfo } from '../ContactForm';
import type { BookingDetailsData } from '../BookingDetails';
import { formatPrice } from '../../tour/TourDetail/utils';
import '../../../styles/components/tourBookingscss/e-ticketscss/_e-ticket-card.scss';

interface ETicketCardProps {
  tour: Tour;
  province: Province | null;
  booking: BookingResponse | null;
  contactInfo: ContactInfo;
  bookingDetails: BookingDetailsData;
  bookingCode?: string;
}

/** Helpers */
function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(hours: number): string {
  const days = Math.ceil(hours / 24);
  const nights = days - 1;
  if (days <= 1) return `${hours} giờ`;
  return `${days} ngày ${nights} đêm`;
}

function mapPaymentMethod(method: string | undefined): string {
  switch (method) {
    case 'VNPAY':
      return 'VNPay';
    case 'MOMO':
      return 'MoMo';
    case 'CASH':
      return 'Tiền mặt (tại điểm hẹn)';
    case 'COD':
      return 'Tiền mặt (tại điểm hẹn)';
    case 'CREDIT_CARD':
      return 'Thẻ tín dụng';
    default:
      return method || 'Tiền mặt';
  }
}

function mapPaymentStatus(status: string | undefined): { label: string; className: string } {
  switch (status) {
    case 'PAID':
      return { label: 'Đã thanh toán', className: 'e-ticket-card__status--paid' };
    case 'UNPAID':
      return { label: 'Chưa thanh toán', className: 'e-ticket-card__status--unpaid' };
    case 'REFUNDED':
      return { label: 'Đã hoàn tiền', className: 'e-ticket-card__status--refunded' };
    default:
      return { label: status || 'Chờ xử lý', className: 'e-ticket-card__status--pending' };
  }
}

function mapBookingStatus(status: string | undefined): { label: string; className: string } {
  switch (status) {
    case 'CONFIRMED':
      return { label: 'Đã xác nhận', className: 'e-ticket-card__badge--confirmed' };
    case 'PENDING':
      return { label: 'Đang chờ xác nhận', className: 'e-ticket-card__badge--pending' };
    case 'CANCELLED':
      return { label: 'Đã huỷ', className: 'e-ticket-card__badge--cancelled' };
    case 'COMPLETED':
      return { label: 'Hoàn thành', className: 'e-ticket-card__badge--completed' };
    default:
      return { label: status || 'Đang xử lý', className: 'e-ticket-card__badge--pending' };
  }
}

export default function ETicketCard({
  tour,
  province,
  booking,
  contactInfo,
  bookingDetails,
  bookingCode: bookingCodeFromState,
}: ETicketCardProps) {
  // Prefer API data, fall back to navigation state
  const code = booking?.bookingCode || bookingCodeFromState || `TMP-${Date.now().toString(36).toUpperCase()}`;
  const participants = booking?.numParticipants || bookingDetails.participants;
  const tourDate = booking?.tourDate || bookingDetails.departureDate;
  const startTime = booking?.tourStartTime;
  const name = booking?.contactName || contactInfo.fullName;
  const email = booking?.contactEmail || contactInfo.email;
  const phone = booking?.contactPhone || contactInfo.phone;
  const unitPrice = bookingDetails.schedulePrice ?? tour.price;
  const totalAmount = booking?.totalAmount ?? participants * unitPrice;
  const discountAmount = booking?.discountAmount ?? 0;
  const finalAmount = booking?.finalAmount ?? totalAmount - discountAmount;
  const paymentMethod = booking?.paymentMethod;
  const paymentStatus = mapPaymentStatus(booking?.paymentStatus);
  const bookingStatus = mapBookingStatus(booking?.status);

  return (
    <div className="e-ticket-card">
      {/* ---- Header with tour image ---- */}
      <div className="e-ticket-card__header">
        <div className="e-ticket-card__image-wrap">
          <img
            src={tour.thumbnailUrl || '/nen.png'}
            alt={tour.title}
            className="e-ticket-card__image"
          />
          <div className="e-ticket-card__image-overlay">
            <span className={`e-ticket-card__badge ${bookingStatus.className}`}>
              {bookingStatus.label}
            </span>
          </div>
        </div>

        <div className="e-ticket-card__header-info">
          <h3 className="e-ticket-card__tour-title">{tour.title}</h3>
          <div className="e-ticket-card__meta-row">
            <MapPin size={14} />
            <span>{province?.name || tour.provinceName || 'Việt Nam'}</span>
          </div>
          <div className="e-ticket-card__meta-row">
            <Clock size={14} />
            <span>{formatDuration(tour.durationHours)}</span>
          </div>
        </div>
      </div>

      {/* ---- Dashed divider ---- */}
      <div className="e-ticket-card__divider">
        <div className="e-ticket-card__divider-notch e-ticket-card__divider-notch--left" />
        <div className="e-ticket-card__divider-line" />
        <div className="e-ticket-card__divider-notch e-ticket-card__divider-notch--right" />
      </div>

      {/* ---- Ticket body ---- */}
      <div className="e-ticket-card__body">
        {/* Booking code row */}
        <div className="e-ticket-card__code-section">
          <span className="e-ticket-card__code-label">Mã đặt tour</span>
          <span className="e-ticket-card__code-value">{code}</span>
        </div>

        {/* Detail grid */}
        <div className="e-ticket-card__grid">
          {/* Tour date */}
          <div className="e-ticket-card__field">
            <div className="e-ticket-card__field-icon"><Calendar size={16} /></div>
            <div>
              <span className="e-ticket-card__field-label">Ngày khởi hành</span>
              <span className="e-ticket-card__field-value">{formatDate(tourDate)}</span>
            </div>
          </div>

          {/* Start time */}
          <div className="e-ticket-card__field">
            <div className="e-ticket-card__field-icon"><Clock size={16} /></div>
            <div>
              <span className="e-ticket-card__field-label">Giờ tập trung</span>
              <span className="e-ticket-card__field-value">{formatTime(startTime)}</span>
            </div>
          </div>

          {/* Participants */}
          <div className="e-ticket-card__field">
            <div className="e-ticket-card__field-icon"><Users size={16} /></div>
            <div>
              <span className="e-ticket-card__field-label">Số người</span>
              <span className="e-ticket-card__field-value">{participants} người</span>
            </div>
          </div>

          {/* Location */}
          <div className="e-ticket-card__field">
            <div className="e-ticket-card__field-icon"><MapPin size={16} /></div>
            <div>
              <span className="e-ticket-card__field-label">Điểm đến</span>
              <span className="e-ticket-card__field-value">{province?.name || tour.provinceName || 'Việt Nam'}</span>
            </div>
          </div>
        </div>

        {/* ---- Contact info section ---- */}
        <div className="e-ticket-card__section">
          <h4 className="e-ticket-card__section-title">Thông tin liên hệ</h4>
          <div className="e-ticket-card__info-rows">
            <div className="e-ticket-card__info-row">
              <User size={14} />
              <span className="e-ticket-card__info-label">Họ tên:</span>
              <span className="e-ticket-card__info-value">{name || '—'}</span>
            </div>
            <div className="e-ticket-card__info-row">
              <Mail size={14} />
              <span className="e-ticket-card__info-label">Email:</span>
              <span className="e-ticket-card__info-value">{email || '—'}</span>
            </div>
            <div className="e-ticket-card__info-row">
              <Phone size={14} />
              <span className="e-ticket-card__info-label">Số điện thoại:</span>
              <span className="e-ticket-card__info-value">{phone || '—'}</span>
            </div>
          </div>
        </div>

        {/* ---- Payment section ---- */}
        <div className="e-ticket-card__section">
          <h4 className="e-ticket-card__section-title">Thanh toán</h4>
          <div className="e-ticket-card__info-rows">
            <div className="e-ticket-card__info-row">
              <CreditCard size={14} />
              <span className="e-ticket-card__info-label">Phương thức:</span>
              <span className="e-ticket-card__info-value">{mapPaymentMethod(paymentMethod)}</span>
            </div>
            <div className="e-ticket-card__info-row">
              <Tag size={14} />
              <span className="e-ticket-card__info-label">Trạng thái:</span>
              <span className={`e-ticket-card__info-value ${paymentStatus.className}`}>
                {paymentStatus.label}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="e-ticket-card__info-row">
                <Hash size={14} />
                <span className="e-ticket-card__info-label">Giảm giá:</span>
                <span className="e-ticket-card__info-value e-ticket-card__info-value--discount">
                  -{formatPrice(discountAmount)} VND
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ---- Total ---- */}
        <div className="e-ticket-card__total">
          <span>Tổng thanh toán</span>
          <strong>{formatPrice(finalAmount)} VND</strong>
        </div>

        {/* ---- Footer note ---- */}
        <div className="e-ticket-card__note">
          <p>Vui lòng đến điểm hẹn đúng giờ và mang theo vé này (hoặc mã đặt tour) để xác nhận.</p>
          <p>Mọi thắc mắc xin liên hệ hotline: <strong>1900 xxxx</strong></p>
        </div>
      </div>
    </div>
  );
}
