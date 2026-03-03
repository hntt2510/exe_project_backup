import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import Breadcrumbs from '../Breadcrumbs';
import BookingSteps from '../tourBooking/BookingSteps';
import PaymentMethodSelect from './PaymentMethodSelect';
import PaymentSidebar from './PaymentSidebar';
import { getTourById, getProvinceById } from '../../services/api';
import {
  createBooking,
  createPayment,
  validateVoucher,
  type PaymentMethod,
  type Voucher,
} from '../../services/paymentApi';
import type { Tour, Province } from '../../types';
import type { ContactInfo } from '../tourBooking/ContactForm';
import type { BookingDetailsData } from '../tourBooking/BookingDetails';
import '../../styles/components/paymentMethodscss/_payment-page.scss';

/** Retry wrapper — tự động retry khi gặp timeout/network error (Render cold start) */
async function withRetry<T>(
  fn: () => Promise<T>,
  { retries = 2, delayMs = 3000, onRetry }: { retries?: number; delayMs?: number; onRetry?: (attempt: number) => void } = {},
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isTimeout = axios.isAxiosError(err) && (err.code === 'ECONNABORTED' || err.message?.includes('timeout'));
      const isNetwork = axios.isAxiosError(err) && !err.response; // no response = network error
      if ((isTimeout || isNetwork) && attempt < retries) {
        console.warn(`[Payment] Attempt ${attempt + 1} failed (${isTimeout ? 'timeout' : 'network'}), retrying in ${delayMs}ms...`);
        onRetry?.(attempt + 1);
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      throw err;
    }
  }
}

interface PaymentLocationState {
  contactInfo: ContactInfo;
  bookingDetails: BookingDetailsData;
}

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [tour, setTour] = useState<Tour | null>(null);
  const [province, setProvince] = useState<Province | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // State from Step 2
  const state = location.state as PaymentLocationState | undefined;

  const contactInfo: ContactInfo = state?.contactInfo ?? {
    fullName: '',
    email: '',
    phone: '',
  };

  const bookingDetails: BookingDetailsData = state?.bookingDetails
    ? {
        ...state.bookingDetails,
      }
    : {
        departureDate: null,
        participants: 2,
        specialRequirements: '',
        tourType: 'individual',
        notes: '',
        agreedToTerms: false,
        tourScheduleId: null,
        selectedStartTime: null,
        schedulePrice: null,
        scheduleBasePrice: null,
      };

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Voucher state
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherAnimating, setVoucherAnimating] = useState(false);

  useEffect(() => {
    if (!id) return;
    const tourId = Number(id);
    setLoading(true);

    const fetchData = async () => {
      try {
        const tourData = await getTourById(tourId);
        setTour(tourData);

        if (tourData.provinceId) {
          const provinceData = await getProvinceById(tourData.provinceId);
          setProvince(provinceData);
        }
      } catch (err) {
        console.error('Failed to load tour for payment:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Redirect back if no state
  useEffect(() => {
    if (!loading && !state) {
      navigate(`/tours/${id}/booking`, { replace: true });
    }
  }, [loading, state, id, navigate]);

  // Voucher apply handler
  const handleApplyVoucher = async () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) {
      setVoucherError('Vui lòng nhập mã voucher.');
      return;
    }
    setVoucherLoading(true);
    setVoucherError(null);
    setAppliedVoucher(null);
    setVoucherAnimating(false);

    try {
      const voucher = await validateVoucher(code);

      // Check min purchase
      const unitPrice = bookingDetails.schedulePrice ?? tour!.price;
      const totalPrice = bookingDetails.participants * unitPrice;
      if (totalPrice < voucher.minPurchase) {
        setVoucherError(
          `Đơn hàng tối thiểu ${voucher.minPurchase.toLocaleString('vi-VN')}đ để áp dụng voucher này.`,
        );
        return;
      }

      setAppliedVoucher(voucher);
      // Trigger animation
      setVoucherAnimating(true);
      setTimeout(() => setVoucherAnimating(false), 1200);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message;
        setVoucherError(msg || 'Mã voucher không hợp lệ hoặc đã hết hạn.');
      } else {
        setVoucherError('Không thể kiểm tra voucher. Vui lòng thử lại.');
      }
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    setVoucherError(null);
    setVoucherAnimating(false);
  };

  const canSubmit = (): boolean => {
    if (!agreedToTerms) return false;
    // VNPay, MoMo, CASH — no extra fields needed, just agree to terms
    return true;
  };

  const handlePayment = async () => {
    if (!canSubmit() || !tour) return;

    // ---- Auth gate: must be logged in ----
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setErrorMsg('Bạn cần đăng nhập để thực hiện thanh toán.');
      setTimeout(() => {
        navigate('/login', {
          state: { from: location.pathname, contactInfo, bookingDetails },
        });
      }, 1500);
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    let isRedirecting = false;

    try {
      /* ---- 1. Use tourScheduleId from booking details (selected in step 1) ---- */
      const tourScheduleId = bookingDetails.tourScheduleId ?? 0;

      /* ---- 2. Create Booking ---- */
      const numParticipants = bookingDetails.participants;

      console.log('[Payment] Creating booking...', {
        tourId: tour.id,
        tourScheduleId,
        numParticipants,
        paymentMethod,
      });

      const retryOpts = {
        retries: 2,
        delayMs: 3000,
        onRetry: (attempt: number) =>
          setErrorMsg(`Server đang khởi động, thử lại lần ${attempt}...`),
      };

      const booking = await withRetry(
        () =>
          createBooking({
            tourId: tour.id,
            tourScheduleId: tourScheduleId,
            numParticipants,
            contactName: contactInfo.fullName,
            contactPhone: contactInfo.phone,
            contactEmail: contactInfo.email,
            ...(appliedVoucher && { voucherCode: appliedVoucher.code }),
            paymentMethod,
          }),
        retryOpts,
      );

      setErrorMsg(null); // Xóa thông báo retry nếu thành công
      console.log('[Payment] Booking created:', booking);

      /* ---- 3. Create Payment (VNPay / MoMo → need redirect URL) ---- */
      if (paymentMethod === 'VNPAY' || paymentMethod === 'MOMO') {
        console.log('[Payment] Creating payment for', paymentMethod, '...');

        const payment = await withRetry(
          () =>
            createPayment({
              bookingId: booking.id,
              paymentMethod,
              // 'payWithMethod' → MoMo hiển thị trang QR đầy đủ thay vì trang captureWallet
              ...(paymentMethod === 'MOMO' && { requestType: 'payWithMethod' }),
            }),
          retryOpts,
        );

        console.log('[Payment] Payment response:', payment);

        // Dùng paymentUrl trả về từ /api/payments/create
        const redirectUrl = payment?.paymentUrl;

        if (redirectUrl) {
          console.log('[Payment] Redirecting to:', redirectUrl);
          isRedirecting = true;
          // Use replace so user can't go "back" to this page mid-payment
          window.location.replace(redirectUrl);
          return;
        }

        // Backend không trả về paymentUrl → báo lỗi
        console.error('[Payment] No paymentUrl received from backend:', payment);
        setErrorMsg(
          `Không nhận được URL thanh toán từ ${paymentMethod}. Vui lòng thử lại hoặc chọn phương thức khác.`,
        );
        return;
      }

      /* ---- 4. CASH → navigate to e-ticket page ---- */
      navigate(`/tours/${tour.id}/booking/e-ticket`, {
        state: {
          bookingId: booking.id,
          bookingCode: booking.bookingCode,
          contactInfo,
          bookingDetails,
        },
      });
    } catch (err: unknown) {
      console.error('[Payment] Payment failed:', err);

      // Extract real error message from Axios response (e.g. 400 body)
      let message = 'Thanh toán thất bại. Vui lòng thử lại.';
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        console.error('[Payment] Server error response:', data);
        const serverMsg = data?.message || data?.error || data?.data;
        message = serverMsg
          ? `Lỗi: ${serverMsg}`
          : `Lỗi ${err.response?.status ?? ''}: ${err.message}`;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setErrorMsg(message);
    } finally {
      // Don't reset submitting state if we're navigating to payment gateway
      if (!isRedirecting) {
        setSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    navigate(`/tours/${id}/booking/confirm`, {
      state: { contactInfo, bookingDetails },
    });
  };

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div className="payment-page-loading">
        <div className="payment-page-loading__spinner" />
        <p>Đang tải thông tin thanh toán...</p>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="payment-page-loading">
        <p>Không tìm thấy tour này.</p>
        <Link to="/tours" className="btn btn-primary">
          Quay lại danh sách tour
        </Link>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Tour', path: '/tours' },
    ...(province ? [{ label: province.name, path: `/tours?province=${province.id}` }] : []),
    { label: 'Thanh toán' },
  ];

  return (
    <div className="payment-page">
      {/* Top bar */}
      <div className="payment-page__top-bar">
        <button type="button" className="payment-page__back-btn" onClick={handleBack}>
          <ArrowLeft size={20} />
        </button>
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      {/* Steps */}
      <BookingSteps currentStep={3} />

      {/* Content */}
      <div className="payment-page__content">
        {/* Left column – payment form */}
        <div className="payment-page__main">
          <div className="payment-page__card">
            <h2 className="payment-page__heading">Phương thức thanh toán</h2>

            <PaymentMethodSelect
              selected={paymentMethod}
              onSelect={setPaymentMethod}
            />

            {/* Voucher */}
            <div className="payment-page__voucher">
              <label className="payment-page__voucher-label">Mã giảm giá (Voucher)</label>
              {appliedVoucher ? (
                <div className="payment-page__voucher-applied">
                  <div className="payment-page__voucher-applied-info">
                    <span className="payment-page__voucher-code">{appliedVoucher.code}</span>
                    <span className="payment-page__voucher-desc">
                      {appliedVoucher.discountType === 'PERCENTAGE'
                        ? `Giảm ${appliedVoucher.discountValue}%`
                        : `Giảm ${appliedVoucher.discountValue.toLocaleString('vi-VN')}đ`}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="payment-page__voucher-remove"
                    onClick={handleRemoveVoucher}
                  >
                    Xóa
                  </button>
                </div>
              ) : (
                <div className="payment-page__voucher-input-row">
                  <input
                    type="text"
                    className="payment-page__voucher-input"
                    placeholder="Nhập mã voucher"
                    value={voucherCode}
                    onChange={(e) => {
                      setVoucherCode(e.target.value.toUpperCase());
                      setVoucherError(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyVoucher()}
                    disabled={voucherLoading}
                  />
                  <button
                    type="button"
                    className="payment-page__voucher-btn"
                    onClick={handleApplyVoucher}
                    disabled={voucherLoading || !voucherCode.trim()}
                  >
                    {voucherLoading ? 'Đang kiểm tra...' : 'Áp dụng'}
                  </button>
                </div>
              )}
              {voucherError && (
                <p className="payment-page__voucher-error">{voucherError}</p>
              )}
            </div>

            {/* Agree */}
            <div className="payment-page__agree">
              <label className="payment-page__agree-label">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <span>
                  Tôi đồng ý với{' '}
                  <a href="#" className="payment-page__terms-link">
                    điều khoản dịch vụ &amp; chính sách huỷ
                  </a>
                </span>
              </label>
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="payment-page__error">
                {errorMsg}
              </div>
            )}

            {/* Actions */}
            <div className="payment-page__actions">
              <button
                type="button"
                className="payment-page__btn payment-page__btn--primary"
                disabled={!canSubmit() || submitting}
                onClick={handlePayment}
              >
                {submitting ? 'Đang xử lý...' : 'Thanh toán'}
              </button>
              <button
                type="button"
                className="payment-page__btn payment-page__btn--outline"
                onClick={handleBack}
                disabled={submitting}
              >
                Quay lại bước trước
              </button>
            </div>
          </div>
        </div>

        {/* Right column – sidebar */}
        <div className="payment-page__sidebar">
          <PaymentSidebar
            tour={tour}
            bookingDetails={bookingDetails}
            appliedVoucher={appliedVoucher}
            voucherAnimating={voucherAnimating}
          />
        </div>
      </div>
    </div>
  );
}
