import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import { BookingReviewForm } from '../components/bookingReview';
import { getBookingById, type UserBooking } from '../services/profileApi';
import { getApiErrorMessage } from '../services/api';
import '../styles/pages/_booking-review.scss';

export default function BookingReviewPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<UserBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login', { state: { from: `/bookings/${bookingId}/review` }, replace: true });
      return;
    }

    const id = parseInt(bookingId ?? '', 10);
    if (!id || isNaN(id)) {
      setError('Mã đặt tour không hợp lệ.');
      setLoading(false);
      return;
    }

    getBookingById(id)
      .then((data) => setBooking(data))
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [bookingId, navigate]);

  const handleSuccess = () => {
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="booking-review-page">
        <div className="booking-review-page__loading">
          <div className="booking-review-page__spinner" />
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="booking-review-page">
        <div className="booking-review-page__error">
          <p>{error}</p>
          <button onClick={() => navigate('/profile')} className="booking-review-page__back">
            Về trang cá nhân
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="booking-review-page">
        <Breadcrumbs
          items={[
            { label: 'Trang chủ', path: '/' },
            { label: 'Cá nhân', path: '/profile' },
            { label: 'Đánh giá' },
          ]}
        />
        <div className="booking-review-page__success">
          <CheckCircle size={64} className="booking-review-page__success-icon" />
          <h2>Cảm ơn bạn đã đánh giá!</h2>
          <p>Đánh giá của bạn đã được gửi thành công và sẽ giúp những du khách khác có thêm thông tin hữu ích.</p>
          <button
            onClick={() => navigate('/profile')}
            className="booking-review-page__success-btn"
          >
            Về trang cá nhân
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-review-page">
      <Breadcrumbs
        items={[
          { label: 'Trang chủ', path: '/' },
          { label: 'Cá nhân', path: '/profile' },
          { label: 'Đánh giá tour' },
        ]}
      />

      <div className="booking-review-page__content">
        <h1 className="booking-review-page__title">Đánh giá tour của bạn</h1>
        <p className="booking-review-page__subtitle">
          Chia sẻ trải nghiệm để giúp chúng tôi cải thiện và hỗ trợ cộng đồng du khách.
        </p>

        {booking && (
          <BookingReviewForm booking={booking} onSuccess={handleSuccess} />
        )}
      </div>
    </div>
  );
}
