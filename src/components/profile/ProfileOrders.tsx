import { useState, useMemo } from 'react';
import {
  Search, Eye, Download, X, Calendar, Clock, MapPin, Users, Mail, Phone,
  User as UserIcon, CreditCard, Tag, ChevronLeft, ChevronRight, Star, Package, Sparkles, CheckCircle2,
} from 'lucide-react';
import type { UserBooking } from '../../services/profileApi';
import { ReviewModal } from '../bookingReview';
import '../../styles/components/profile/_profile-orders.scss';

interface ProfileOrdersProps {
  bookings: UserBooking[];
  onReviewSuccess?: () => void;
}

const ITEMS_PER_PAGE = 10;

type TabKey = 'all' | 'upcoming' | 'completed';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Chờ xác nhận', cls: 'pending' },
  CONFIRMED: { label: 'Đã xác nhận', cls: 'confirmed' },
  COMPLETED: { label: 'Hoàn thành', cls: 'completed' },
  CANCELLED: { label: 'Đã huỷ', cls: 'cancelled' },
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  UNPAID: { label: 'Chờ thanh toán', cls: 'unpaid' },
  PENDING_CASH: { label: 'Thanh toán tại chỗ', cls: 'unpaid' },
  PAID: { label: 'Đã thanh toán', cls: 'paid' },
  REFUNDED: { label: 'Đã hoàn tiền', cls: 'refunded' },
  FAILED: { label: 'Thanh toán thất bại', cls: 'cancelled' },
};

function formatPrice(n: number): string {
  return n.toLocaleString('vi-VN');
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

function formatDateFull(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
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

function mapPaymentMethod(method: string | undefined): string {
  switch (method) {
    case 'VNPAY': return 'VNPay';
    case 'MOMO': return 'MoMo';
    case 'CASH': return 'Tiền mặt (tại điểm hẹn)';
    case 'CREDIT_CARD': return 'Thẻ tín dụng';
    case 'BANK_TRANSFER': return 'Chuyển khoản';
    default: return method || 'Tiền mặt';
  }
}

/** Tour sắp đi: trong vòng 3 ngày (hôm nay đến hôm nay + 3 ngày) */
function isUpcomingWithin3Days(booking: UserBooking): boolean {
  if (booking.status === 'CANCELLED') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tourDate = new Date(booking.tourDate);
  tourDate.setHours(0, 0, 0, 0);
  const diff = Math.floor((tourDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  return diff >= 0 && diff <= 3;
}

/** Tour đã hoàn thành: đã qua ngày xuất phát + đã thanh toán */
function isCompleted(booking: UserBooking): boolean {
  if (booking.status === 'CANCELLED' || booking.paymentStatus !== 'PAID') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tourDate = new Date(booking.tourDate);
  tourDate.setHours(0, 0, 0, 0);
  return today > tourDate;
}

/** Đủ điều kiện feedback: đã thanh toán + đã qua ngày xuất phát ít nhất 1 ngày */
function isEligibleForFeedback(booking: UserBooking): boolean {
  if (booking.paymentStatus !== 'PAID') return false;
  return isCompleted(booking);
}

/** Có thể đánh giá: đủ điều kiện VÀ chưa đánh giá (isReview !== true) */
function canShowReview(booking: UserBooking): boolean {
  return isEligibleForFeedback(booking) && !(booking as { isReview?: boolean }).isReview;
}

/** Tải ticket dạng HTML, mở cửa sổ in (user có thể Save as PDF) */
function downloadTicket(booking: UserBooking) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ticket ${booking.bookingCode}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 480px; margin: 0 auto; }
    h1 { font-size: 1.25rem; margin: 0 0 1rem; color: #333; }
    .code { font-size: 1.5rem; font-weight: bold; color: #8B0000; margin: 0.5rem 0; }
    .row { margin: 0.5rem 0; display: flex; gap: 0.5rem; }
    .label { color: #666; min-width: 120px; }
    .value { font-weight: 500; }
    .divider { border-top: 1px dashed #ccc; margin: 1rem 0; }
    .note { font-size: 0.875rem; color: #666; margin-top: 1.5rem; }
  </style>
</head>
<body>
  <h1>VÉ THAM GIA TOUR</h1>
  <div class="code">${booking.bookingCode}</div>
  <div class="divider"></div>
  <div class="row"><span class="label">Tour:</span><span class="value">${booking.tourTitle}</span></div>
  <div class="row"><span class="label">Ngày khởi hành:</span><span class="value">${formatDateFull(booking.tourDate)}</span></div>
  <div class="row"><span class="label">Giờ tập trung:</span><span class="value">${formatTime(booking.tourStartTime)}</span></div>
  <div class="row"><span class="label">Số khách:</span><span class="value">${booking.numParticipants} người</span></div>
  <div class="row"><span class="label">Liên hệ:</span><span class="value">${booking.contactName || '—'} | ${booking.contactPhone || '—'}</span></div>
  <div class="divider"></div>
  <div class="row"><span class="label">Tổng thanh toán:</span><span class="value">${formatPrice(booking.finalAmount)} VND</span></div>
  <p class="note">Vui lòng mang theo mã đặt tour khi đến điểm hẹn. Mọi thắc mắc: 1900 xxxx</p>
</body>
</html>`;
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }
}

// ---------------------------------------------------------------------------
// Ticket Modal
// ---------------------------------------------------------------------------
function TicketModal({ booking, onClose, onFeedback, onDownloadTicket }: { booking: UserBooking; onClose: () => void; onFeedback?: (id: number) => void; onDownloadTicket?: () => void }) {
  const statusInfo = STATUS_MAP[booking.status] ?? { label: booking.status, cls: 'default' };
  const canFeedback = canShowReview(booking);

  return (
    <div className="ticket-modal-overlay" onClick={onClose}>
      <div className="ticket-modal" onClick={(e) => e.stopPropagation()}>
        <button className="ticket-modal__close" onClick={onClose} aria-label="Đóng">
          <X size={20} />
        </button>

        <div className="ticket-modal__header">
          <div className="ticket-modal__header-info">
            <span className={`ticket-modal__badge ticket-modal__badge--${statusInfo.cls}`}>
              {statusInfo.label}
            </span>
            <h3 className="ticket-modal__tour-title">{booking.tourTitle}</h3>
          </div>
        </div>

        <div className="ticket-modal__divider">
          <div className="ticket-modal__divider-notch ticket-modal__divider-notch--left" />
          <div className="ticket-modal__divider-line" />
          <div className="ticket-modal__divider-notch ticket-modal__divider-notch--right" />
        </div>

        <div className="ticket-modal__body">
          <div className="ticket-modal__code-section">
            <span className="ticket-modal__code-label">Mã đặt tour</span>
            <span className="ticket-modal__code-value">{booking.bookingCode}</span>
          </div>

          <div className="ticket-modal__grid">
            <div className="ticket-modal__field">
              <div className="ticket-modal__field-icon"><Calendar size={16} /></div>
              <div>
                <span className="ticket-modal__field-label">Ngày khởi hành</span>
                <span className="ticket-modal__field-value">{formatDateFull(booking.tourDate)}</span>
              </div>
            </div>
            <div className="ticket-modal__field">
              <div className="ticket-modal__field-icon"><Clock size={16} /></div>
              <div>
                <span className="ticket-modal__field-label">Giờ tập trung</span>
                <span className="ticket-modal__field-value">{formatTime(booking.tourStartTime)}</span>
              </div>
            </div>
            <div className="ticket-modal__field">
              <div className="ticket-modal__field-icon"><Users size={16} /></div>
              <div>
                <span className="ticket-modal__field-label">Số người</span>
                <span className="ticket-modal__field-value">{booking.numParticipants} người</span>
              </div>
            </div>
            <div className="ticket-modal__field">
              <div className="ticket-modal__field-icon"><MapPin size={16} /></div>
              <div>
                <span className="ticket-modal__field-label">Ngày đặt</span>
                <span className="ticket-modal__field-value">{formatDateFull(booking.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="ticket-modal__section">
            <h4 className="ticket-modal__section-title">Thông tin liên hệ</h4>
            <div className="ticket-modal__info-rows">
              <div className="ticket-modal__info-row">
                <UserIcon size={14} />
                <span className="ticket-modal__info-label">Họ tên:</span>
                <span className="ticket-modal__info-value">{booking.contactName || '—'}</span>
              </div>
              <div className="ticket-modal__info-row">
                <Mail size={14} />
                <span className="ticket-modal__info-label">Email:</span>
                <span className="ticket-modal__info-value">{booking.contactEmail || '—'}</span>
              </div>
              <div className="ticket-modal__info-row">
                <Phone size={14} />
                <span className="ticket-modal__info-label">SĐT:</span>
                <span className="ticket-modal__info-value">{booking.contactPhone || '—'}</span>
              </div>
            </div>
          </div>

          <div className="ticket-modal__section">
            <h4 className="ticket-modal__section-title">Thanh toán</h4>
            <div className="ticket-modal__info-rows">
              <div className="ticket-modal__info-row">
                <CreditCard size={14} />
                <span className="ticket-modal__info-label">Phương thức:</span>
                <span className="ticket-modal__info-value">{mapPaymentMethod(booking.paymentMethod)}</span>
              </div>
              <div className="ticket-modal__info-row">
                <Tag size={14} />
                <span className="ticket-modal__info-label">Trạng thái:</span>
                <span className={`ticket-modal__info-value ticket-modal__payment--${PAYMENT_STATUS_MAP[booking.paymentStatus]?.cls ?? 'default'}`}>
                  {PAYMENT_STATUS_MAP[booking.paymentStatus]?.label ?? booking.paymentStatus}
                </span>
              </div>
              {booking.discountAmount > 0 && (
                <div className="ticket-modal__info-row">
                  <Tag size={14} />
                  <span className="ticket-modal__info-label">Giảm giá:</span>
                  <span className="ticket-modal__info-value ticket-modal__info-value--discount">
                    -{formatPrice(booking.discountAmount)} VND
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="ticket-modal__total">
            <span>Tổng thanh toán</span>
            <strong>{formatPrice(booking.finalAmount)} VND</strong>
          </div>

          <div className="ticket-modal__note">
            <p>Vui lòng đến điểm hẹn đúng giờ và mang theo mã đặt tour để xác nhận.</p>
            <p>Mọi thắc mắc xin liên hệ hotline: <strong>1900 xxxx</strong></p>
          </div>

          <div className="ticket-modal__actions">
            <button
              type="button"
              className="ticket-modal__download-btn"
              onClick={() => downloadTicket(booking)}
            >
              <Download size={18} /> Tải ticket
            </button>
            {canShowReview(booking) && onFeedback && (
              <button
                type="button"
                className="ticket-modal__feedback-btn"
                onClick={() => { onClose(); onFeedback(booking.id); }}
              >
                <Star size={18} /> Đánh giá tour của bạn
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProfileOrders – Tabs + Table
// ---------------------------------------------------------------------------
const TABS: { key: TabKey; label: string; icon: React.ReactNode; filter: (b: UserBooking) => boolean }[] = [
  { key: 'all', label: 'Tất cả', icon: <Package size={18} />, filter: (b) => b.status !== 'CANCELLED' },
  { key: 'upcoming', label: 'Sắp đi (3 ngày)', icon: <Sparkles size={18} />, filter: isUpcomingWithin3Days },
  { key: 'completed', label: 'Đã hoàn thành', icon: <CheckCircle2 size={18} />, filter: isCompleted },
];

export default function ProfileOrders({ bookings, onReviewSuccess }: ProfileOrdersProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<UserBooking | null>(null);
  const [reviewBooking, setReviewBooking] = useState<UserBooking | null>(null);

  const filtered = useMemo(() => {
    const tabFilter = TABS.find((t) => t.key === activeTab)?.filter ?? (() => true);
    let list = bookings.filter(tabFilter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.bookingCode.toLowerCase().includes(q) ||
          b.tourTitle.toLowerCase().includes(q),
      );
    }

    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [bookings, activeTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedItems = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);
    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const reviewableCount = useMemo(() => bookings.filter(canShowReview).length, [bookings]);

  return (
    <div className="profile-orders">
      <h3 className="profile-orders__title">Đơn của tôi</h3>

      {/* Tabs */}
      <div className="profile-orders__tabs">
        {TABS.map((tab) => {
          const count = tab.key === 'all'
            ? bookings.filter((b) => b.status !== 'CANCELLED').length
            : tab.key === 'upcoming'
              ? bookings.filter(isUpcomingWithin3Days).length
              : bookings.filter(isCompleted).length;
          return (
            <button
              key={tab.key}
              className={`profile-orders__tab ${activeTab === tab.key ? 'profile-orders__tab--active' : ''}`}
              onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {count > 0 && <span className="profile-orders__tab-count">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Review prompt banner - on completed tab */}
      {activeTab === 'completed' && reviewableCount > 0 && (
        <div className="profile-orders__review-banner">
          <Star size={20} />
          <span>Bạn có {reviewableCount} tour có thể đánh giá. Chia sẻ trải nghiệm để giúp cộng đồng!</span>
        </div>
      )}

      {/* Search */}
      <div className="profile-orders__filters">
        <div className="profile-orders__search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Tìm mã đơn hoặc tên tour"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      <div className="profile-orders__result-info">
        Hiển thị {paginatedItems.length} / {filtered.length} đơn hàng
      </div>

      {filtered.length === 0 ? (
        <div className="profile-orders__empty">
          <p>
            {activeTab === 'all' && 'Chưa có đơn hàng nào.'}
            {activeTab === 'upcoming' && 'Không có tour nào khởi hành trong 3 ngày tới.'}
            {activeTab === 'completed' && 'Chưa có tour nào đã hoàn thành.'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: danh sách card xếp dọc */}
          <div className="profile-orders__cards">
            {paginatedItems.map((b) => {
              const statusInfo = STATUS_MAP[b.status] ?? { label: b.status, cls: 'default' };
              const paymentInfo = PAYMENT_STATUS_MAP[b.paymentStatus] ?? { label: b.paymentStatus, cls: 'default' };
              const canReview = canShowReview(b);

              return (
                <div key={b.id} className="profile-orders__card">
                  <div className="profile-orders__card-header">
                    <span className="profile-orders__card-code">{b.bookingCode}</span>
                    <span className={`profile-orders__badge profile-orders__badge--${statusInfo.cls}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <h4 className="profile-orders__card-title">{b.tourTitle}</h4>
                  <div className="profile-orders__card-meta">
                    <span>
                      <Calendar size={14} /> {formatDate(b.tourDate)}
                    </span>
                    <span>{b.numParticipants} khách</span>
                    <span className="profile-orders__card-price">{formatPrice(b.finalAmount)} VND</span>
                  </div>
                  <span className={`profile-orders__badge profile-orders__badge--${paymentInfo.cls}`}>
                    {paymentInfo.label}
                  </span>
                  <div className="profile-orders__card-actions">
                    <button
                      type="button"
                      className="profile-orders__card-btn profile-orders__card-btn--primary"
                      onClick={() => setSelectedBooking(b)}
                    >
                      <Eye size={16} /> Xem ticket
                    </button>
                    <button
                      type="button"
                      className="profile-orders__card-btn"
                      onClick={() => downloadTicket(b)}
                    >
                      <Download size={16} /> Tải ticket
                    </button>
                    {canReview && (
                      <button
                        type="button"
                        className="profile-orders__card-btn"
                        onClick={() => setReviewBooking(b)}
                      >
                        <Star size={16} /> Đánh giá
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: bảng */}
          <div className="profile-orders__table-wrap">
            <table className="profile-orders__table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Tên tour</th>
                  <th>Ngày khởi hành</th>
                  <th>Số khách</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((b) => {
                  const statusInfo = STATUS_MAP[b.status] ?? { label: b.status, cls: 'default' };
                  const paymentInfo = PAYMENT_STATUS_MAP[b.paymentStatus] ?? { label: b.paymentStatus, cls: 'default' };
                  const canReview = canShowReview(b);

                  return (
                    <tr key={b.id}>
                      <td className="profile-orders__code">{b.bookingCode}</td>
                      <td className="profile-orders__tour-name">{b.tourTitle}</td>
                      <td>{formatDate(b.tourDate)}</td>
                      <td>{b.numParticipants}</td>
                      <td className="profile-orders__price">{formatPrice(b.finalAmount)} VND</td>
                      <td>
                        <span className={`profile-orders__badge profile-orders__badge--${statusInfo.cls}`}>
                          {statusInfo.label}
                        </span>
                        <span className={`profile-orders__badge profile-orders__badge--${paymentInfo.cls}`}>
                          {paymentInfo.label}
                        </span>
                      </td>
                      <td className="profile-orders__actions-cell">
                        <button
                          className="profile-orders__action"
                          title="Xem ticket"
                          onClick={() => setSelectedBooking(b)}
                        >
                          <Eye size={14} /> Xem ticket
                        </button>
                        <button
                          className="profile-orders__action"
                          title="Tải ticket"
                          onClick={() => downloadTicket(b)}
                        >
                          <Download size={14} /> Tải ticket
                        </button>
                        {canReview && (
                          <button
                            className="profile-orders__action profile-orders__action--feedback"
                            title="Đánh giá tour"
                            onClick={() => setReviewBooking(b)}
                          >
                            <Star size={14} /> Đánh giá
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="profile-orders__pagination">
              <button
                className="profile-orders__page-btn profile-orders__page-btn--nav"
                disabled={safePage <= 1}
                onClick={() => handlePageChange(safePage - 1)}
                aria-label="Trang trước"
              >
                <ChevronLeft size={16} />
              </button>
              {getPageNumbers().map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="profile-orders__page-ellipsis">…</span>
                ) : (
                  <button
                    key={p}
                    className={`profile-orders__page-btn ${p === safePage ? 'profile-orders__page-btn--active' : ''}`}
                    onClick={() => handlePageChange(p)}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                className="profile-orders__page-btn profile-orders__page-btn--nav"
                disabled={safePage >= totalPages}
                onClick={() => handlePageChange(safePage + 1)}
                aria-label="Trang sau"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {selectedBooking && (
        <TicketModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onFeedback={(id) => {
            const b = bookings.find((x) => x.id === id);
            setSelectedBooking(null);
            if (b) setReviewBooking(b);
          }}
        />
      )}

      <ReviewModal
        open={!!reviewBooking}
        booking={reviewBooking}
        onClose={() => setReviewBooking(null)}
        onSuccess={() => {
          setReviewBooking(null);
          onReviewSuccess?.();
        }}
      />
    </div>
  );
}
