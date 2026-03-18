import { useState, useEffect } from 'react';
import { X, CheckCircle, Star } from 'lucide-react';
import BookingReviewForm from './BookingReviewForm';
import type { UserBooking } from '../../services/profileApi';
import './ReviewModal.scss';

interface ReviewModalProps {
  open: boolean;
  booking: UserBooking | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ReviewModal({ open, booking, onClose, onSuccess }: ReviewModalProps) {
  const [submitted, setSubmitted] = useState(false);

  const handleSuccess = () => {
    setSubmitted(true);
    onSuccess?.();
  };

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={`review-modal-overlay ${open ? 'review-modal-overlay--visible' : ''}`}
      onClick={(e) => e.target === e.currentTarget && !submitted && handleClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div className="review-modal">
        <button
          type="button"
          className="review-modal__close"
          onClick={handleClose}
          aria-label="Đóng"
        >
          <X size={22} />
        </button>

        {submitted ? (
          <div className="review-modal__success">
            <div className="review-modal__success-icon-wrap">
              <CheckCircle size={64} className="review-modal__success-icon" />
            </div>
            <h2 id="review-modal-title" className="review-modal__success-title">
              Cảm ơn bạn đã đánh giá!
            </h2>
            <p className="review-modal__success-text">
              Đánh giá của bạn đã được gửi thành công và sẽ giúp những du khách khác có thêm thông tin hữu ích.
            </p>
            <button
              type="button"
              className="review-modal__success-btn"
              onClick={handleClose}
            >
              Đóng
            </button>
          </div>
        ) : booking ? (
          <>
            <div className="review-modal__header">
              <div className="review-modal__header-icon">
                <Star size={24} />
              </div>
              <div>
                <h2 id="review-modal-title" className="review-modal__title">
                  Đánh giá tour của bạn
                </h2>
                <p className="review-modal__subtitle">
                  Chia sẻ trải nghiệm để giúp chúng tôi cải thiện và hỗ trợ cộng đồng du khách.
                </p>
              </div>
            </div>
            <div className="review-modal__body">
              <BookingReviewForm booking={booking} onSuccess={handleSuccess} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
