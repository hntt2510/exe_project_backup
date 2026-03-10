import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Home, RotateCcw, HelpCircle } from 'lucide-react';
import './PaymentFailurePage.scss';

interface PaymentFailureState {
  bookingCode?: string;
  tourId?: number;
  amount?: number;
  paymentMethod?: string;
  errorCode?: string;
  errorMessage?: string;
}

export default function PaymentFailurePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as PaymentFailureState | undefined;

  const bookingCode = state?.bookingCode;
  const tourId = state?.tourId;
  const amount = state?.amount;
  const paymentMethod = state?.paymentMethod;
  const errorCode = state?.errorCode;
  const errorMessage = state?.errorMessage || 'Thanh toán không thành công';

  const handleRetryPayment = () => {
    if (bookingCode && tourId) {
      // Navigate back to payment page with booking info
      navigate(`/tours/${tourId}/booking/payment`, {
        state: { bookingCode },
      });
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleContactSupport = () => {
    // You can open a chat, email, or modal here
    window.scrollTo(0, 0);
    alert('Vui lòng liên hệ: (+84) 123-456-789 hoặc support@exe-tour.com');
  };

  return (
    <div className="payment-failure">
      <div className="payment-failure__container">
        {/* Animated error icon */}
        <div className="payment-failure__icon-wrapper">
          <div className="payment-failure__icon payment-failure__icon--error">
            <AlertCircle size={80} />
          </div>
        </div>

        {/* Main message */}
        <h1 className="payment-failure__heading">Thanh toán thất bại</h1>
        <p className="payment-failure__message">{errorMessage}</p>

        {/* Error details */}
        <div className="payment-failure__details">
          {bookingCode && (
            <div className="payment-failure__detail-item">
              <span className="payment-failure__detail-label">Mã đặt tour:</span>
              <span className="payment-failure__detail-value">{bookingCode}</span>
            </div>
          )}

          {amount && (
            <div className="payment-failure__detail-item">
              <span className="payment-failure__detail-label">Số tiền:</span>
              <span className="payment-failure__detail-value">
                {amount.toLocaleString('vi-VN')}₫
              </span>
            </div>
          )}

          {paymentMethod && (
            <div className="payment-failure__detail-item">
              <span className="payment-failure__detail-label">Phương thức:</span>
              <span className="payment-failure__detail-value">
                {paymentMethod === 'VNPAY'
                  ? 'VNPay'
                  : paymentMethod === 'MOMO'
                    ? 'MoMo'
                    : 'Tiền mặt'}
              </span>
            </div>
          )}

          {errorCode && (
            <div className="payment-failure__detail-item">
              <span className="payment-failure__detail-label">Mã lỗi:</span>
              <span className="payment-failure__detail-value">{errorCode}</span>
            </div>
          )}
        </div>

        {/* Help section */}
        <div className="payment-failure__help">
          <h3 className="payment-failure__help-title">
            <HelpCircle size={18} />
            Có thể là nguyên nhân:
          </h3>
          <ul className="payment-failure__help-list">
            <li>Số dư tài khoản không đủ</li>
            <li>Thông tin thẻ/tài khoản không chính xác</li>
            <li>Hạn mức giao dịch đã đạt tối đa</li>
            <li>Kết nối mạng bị gián đoạn</li>
            <li>Phương thức thanh toán không hỗ trợ</li>
          </ul>
        </div>

        {/* Action buttons */}
        <div className="payment-failure__actions">
          <button
            className="payment-failure__btn payment-failure__btn--primary"
            onClick={handleRetryPayment}
            disabled={!bookingCode || !tourId}
          >
            <RotateCcw size={18} />
            Thử lại
          </button>

          <button
            className="payment-failure__btn payment-failure__btn--secondary"
            onClick={handleContactSupport}
          >
            <HelpCircle size={18} />
            Liên hệ hỗ trợ
          </button>

          <button
            className="payment-failure__btn payment-failure__btn--outline"
            onClick={handleGoHome}
          >
            <Home size={18} />
            Về trang chủ
          </button>
        </div>

        {/* Additional info */}
        <div className="payment-failure__info">
          <p>
            Giao dịch của bạn có thể đã bị hủy hoặc không được hoàn thành. Tiền của bạn sẽ được hoàn lại
            trong vòng 3-5 ngày làm việc.
          </p>
          <p>
            Không nhớ mã đặt tour? Hãy kiểm tra email hoặc liên hệ với chúng tôi để tra cứu.
          </p>
        </div>
      </div>
    </div>
  );
}
