import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Breadcrumbs from '../../components/Breadcrumbs';
import { QuizHeader, QuizQuestionCard, QuizSidebar } from '../../components/learn';
import { getQuizById } from '../../services/api';
import { submitQuiz } from '../../services/learnApi';
import type { LearnQuiz, LearnQuizQuestion } from '../../types';
import '../../styles/pages/_quiz.scss';

function hasAuthToken(): boolean {
  return !!localStorage.getItem('accessToken');
}

export default function QuizPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const quizIdFromState = (location.state as { quizId?: number })?.quizId;
  const quizIdFromQuery = Number(new URLSearchParams(location.search).get('quizId')) || undefined;
  const quizId = quizIdFromState ?? quizIdFromQuery;

  const [quiz, setQuiz] = useState<LearnQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({}); // questionId -> optionIndex
  const timeLimitSeconds = quiz ? quiz.timeLimitMinutes * 60 : 0;
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!quizId) {
      setLoading(false);
      setError('Thiếu mã đề quiz. Vui lòng vào từ trang bài học.');
      return;
    }
    let cancelled = false;
    getQuizById(quizId)
      .then((data) => {
        if (!cancelled) {
          setQuiz(data);
          setTimeLeft(data.timeLimitMinutes * 60);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Không tải được đề quiz.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [quizId]);

  useEffect(() => {
    if (!quiz || timeLeft <= 0 || isSubmitted) return;
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [quiz, timeLeft, isSubmitted]);

  useEffect(() => {
    if (timeLeft !== 0 || isSubmitted || !quiz || !moduleId) return;
    setIsSubmitted(true);
    void doSubmit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isSubmitted, quiz?.id, moduleId]);

  const doSubmit = async () => {
    if (!quiz || !moduleId) return;
    const timeSpent = quiz.timeLimitMinutes * 60 - timeLeft;

    if (hasAuthToken()) {
      setSubmitting(true);
      try {
        const questionIdToOptionId = (q: LearnQuizQuestion, optIdx: number) =>
          q.options?.[optIdx]?.id ?? 0;
        const answers: Record<number, number> = {};
        quiz.questions.forEach((q) => {
          const idx = selectedAnswers[q.id];
          if (idx !== undefined) {
            answers[q.id] = questionIdToOptionId(q, idx);
          }
        });
        const result = await submitQuiz(quiz.id, answers, timeSpent);
        navigate(`/learn/${moduleId}/quiz/results`, {
          state: {
            quizId: quiz.id,
            quizTitle: quiz.title,
            questions: quiz.questions,
            selectedAnswers,
            timeSpent,
            apiResult: result,
          },
        });
      } catch (err) {
        console.error('[QuizPage] submitQuiz error:', err);
        navigate(`/learn/${moduleId}/quiz/results`, {
          state: {
            quizId: quiz.id,
            quizTitle: quiz.title,
            questions: quiz.questions,
            selectedAnswers,
            timeSpent,
          },
        });
      } finally {
        setSubmitting(false);
      }
    } else {
      navigate(`/learn/${moduleId}/quiz/results`, {
        state: {
          quizId: quiz.id,
          quizTitle: quiz.title,
          questions: quiz.questions,
          selectedAnswers,
          timeSpent,
        },
      });
    }
  };

  const handleAnswerSelect = (questionId: number, optionIndex: number) => {
    if (isSubmitted || !quiz) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = () => {
    if (!quiz || isSubmitted) return;
    setIsSubmitted(true);
    doSubmit();
  };

  if (loading) {
    return (
      <div className="quiz-page">
        <div className="quiz-page__container">
          <p className="quiz-page__loading">Đang tải đề quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="quiz-page">
        <div className="quiz-page__container">
          <p className="quiz-page__error">{error || 'Không tìm thấy đề quiz.'}</p>
          <button type="button" onClick={() => navigate(`/learn/${moduleId}`)}>
            Quay về bài học
          </button>
        </div>
      </div>
    );
  }

  const questions = quiz.questions;
  const answeredCount = Object.keys(selectedAnswers).length;
  const canSubmit = answeredCount === questions.length;

  const breadcrumbItems = [
    { label: 'Học nhanh', path: '/learn' },
    { label: 'Bài học', path: `/learn/${moduleId}` },
    { label: `Quiz: ${quiz.title}` },
  ];

  return (
    <div className="quiz-page">
      <div className="quiz-page__container">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="quiz-page__card">
        <QuizHeader
          title={quiz.title}
          questionCount={quiz.totalQuestions}
          durationMinutes={quiz.timeLimitMinutes}
          difficulty={quiz.difficulty}
          objective={quiz.objective}
          answeredCount={answeredCount}
        />

        <div className="quiz-page__content">
          <div className="quiz-page__questions">
            {questions.map((question: LearnQuizQuestion, index: number) => (
              <QuizQuestionCard
                key={question.id}
                questionNumber={index + 1}
                questionText={question.questionText}
                options={question.options.map((o) => o.optionText)}
                selectedAnswer={selectedAnswers[question.id]}
                onAnswerSelect={(optionIndex) => handleAnswerSelect(question.id, optionIndex)}
                hintText={question.hintText}
                disabled={isSubmitted}
              />
            ))}
          </div>

          <QuizSidebar
            timeLeft={timeLeft}
            totalQuestions={quiz.totalQuestions}
            answeredCount={answeredCount}
            onSubmit={handleSubmit}
            backUrl={`/learn/${moduleId}`}
            canSubmit={canSubmit && !submitting}
          />
        </div>
        </div>
      </div>
    </div>
  );
}
