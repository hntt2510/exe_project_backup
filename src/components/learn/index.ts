/**
 * Learn – barrel export cho các khối UI của learn pages.
 */

// Trang danh sách module
export { default as LearnPageContent } from './LearnList';
export type { LessonGroup } from './LearnList';

// Chi tiết bài học
export {
  LessonHero,
  LessonHeader,
  LessonObjectives,
  LessonSummary,
  LessonVocabulary,
  LessonQuickNotes,
  LessonRelated,
  LessonQuizCTA,
} from './learnDetail';

// Quiz
export { QuizHeader, QuizQuestionCard, QuizSidebar } from './Quiz';
export type { QuizDifficulty } from './Quiz';

// Kết quả Quiz
export {
  QuizResultBanner,
  QuizResultSummary,
  QuizExplanationCard,
  RelatedTours,
} from './QuizResults';
