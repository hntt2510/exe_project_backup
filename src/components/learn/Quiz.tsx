/**
 * Learn – Quiz (gộp: QuizHeader, QuizQuestionCard, QuizSidebar)
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Target, Clock, Pin } from 'lucide-react';

// ---------------------------------------------------------------------------
// QuizHeader
// ---------------------------------------------------------------------------
export type QuizDifficulty = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';

interface QuizHeaderProps {
  title: string;
  questionCount: number;
  durationMinutes: number;
  difficulty?: QuizDifficulty;
  objective?: string;
  answeredCount: number;
}

const difficultyLabel: Record<QuizDifficulty, string> = {
  BASIC: 'Cơ bản',
  INTERMEDIATE: 'Trung bình',
  ADVANCED: 'Nâng cao',
};

export function QuizHeader({
  title,
  questionCount,
  durationMinutes,
  difficulty,
  objective,
  answeredCount,
}: QuizHeaderProps) {
  return (
    <div className="quiz-header">
      <h1 className="quiz-header__title">
        Quiz: {title} ({questionCount} câu{durationMinutes > 0 ? ` - ${durationMinutes} phút` : ''})
      </h1>
      <div className="quiz-header__meta">
        {difficulty != null && difficulty !== '' && (
          <div className="quiz-header__meta-item">
            <BarChart3 size={16} />
            <span>Cấp độ: {difficultyLabel[difficulty] ?? difficulty}</span>
          </div>
        )}
        {objective != null && objective !== '' && (
          <div className="quiz-header__meta-item">
            <Target size={16} />
            <span>Mục tiêu: {objective}</span>
          </div>
        )}
        {durationMinutes > 0 && (
          <div className="quiz-header__meta-item">
            <Clock size={16} />
            <span>{String(durationMinutes).padStart(2, '0')}:00</span>
          </div>
        )}
        <div className="quiz-header__meta-item quiz-header__meta-item--progress">
          <span>Tiến độ {answeredCount}/{questionCount}</span>
          <div className="quiz-header__progress-dots">
            {Array.from({ length: questionCount }).map((_, index) => (
              <div
                key={index}
                className={`quiz-header__progress-dot ${
                  index < answeredCount ? 'quiz-header__progress-dot--answered' : ''
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// QuizQuestionCard
// ---------------------------------------------------------------------------
interface QuizQuestionCardProps {
  questionNumber: number;
  questionText: string;
  options: string[];
  selectedAnswer?: number;
  onAnswerSelect: (optionIndex: number) => void;
  hintText?: string;
  disabled?: boolean;
}

export function QuizQuestionCard({
  questionNumber,
  questionText,
  options,
  selectedAnswer,
  onAnswerSelect,
  hintText,
  disabled = false,
}: QuizQuestionCardProps) {
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="quiz-question-card">
      <div className="quiz-question-card__header">
        <h3 className="quiz-question-card__question">
          <span className="quiz-question-card__question-number">Câu {questionNumber}:</span> {questionText}
        </h3>
      </div>
      <div className="quiz-question-card__options">
        {options.map((optionText, index) => {
          const isSelected = selectedAnswer === index;
          const optionLabel = String.fromCharCode(65 + index);
          return (
            <button
              key={index}
              type="button"
              className={`quiz-question-card__option ${isSelected ? 'quiz-question-card__option--selected' : ''}`}
              onClick={() => !disabled && onAnswerSelect(index)}
              disabled={disabled}
            >
              <span className="quiz-question-card__option-label">{optionLabel}.</span>
              <span className="quiz-question-card__option-text">{optionText}</span>
            </button>
          );
        })}
      </div>
      {hintText != null && hintText !== '' && (
        <div className="quiz-question-card__hint">
          <button
            type="button"
            className="quiz-question-card__hint-btn"
            onClick={() => setShowHint(!showHint)}
          >
            <Pin size={14} />
            <span>Xem gợi ý</span>
          </button>
          {showHint && (
            <div className="quiz-question-card__hint-content">{hintText}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// QuizSidebar
// ---------------------------------------------------------------------------
interface QuizSidebarProps {
  timeLeft: number;
  totalQuestions: number;
  answeredCount: number;
  onSubmit: () => void;
  backUrl: string;
  canSubmit?: boolean;
}

export function QuizSidebar({
  timeLeft,
  totalQuestions,
  answeredCount,
  onSubmit,
  backUrl,
  canSubmit = false,
}: QuizSidebarProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="quiz-sidebar">
      <div className="quiz-sidebar__card">
      <div className="quiz-sidebar__timer-card">
        <Clock size={64} className="quiz-sidebar__timer-icon" />
        <div className="quiz-sidebar__timer-text">{formatTime(timeLeft)}</div>
        <div className="quiz-sidebar__timer-label">Thời gian làm bài còn lại</div>
        <div className="quiz-sidebar__progress-dots">
          {Array.from({ length: totalQuestions }).map((_, index) => (
            <div
              key={index}
              className={`quiz-sidebar__progress-dot ${
                index < answeredCount
                  ? 'quiz-sidebar__progress-dot--answered'
                  : index === answeredCount
                  ? 'quiz-sidebar__progress-dot--current'
                  : ''
              }`}
            />
          ))}
        </div>
      </div>
      <div className="quiz-sidebar__notes">
        <strong>Lưu ý</strong>
        <p>Không quay lại sau khi nộp</p>
        <p>Mỗi câu chỉ 1 đáp án</p>
      </div>
      <div className="quiz-sidebar__actions">
        <button
          className="quiz-sidebar__submit-btn"
          onClick={onSubmit}
          disabled={!canSubmit}
        >
          Nộp bài
        </button>
        <Link to={backUrl} className="quiz-sidebar__back-btn">
          Quay về bài học
        </Link>
      </div>
      </div>
    </div>
  );
}
