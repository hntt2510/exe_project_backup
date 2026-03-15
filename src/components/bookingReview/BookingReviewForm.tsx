import { useState, useRef } from 'react';
import { Star, ImagePlus, X } from 'lucide-react';
import { createReview, type CreateReviewRequest } from '../../services/profileApi';
import { getApiErrorMessage } from '../../services/api';
import type { UserBooking } from '../../services/profileApi';
import './BookingReviewForm.scss';

interface BookingReviewFormProps {
  booking: UserBooking;
  onSuccess: () => void;
}

const RATING_OPTIONS = [1, 2, 3, 4, 5];
const MAX_IMAGES = 3;
const ACCEPT_IMAGES = 'image/jpeg,image/png,image/webp,image/gif';

export default function BookingReviewForm({ booking, onSuccess }: BookingReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayRating = hoverRating || rating;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter((f) => f.type.startsWith('image/'));
    const total = [...images, ...valid].slice(0, MAX_IMAGES);
    setImages(total);
    setPreviews(
      total.map((f) => URL.createObjectURL(f)),
    );
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (idx: number) => {
    URL.revokeObjectURL(previews[idx]);
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!rating) {
      setError('Vui lòng chọn số sao đánh giá.');
      return;
    }

    if (!comment.trim()) {
      setError('Vui lòng nhập nội dung đánh giá.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateReviewRequest = {
        bookingId: booking.id,
        rating,
        comment: comment.trim(),
        images: images.length ? images : undefined,
      };
      await createReview(payload);
      onSuccess();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="booking-review-form" onSubmit={handleSubmit}>
      <div className="booking-review-form__card">
        <div className="booking-review-form__tour">
          <h3 className="booking-review-form__tour-title">{booking.tourTitle}</h3>
          <p className="booking-review-form__tour-meta">
            Mã đơn: {booking.bookingCode} · Ngày khởi hành: {new Date(booking.tourDate).toLocaleDateString('vi-VN')}
          </p>
        </div>

        <div className="booking-review-form__field">
          <label className="booking-review-form__label">Đánh giá của bạn</label>
          <div className="booking-review-form__stars">
            {RATING_OPTIONS.map((value) => (
              <button
                key={value}
                type="button"
                className={`booking-review-form__star ${value <= displayRating ? 'booking-review-form__star--active' : ''}`}
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`${value} sao`}
              >
                <Star size={36} fill="currentColor" />
              </button>
            ))}
          </div>
          <p className="booking-review-form__rating-hint">
            {rating === 0 && 'Chọn số sao từ 1 đến 5'}
            {rating === 1 && 'Rất tệ'}
            {rating === 2 && 'Tệ'}
            {rating === 3 && 'Bình thường'}
            {rating === 4 && 'Tốt'}
            {rating === 5 && 'Xuất sắc'}
          </p>
        </div>

        <div className="booking-review-form__field">
          <label className="booking-review-form__label" htmlFor="review-comment">
            Nội dung đánh giá
          </label>
          <textarea
            id="review-comment"
            className="booking-review-form__textarea"
            rows={4}
            placeholder="Chia sẻ trải nghiệm của bạn về tour..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
          />
          <span className="booking-review-form__char-count">{comment.length}/1000</span>
        </div>

        <div className="booking-review-form__field">
          <label className="booking-review-form__label">Hình ảnh (tối đa {MAX_IMAGES} ảnh)</label>
          <div className="booking-review-form__images">
            {previews.map((url, idx) => (
              <div key={url} className="booking-review-form__image-wrap">
                <img src={url} alt="" className="booking-review-form__image" />
                <button
                  type="button"
                  className="booking-review-form__image-remove"
                  onClick={() => removeImage(idx)}
                  aria-label="Xóa ảnh"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {previews.length < MAX_IMAGES && (
              <label className="booking-review-form__upload">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_IMAGES}
                  multiple
                  onChange={handleImageSelect}
                  className="booking-review-form__upload-input"
                />
                <span className="booking-review-form__upload-inner">
                  <ImagePlus size={28} />
                  <span>Thêm ảnh</span>
                </span>
              </label>
            )}
          </div>
        </div>

        {error && <p className="booking-review-form__error">{error}</p>}

        <button
          type="submit"
          className="booking-review-form__submit"
          disabled={submitting}
        >
          {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
        </button>
      </div>
    </form>
  );
}
