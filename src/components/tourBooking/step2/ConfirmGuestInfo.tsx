import type { ContactInfo } from '../ContactForm';
import type { BookingDetailsData } from '../BookingDetails';
import '../../../styles/components/tourBookingscss/step2/_confirm-guest-info.scss';

interface ConfirmGuestInfoProps {
  contactInfo: ContactInfo;
  bookingDetails: BookingDetailsData;
  onEditClick: () => void;
}

function formatDateFull(dateStr: string | null): string {
  if (!dateStr) return '—';
  // Parse "YYYY-MM-DD" without Date object to avoid timezone shift
  const [y, m, d] = dateStr.split('-').map(Number);
  // Create date at noon local to avoid DST edge cases
  const date = new Date(y, m - 1, d, 12, 0, 0);
  const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = dayNames[date.getDay()];
  const dd = String(d).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${dayName}, ${dd}/${mm}/${y}`;
}

function buildParticipantSummary(participants: number): string {
  return `${participants} người`;
}

export default function ConfirmGuestInfo({
  contactInfo,
  bookingDetails,
  onEditClick,
}: ConfirmGuestInfoProps) {
  return (
    <div className="confirm-guest-info">
      <div className="confirm-guest-info__label">
        <span className="confirm-guest-info__label-icon">👤</span>
        Khách &amp; lịch khởi hành
      </div>

      <div className="confirm-guest-info__rows">
        <div className="confirm-guest-info__row">
          <span className="confirm-guest-info__key">Tên khách</span>
          <span className="confirm-guest-info__value">{contactInfo.fullName || '—'}</span>
        </div>
        <div className="confirm-guest-info__row">
          <span className="confirm-guest-info__key">Ngày khởi hành</span>
          <span className="confirm-guest-info__value">
            {formatDateFull(bookingDetails.departureDate)}
          </span>
        </div>
        {bookingDetails.selectedStartTime && (
          <div className="confirm-guest-info__row">
            <span className="confirm-guest-info__key">Giờ tập trung</span>
            <span className="confirm-guest-info__value">
              {bookingDetails.selectedStartTime}
            </span>
          </div>
        )}
        <div className="confirm-guest-info__row">
          <span className="confirm-guest-info__key">Số lượng</span>
          <span className="confirm-guest-info__value">
            {buildParticipantSummary(bookingDetails.participants)}
          </span>
        </div>
      </div>

      <button type="button" className="confirm-guest-info__edit-btn" onClick={onEditClick}>
        ← Quay lại chỉnh sửa
      </button>
    </div>
  );
}
