/**
 * Learn – Kết quả Quiz (gộp: QuizResultBanner, QuizResultSummary, QuizExplanationCard, RelatedTours)
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import type { Tour } from '../../types';
import TourCard from '../tour/TourCard';

// ---------------------------------------------------------------------------
// QuizResultBanner
// ---------------------------------------------------------------------------
interface QuizResultBannerProps {
  correctCount?: number;
  totalCount: number;
  percentage?: number;
  submittedOnly?: boolean;
}

export function QuizResultBanner({
  correctCount,
  totalCount,
  percentage,
  submittedOnly,
}: QuizResultBannerProps) {
  const showScore = !submittedOnly && correctCount !== undefined && totalCount > 0;

  return (
    <div className="quiz-result-banner">
      <div className="quiz-result-banner__icon">
        <CheckCircle size={48} />
      </div>
      <h1 className="quiz-result-banner__title">
        {showScore
          ? `Chúc mừng! Bạn đạt ${correctCount}/${totalCount} câu${percentage != null ? ` (${percentage}%)` : ''}`
          : 'Bạn đã hoàn thành bài quiz'}
      </h1>
      <p className="quiz-result-banner__subtitle">
        {showScore
          ? 'Cảm ơn bạn đã tham gia Quiz. Xem giải thích và gợi ý tour bên dưới.'
          : 'Cảm ơn bạn đã tham gia Quiz.'}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// QuizResultSummary
// ---------------------------------------------------------------------------
interface QuizResultSummaryProps {
  score?: number;
  timeSpent: number;
  correctCount?: number;
  totalCount: number;
  retakeUrl: string;
  backUrl: string;
  canClaimVoucher?: boolean;
  onClaimVoucher?: () => void;
  isClaimingVoucher?: boolean;
}

export function QuizResultSummary({
  score,
  timeSpent,
  correctCount,
  totalCount,
  retakeUrl,
  backUrl,
  canClaimVoucher,
  onClaimVoucher,
  isClaimingVoucher,
}: QuizResultSummaryProps) {
  const navigate = useNavigate();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} phút ${secs.toString().padStart(2, '0')} giây`;
  };

  const showScore = score !== undefined;
  const showCorrectCount = correctCount !== undefined;

  return (
    <div className="quiz-result-summary">
      <h3 className="quiz-result-summary__title">Tổng kết nhanh</h3>
      <div className="quiz-result-summary__metrics">
        {showScore && (
          <div className="quiz-result-summary__metric">
            <span className="quiz-result-summary__metric-label">Điểm số</span>
            <span className="quiz-result-summary__metric-value">{score}%</span>
          </div>
        )}
        <div className="quiz-result-summary__metric">
          <span className="quiz-result-summary__metric-label">Thời gian</span>
          <span className="quiz-result-summary__metric-value">{formatTime(timeSpent)}</span>
        </div>
        {showCorrectCount && (
          <div className="quiz-result-summary__metric">
            <span className="quiz-result-summary__metric-label">Số câu đúng</span>
            <span className="quiz-result-summary__metric-value">{correctCount}/{totalCount}</span>
          </div>
        )}
      </div>
      {showScore && (
        <div className="quiz-result-summary__progress-section">
          <div className="quiz-result-summary__progress-label">Tiến độ</div>
          <div className="quiz-result-summary__progress-bar">
            <div
              className="quiz-result-summary__progress-fill"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      )}
      {canClaimVoucher && onClaimVoucher && (
        <button
          type="button"
          className="quiz-result-summary__claim-btn"
          onClick={onClaimVoucher}
          disabled={isClaimingVoucher}
        >
          {isClaimingVoucher ? 'Đang xử lý...' : 'Nhận voucher'}
        </button>
      )}
      <div className="quiz-result-summary__actions">
        <button
          type="button"
          className="quiz-result-summary__retake-btn"
          onClick={() => navigate(retakeUrl)}
        >
          Làm lại Quiz
        </button>
        <Link to={backUrl} className="quiz-result-summary__back-btn">
          Quay về bài học
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// QuizExplanationCard
// ---------------------------------------------------------------------------
interface QuizExplanationCardProps {
  questionNumber: number;
  questionText: string;
  options: string[];
  selectedAnswer?: number;
  correctAnswer?: number;
  explanation?: string;
}

export function QuizExplanationCard({
  questionNumber,
  questionText,
  options,
  selectedAnswer,
  correctAnswer,
  explanation,
}: QuizExplanationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasCorrectAnswer = correctAnswer !== undefined && correctAnswer >= 0;
  const isCorrect = hasCorrectAnswer && selectedAnswer === correctAnswer;

  return (
    <div className={`quiz-explanation-card ${isExpanded ? 'quiz-explanation-card--expanded' : ''}`}>
      <div
        className="quiz-explanation-card__header"
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => e.key === 'Enter' && setIsExpanded((v) => !v)}
        role="button"
        tabIndex={0}
      >
        {hasCorrectAnswer && (
          <div className="quiz-explanation-card__status">
            {isCorrect ? (
              <CheckCircle size={24} className="quiz-explanation-card__icon--correct" />
            ) : (
              <XCircle size={24} className="quiz-explanation-card__icon--wrong" />
            )}
          </div>
        )}
        <div className="quiz-explanation-card__question">
          Câu {questionNumber}: {questionText}
        </div>
        <ChevronDown
          size={20}
          className={`quiz-explanation-card__chevron ${isExpanded ? 'quiz-explanation-card__chevron--expanded' : ''}`}
        />
      </div>
      {isExpanded && (
        <div className="quiz-explanation-card__content">
          {hasCorrectAnswer && (
            <div className="quiz-explanation-card__correct-answer">
              <strong>Đáp án đúng:</strong> {String.fromCharCode(65 + correctAnswer)}. {options[correctAnswer]}
            </div>
          )}
          {selectedAnswer !== undefined && selectedAnswer >= 0 && (
            <div className="quiz-explanation-card__your-answer">
              <strong>Bạn chọn:</strong> {String.fromCharCode(65 + selectedAnswer)}. {options[selectedAnswer]}
            </div>
          )}
          {explanation != null && explanation !== '' && (
            <div className="quiz-explanation-card__explanation">
              <strong>Giải thích:</strong> {explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface RelatedToursProps {
  tours: Tour[];
}

export function RelatedTours({ tours }: RelatedToursProps) {
  const topTours = tours.slice(0, 3);

  if (!topTours.length) return null;

  return (
    <div className="related-tours">
      <h2 className="related-tours__title">TRẢI NGHIỆM VĂN HOÁ NGAY TẠI TÂY NGUYÊN</h2>
      <p className="related-tours__subtitle">
        Chọn một tour phù hợp để chạm vào không gian cồng chiêng & đời sống bản địa.
      </p>
      <div className="related-tours__grid">
        {topTours.map((tour) => (
          <TourCard key={tour.id} tour={tour} />
        ))}
      </div>
    </div>
  );
}
