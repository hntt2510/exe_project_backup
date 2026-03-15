import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Breadcrumbs from "../../../components/Breadcrumbs";
import { getApiErrorMessage, getModuleById, getQuizById } from "../../../services/api";
import { submitQuiz } from "../../../services/learnApi";
import type { LearnQuiz } from "../../../types";
import "../../../styles/features/learn/_learn-public.scss";

function hasAuthToken(): boolean {
  return !!localStorage.getItem("accessToken");
}

function formatClock(totalSec: number): string {
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function QuizPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const quizIdFromState = (location.state as { quizId?: number } | undefined)?.quizId;
  const quizIdFromQuery = Number(new URLSearchParams(location.search).get("quizId")) || undefined;

  const [quizId, setQuizId] = useState<number | null>(quizIdFromState ?? quizIdFromQuery ?? null);
  const [quiz, setQuiz] = useState<LearnQuiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openHints, setOpenHints] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (quizId) return;
    const mid = Number(moduleId);
    if (!mid || Number.isNaN(mid)) {
      setLoading(false);
      setError("Thiếu module id.");
      return;
    }
    getModuleById(mid)
      .then((module) => {
        if (!module.quizPrompt?.id) {
          setError("Module chưa có quiz.");
          return;
        }
        setQuizId(module.quizPrompt.id);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [moduleId, quizId]);

  useEffect(() => {
    if (!quizId) return;
    let cancelled = false;
    setLoading(true);
    getQuizById(quizId)
      .then((data) => {
        if (cancelled) return;
        setQuiz(data);
        setTimeLeft((data.timeLimitMinutes ?? 0) * 60);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [quizId]);

  useEffect(() => {
    if (!quiz || timeLeft <= 0 || submitting) return;
    const timer = window.setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [quiz, timeLeft, submitting]);

  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQ = quiz?.questions.length ?? 0;

  const doSubmit = async () => {
    if (!quiz || !moduleId) return;
    const timeSpent = Math.max(0, quiz.timeLimitMinutes * 60 - timeLeft);
    const answers: Record<number, number> = {};
    quiz.questions.forEach((q) => {
      const index = selectedAnswers[q.id];
      const optionId = q.options?.[index]?.id;
      if (optionId != null) answers[q.id] = optionId;
    });

    if (hasAuthToken()) {
      setSubmitting(true);
      try {
        const apiResult = await submitQuiz(quiz.id, answers, timeSpent);
        navigate(`/learn/${moduleId}/quiz/results`, {
          state: { quizId: quiz.id, quizTitle: quiz.title, questions: quiz.questions, selectedAnswers, timeSpent, apiResult },
        });
      } catch {
        navigate(`/learn/${moduleId}/quiz/results`, {
          state: { quizId: quiz.id, quizTitle: quiz.title, questions: quiz.questions, selectedAnswers, timeSpent },
        });
      } finally {
        setSubmitting(false);
      }
    } else {
      navigate(`/learn/${moduleId}/quiz/results`, {
        state: { quizId: quiz.id, quizTitle: quiz.title, questions: quiz.questions, selectedAnswers, timeSpent },
      });
    }
  };

  useEffect(() => {
    if (!quiz || timeLeft !== 0 || submitting) return;
    void doSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, quiz, submitting]);

  if (loading) return <div className="learn-public__state">Đang tải quiz...</div>;
  if (error || !quiz) return <div className="learn-public__state">{error || "Không tải được quiz."}</div>;

  const difficultyLabel =
    quiz.difficulty === "BASIC" ? "Cơ bản" : quiz.difficulty === "INTERMEDIATE" ? "Trung bình" : "Nâng cao";

  return (
    <div className="learn-public quiz-page">
      <div className="learn-public__container">
        <Breadcrumbs
          items={[
            { label: "Học nhanh", path: "/learn" },
            { label: quiz.title || "Module", path: `/learn/${moduleId}` },
            { label: `Quiz ${quiz.totalQuestions} câu hỏi` },
          ]}
        />

        <h1 className="quiz-page__title">
          Quiz: {quiz.title} ({quiz.totalQuestions} câu - {quiz.timeLimitMinutes} phút)
        </h1>

        {/* Meta bar */}
        <div className="quiz-page__meta-bar">
          <span className="quiz-page__meta-item">
            📊 Cấp độ: <strong>{difficultyLabel}</strong>
          </span>
          <span className="quiz-page__meta-item">
            🎯 Mục tiêu: <strong>{quiz.objective || "ôn khái niệm chính"}</strong>
          </span>
          <span className="quiz-page__meta-item quiz-page__meta-item--timer">
            🔴 {formatClock(timeLeft)}
          </span>
          <span className="quiz-page__meta-item">
            Tiến độ {answeredCount}/{totalQ}
            <span className="quiz-page__meta-progress">
              <span style={{ width: `${totalQ ? (answeredCount / totalQ) * 100 : 0}%` }} />
            </span>
          </span>
        </div>

        <div className="quiz-page__layout">
          {/* Questions */}
          <main className="quiz-page__questions">
            {quiz.questions.map((question, idx) => (
              <article className="quiz-question-card" key={question.id}>
                <h3 className="quiz-question-card__title">
                  <span className="quiz-question-card__num">Câu {idx + 1}:</span> {question.questionText}
                </h3>
                <div className="quiz-question-card__options">
                  {question.options.map((opt, optionIndex) => (
                    <label
                      key={opt.id}
                      className={`quiz-option ${selectedAnswers[question.id] === optionIndex ? "quiz-option--selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        checked={selectedAnswers[question.id] === optionIndex}
                        onChange={() => setSelectedAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))}
                      />
                      <span className="quiz-option__label">{opt.label}.</span>
                      <span className="quiz-option__text">{opt.optionText}</span>
                    </label>
                  ))}
                </div>
                {question.hintText && (
                  <button
                    type="button"
                    className="quiz-question-card__hint-btn"
                    onClick={() => setOpenHints((prev) => ({ ...prev, [question.id]: !prev[question.id] }))}
                  >
                    💡 Xem gợi ý
                  </button>
                )}
                {openHints[question.id] && question.hintText && (
                  <p className="quiz-question-card__hint-text">{question.hintText}</p>
                )}
              </article>
            ))}
          </main>

          {/* Sidebar */}
          <aside className="quiz-sidebar">
            <div className="quiz-sidebar__sticky">
              {/* Clock */}
              <div className="quiz-sidebar__clock-face">
                <svg viewBox="0 0 80 80" className="quiz-sidebar__clock-icon">
                  <circle cx="40" cy="40" r="36" fill="none" stroke="#8B0000" strokeWidth="3" />
                  <line x1="40" y1="40" x2="40" y2="18" stroke="#8B0000" strokeWidth="3" strokeLinecap="round" />
                  <line x1="40" y1="40" x2="56" y2="40" stroke="#8B0000" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="quiz-sidebar__timer">{formatClock(timeLeft)}</div>
              <p className="quiz-sidebar__timer-label">Thời gian làm bài còn lại</p>

              {/* Progress dots */}
              <div className="quiz-sidebar__progress-label">Tiến độ</div>
              <div className="quiz-sidebar__dots">
                {quiz.questions.map((q) => (
                  <span
                    key={q.id}
                    className={`quiz-sidebar__dot ${selectedAnswers[q.id] != null ? "quiz-sidebar__dot--done" : ""}`}
                  />
                ))}
              </div>

              {/* Notice */}
              <div className="quiz-sidebar__notice">
                <strong>Lưu ý</strong>
                <p>Không quay lại sau khi nộp</p>
                <p>Mỗi câu chỉ 1 đáp án</p>
              </div>

              {/* Actions */}
              <button type="button" className="learn-btn quiz-sidebar__submit" disabled={submitting} onClick={() => void doSubmit()}>
                {submitting ? "Đang nộp..." : "Nộp bài"}
              </button>
              <button type="button" className="learn-btn learn-btn--ghost quiz-sidebar__back" onClick={() => navigate(`/learn/${moduleId}`)}>
                Quay về bài học
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
