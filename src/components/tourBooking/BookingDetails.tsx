import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Minus, Plus, Clock, AlertCircle } from 'lucide-react';
import { getTourSchedules } from '../../services/paymentApi';
import { formatPrice } from '../tour/TourDetail/utils';
import type { TourSchedule, TourScheduleStartTime } from '../../types';
import '../../styles/components/tourBookingscss/_booking-details.scss';

export type TourType = 'individual' | 'group' | 'family';

export interface BookingDetailsData {
  departureDate: string | null; // "YYYY-MM-DD" string, no timezone issues
  participants: number;
  specialRequirements: string;
  tourType: TourType;
  notes: string;
  agreedToTerms: boolean;
  tourScheduleId: number | null;
  selectedStartTime: string | null; // formatted "HH:mm"
  schedulePrice: number | null; // giá sau giảm (đã áp dụng discountPercent)
  scheduleBasePrice: number | null; // giá gốc trước giảm (currentPrice hoặc tourPrice)
}

interface BookingDetailsProps {
  value: BookingDetailsData;
  onChange: (data: BookingDetailsData) => void;
  tourId: number;
  tourPrice: number;
}

const DAYS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Format a TourSchedule startTime (object or string) into "HH:mm" */
function formatScheduleTime(startTime: TourScheduleStartTime | string): string {
  if (typeof startTime === 'string') {
    // "15:00:00" → "15:00"
    const parts = startTime.split(':');
    return `${parts[0]}:${parts[1]}`;
  }
  const h = String(startTime.hour).padStart(2, '0');
  const m = String(startTime.minute).padStart(2, '0');
  return `${h}:${m}`;
}

/** Build "YYYY-MM-DD" from year, month (0-based), day — pure arithmetic, no Date object */
function buildDateStr(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/** Parse "YYYY-MM-DD" → { year, month (0-based), day } — no new Date() */
function parseDateStr(dateStr: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

export default function BookingDetails({ value, onChange, tourId, tourPrice }: BookingDetailsProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Schedule state
  const [allSchedules, setAllSchedules] = useState<TourSchedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesForDate, setSchedulesForDate] = useState<TourSchedule[]>([]);

  // Fetch all schedules for this tour once
  useEffect(() => {
    if (!tourId) return;
    setSchedulesLoading(true);
    getTourSchedules(tourId)
      .then((data) => setAllSchedules(data))
      .catch(() => setAllSchedules([]))
      .finally(() => setSchedulesLoading(false));
  }, [tourId]);

  // Compute set of days with available schedules for the current view month
  const daysWithSchedules = useMemo(() => {
    const daySet = new Set<number>();
    allSchedules.forEach((s) => {
      if (s.status !== 'SCHEDULED') return;
      const { year, month, day } = parseDateStr(s.tourDate);
      if (year === viewYear && month === viewMonth) {
        daySet.add(day);
      }
    });
    return daySet;
  }, [allSchedules, viewYear, viewMonth]);

  // Filter schedules when date changes — pure string comparison, no timezone
  useEffect(() => {
    if (!value.departureDate || allSchedules.length === 0) {
      setSchedulesForDate([]);
      return;
    }
    const matched = allSchedules.filter((s) => {
      return s.tourDate === value.departureDate && s.status === 'SCHEDULED';
    });
    setSchedulesForDate(matched);

    // Auto-clear schedule selection if date changes and previous selection no longer valid
    if (value.tourScheduleId) {
      const stillValid = matched.some((s) => s.id === value.tourScheduleId);
      if (!stillValid) {
        onChange({ ...value, tourScheduleId: null, selectedStartTime: null, schedulePrice: null, scheduleBasePrice: null });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.departureDate, allSchedules]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const monthLabel = `${MONTH_NAMES[viewMonth]} ${viewYear}`;

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDate = (day: number) => {
    if (isPastDate(day)) return;
    const dateStr = buildDateStr(viewYear, viewMonth, day);
    onChange({ ...value, departureDate: dateStr, tourScheduleId: null, selectedStartTime: null, schedulePrice: null, scheduleBasePrice: null });
  };

  const handleSelectSchedule = (schedule: TourSchedule) => {
    const time = formatScheduleTime(schedule.startTime);
    // basePrice = giá gốc của khung giờ (currentPrice nếu có, không thì tourPrice)
    const basePrice = schedule.currentPrice ?? tourPrice;
    const discount = schedule.discountPercent ?? 0;
    // Áp dụng discount lên basePrice
    const price = discount > 0 ? Math.round(basePrice * (1 - discount / 100)) : basePrice;
    onChange({
      ...value,
      tourScheduleId: schedule.id,
      selectedStartTime: time,
      schedulePrice: price,
      scheduleBasePrice: discount > 0 ? basePrice : null,
    });
  };

  const isSelectedDate = (day: number) => {
    if (!value.departureDate) return false;
    return value.departureDate === buildDateStr(viewYear, viewMonth, day);
  };

  const isPastDate = (day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    return date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      viewMonth === today.getMonth() &&
      viewYear === today.getFullYear()
    );
  };

  const updateParticipants = (delta: number) => {
    const newVal = Math.max(1, value.participants + delta);
    onChange({ ...value, participants: newVal });
  };

  const tourTypes: { key: TourType; label: string }[] = [
    { key: 'individual', label: 'Cá nhân' },
    { key: 'group', label: 'Nhóm' },
    { key: 'family', label: 'Gia đình' },
  ];

  // Build calendar grid
  const blanks = Array.from({ length: firstDay }, (_, i) => (
    <div key={`blank-${i}`} className="booking-calendar__day booking-calendar__day--empty" />
  ));

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const past = isPastDate(day);
    const selected = isSelectedDate(day);
    const todayClass = isToday(day);
    const hasTour = daysWithSchedules.has(day);
    return (
      <button
        key={day}
        type="button"
        disabled={past}
        className={`booking-calendar__day ${past ? 'booking-calendar__day--disabled' : ''} ${
          selected ? 'booking-calendar__day--selected' : ''
        } ${todayClass ? 'booking-calendar__day--today' : ''} ${
          hasTour && !selected && !past ? 'booking-calendar__day--has-tour' : ''
        }`}
        onClick={() => handleSelectDate(day)}
      >
        {day}
      </button>
    );
  });

  return (
    <div className="booking-details">
      <h2 className="booking-details__heading">Chi tiết đặt chỗ</h2>

      {/* Calendar */}
      <div className="booking-details__section">
        <label className="booking-details__label">
          Ngày khởi hành <span className="booking-details__required">*</span>
        </label>
        <div className="booking-calendar">
          <div className="booking-calendar__header">
            <span className="booking-calendar__month">{monthLabel} &gt;</span>
            <div className="booking-calendar__nav">
              <button type="button" onClick={handlePrevMonth} className="booking-calendar__nav-btn">
                <ChevronLeft size={18} />
              </button>
              <button type="button" onClick={handleNextMonth} className="booking-calendar__nav-btn">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <div className="booking-calendar__weekdays">
            {DAYS_VI.map((d) => (
              <div key={d} className="booking-calendar__weekday">{d}</div>
            ))}
          </div>
          <div className="booking-calendar__grid">
            {blanks}
            {days}
          </div>
        </div>
      </div>

      {/* Schedule time slot picker */}
      {value.departureDate !== null && (
        <div className="booking-details__section">
          <label className="booking-details__label">
            Chọn giờ khởi hành <span className="booking-details__required">*</span>
          </label>

          {schedulesLoading ? (
            <div className="schedule-picker__loading">
              <div className="schedule-picker__spinner" />
              <span>Đang tải lịch khởi hành...</span>
            </div>
          ) : schedulesForDate.length === 0 ? (
            <div className="schedule-picker__empty">
              <AlertCircle size={16} />
              <span>Không có lịch khởi hành cho ngày này. Vui lòng chọn ngày khác.</span>
            </div>
          ) : (
            <div className="schedule-picker">
              {schedulesForDate.map((schedule) => {
                const isSelected = value.tourScheduleId === schedule.id;
                const isFull = schedule.bookedSlots >= schedule.maxSlots;
                const available = schedule.maxSlots - schedule.bookedSlots;
                const time = formatScheduleTime(schedule.startTime);

                return (
                  <button
                    key={schedule.id}
                    type="button"
                    disabled={isFull}
                    className={`schedule-picker__slot ${
                      isSelected ? 'schedule-picker__slot--selected' : ''
                    } ${isFull ? 'schedule-picker__slot--full' : ''}`}
                    onClick={() => handleSelectSchedule(schedule)}
                  >
                    <div className="schedule-picker__slot-time">
                      <Clock size={16} />
                      <span>{time}</span>
                    </div>
                    <div className="schedule-picker__slot-price">
                      {(() => {
                        const discount = schedule.discountPercent ?? 0;
                        // Giá gốc của khung giờ (currentPrice nếu có, không thì tourPrice)
                        const basePrice = schedule.currentPrice ?? tourPrice;
                        // Giá sau giảm
                        const effectivePrice = discount > 0
                          ? Math.round(basePrice * (1 - discount / 100))
                          : basePrice;
                        const hasDiscount = discount > 0;
                        return hasDiscount ? (
                          <>
                            <span className="schedule-picker__slot-original-price">
                              {formatPrice(basePrice)} VND
                            </span>
                            <span className="schedule-picker__slot-current-price">
                              {formatPrice(effectivePrice)} VND
                            </span>
                            <span className="schedule-picker__slot-discount">
                              -{discount}%
                            </span>
                          </>
                        ) : (
                          <span className="schedule-picker__slot-normal-price">
                            {formatPrice(effectivePrice)} VND
                          </span>
                        );
                      })()}
                    </div>
                    <div className="schedule-picker__slot-info">
                      <span className="schedule-picker__slot-seats">
                        {isFull ? 'Hết chỗ' : `Còn ${available} chỗ`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Participants */}
      <div className="booking-details__section">
        <label className="booking-details__label">
          Số lượng người tham gia <span className="booking-details__required">*</span>
        </label>
        <div className="booking-details__participants">
          <div className="booking-details__participant-row">
            <span>Số người</span>
            <div className="booking-details__counter">
              <button type="button" onClick={() => updateParticipants(-1)} className="booking-details__counter-btn">
                <Minus size={14} />
              </button>
              <span className="booking-details__counter-value">{value.participants}</span>
              <button type="button" onClick={() => updateParticipants(1)} className="booking-details__counter-btn">
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Special requirements */}
      <div className="booking-details__section">
        <input
          type="text"
          className="booking-details__input"
          placeholder="Chiều cao, cân nặng, tuổi,..."
          value={value.specialRequirements}
          onChange={(e) => onChange({ ...value, specialRequirements: e.target.value })}
        />
      </div>

      {/* Tour type */}
      <div className="booking-details__section">
        <div className="booking-details__tour-type">
          <span className="booking-details__tour-type-label">Loại tour</span>
          <div className="booking-details__tour-type-options">
            {tourTypes.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`booking-details__tour-type-btn ${
                  value.tourType === key ? 'booking-details__tour-type-btn--active' : ''
                }`}
                onClick={() => onChange({ ...value, tourType: key })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="booking-details__section">
        <label className="booking-details__label">Ghi chú cho nhà tổ chức</label>
        <input
          type="text"
          className="booking-details__input"
          placeholder="Yêu cầu ăn chay, xe đưa đón,..."
          value={value.notes}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
        />
      </div>

      {/* Terms */}
      <div className="booking-details__terms">
        <label className="booking-details__checkbox-label">
          <input
            type="checkbox"
            checked={value.agreedToTerms}
            onChange={(e) => onChange({ ...value, agreedToTerms: e.target.checked })}
          />
          <span>
            Tôi đồng ý với{' '}
            <a href="#" className="booking-details__terms-link">
              điều khoản dịch vụ & chính sách huỷ
            </a>
          </span>
        </label>
      </div>
    </div>
  );
}
