import '../../../styles/components/learnDetail/_lesson-objectives.scss';
import type { LearnLessonDifficulty } from '../../../types';

const DIFFICULTY_LABELS: Record<LearnLessonDifficulty, string> = {
  BASIC: 'Cơ bản',
  INTERMEDIATE: 'Trung bình',
  ADVANCED: 'Nâng cao',
};

interface LessonObjectivesProps {
  objectives: string[];
  difficulty?: LearnLessonDifficulty;
  estimatedMinutes?: number;
  progressPercent?: number;
  currentIndex?: number;
  totalLessons?: number;
}

export default function LessonObjectives({
  objectives,
  difficulty,
  estimatedMinutes,
  progressPercent = 0,
  currentIndex = 0,
  totalLessons = 0,
}: LessonObjectivesProps) {
  const objectiveText = objectives.length > 0 ? objectives[0] : '';
  const difficultyLabel = difficulty ? DIFFICULTY_LABELS[difficulty] : null;
  const durationText =
    estimatedMinutes != null && estimatedMinutes > 0
      ? estimatedMinutes < 1
        ? '< 1 phút'
        : `${Math.round(estimatedMinutes)} phút`
      : null;

  return (
    <div className="lesson-objectives">
      <div className="lesson-objectives__left">
        <h2 className="lesson-objectives__title">Mục tiêu bài học</h2>
        {objectiveText && (
          <p className="lesson-objectives__text">{objectiveText}</p>
        )}
      </div>
      <div className="lesson-objectives__right">
        <div className="lesson-objectives__meta">
          {difficultyLabel && (
            <span className="lesson-objectives__meta-badge">{difficultyLabel}</span>
          )}
          {durationText && (
            <span className="lesson-objectives__meta-badge">{durationText}</span>
          )}
        </div>
        {totalLessons > 0 && (
          <div className="lesson-objectives__progress">
            <span className="lesson-objectives__progress-label">
              Tiến độ: {currentIndex + 1}/{totalLessons} bài
            </span>
            <div className="lesson-objectives__progress-bar">
              <div
                className="lesson-objectives__progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
