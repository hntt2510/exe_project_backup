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
  type PaymentMethod,
} from '../../services/paymentApi';
import type { Tour, Province } from '../../types';
import type { ContactInfo } from '../tourBooking/ContactForm';
import type { BookingDetailsData } from '../tourBooking/BookingDetails';
import '../../styles/components/paymentMethodscss/_payment-page.scss';

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
      };

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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

    try {
      /* ---- 1. Use tourScheduleId from booking details (selected in step 1) ---- */
      const tourScheduleId = bookingDetails.tourScheduleId ?? 0;

      /* ---- 2. Create Booking ---- */
      const numParticipants = bookingDetails.participants;

      const booking = await createBooking({
        tourId: tour.id,
        tourScheduleId: tourScheduleId,
        numParticipants,
        contactName: contactInfo.fullName,
        contactPhone: contactInfo.phone,
        contactEmail: contactInfo.email,
        paymentMethod,
      });

      /* ---- 3. Create Payment (VNPay / MoMo → need redirect URL) ---- */
      if (paymentMethod === 'VNPAY' || paymentMethod === 'MOMO') {
        const payment = await createPayment({
          bookingId: booking.id,
          paymentMethod,
        });

        if (payment.paymentUrl) {
          window.location.href = payment.paymentUrl;
          return;
        }
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
      console.error('Payment failed:', err);

      // Extract real error message from Axios response (e.g. 400 body)
      let message = 'Thanh toán thất bại. Vui lòng thử lại.';
      if (axios.isAxiosError(err)) {
        const serverMsg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.response?.data?.data;
        message = serverMsg
          ? `Lỗi: ${serverMsg}`
          : `Lỗi ${err.response?.status ?? ''}: ${err.message}`;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
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
          <PaymentSidebar tour={tour} bookingDetails={bookingDetails} />
        </div>
      </div>
    </div>
  );
}
