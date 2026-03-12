import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Breadcrumbs from '../../components/Breadcrumbs';
import {
  QuizResultBanner,
  QuizResultSummary,
  QuizExplanationCard,
  RelatedTours,
} from '../../components/learn';
import { getTours } from '../../services/api';
import { claimVoucher } from '../../services/learnApi';
import type { LearnQuizQuestion, Tour } from '../../types';
import '../../styles/pages/_quiz-results.scss';

interface QuizResultsState {
  quizId?: number;
  quizTitle?: string;
  questions?: LearnQuizQuestion[];
  selectedAnswers?: Record<number, number>;
  timeSpent?: number;
  apiResult?: {
    attemptId?: number;
    correctCount: number;
    totalQuestions: number;
    scorePercent: number;
    questionResults?: Array<{
      questionId: number;
      questionText: string;
      userAnswerText?: string | null;
      correctAnswerText?: string | null;
      explanationText?: string | null;
      isCorrect?: boolean;
    }>;
    suggestedTours?: Array<{
      id: number;
      title: string;
      slug: string;
      thumbnailUrl: string;
      location: string;
      description: string;
      price: number;
    }>;
    canClaimVoucher?: boolean;
  };
}

export default function QuizResultsPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as QuizResultsState | undefined;
  const questions = state?.questions ?? [];
  const selectedAnswers = state?.selectedAnswers ?? {};
  const timeSpent = state?.timeSpent ?? 0;
  const apiResult = state?.apiResult;

  const [relatedTours, setRelatedTours] = useState<Tour[]>([]);
  const [isClaimingVoucher, setIsClaimingVoucher] = useState(false);
  const [voucherClaimed, setVoucherClaimed] = useState(false);

  useEffect(() => {
    if (!questions.length) {
      navigate(`/learn/${moduleId ?? ''}`, { replace: true });
    }
  }, [questions.length, moduleId, navigate]);

  useEffect(() => {
    const loadTours = async () => {
      try {
        // Nếu API kết quả quiz có gợi ý tour thì ưu tiên dùng, nhưng không filter theo tỉnh
        if (apiResult?.suggestedTours?.length) {
          const normalized = apiResult.suggestedTours
            .map<Tour>((t) => ({
              id: t.id,
              provinceId: 0,
              provinceName: t.location,
              title: t.title,
              slug: t.slug,
              description: t.description,
              bestSeason: undefined,
              transportation: undefined,
              culturalTips: undefined,
              durationHours: undefined,
              maxParticipants: 0,
              price: t.price,
              thumbnailUrl: t.thumbnailUrl ?? '/nen.png',
              images: [],
              artisanId: undefined,
              artisanName: undefined,
              averageRating: 0,
            }))
            .slice(0, 3);

          if (normalized.length === 3) {
            setRelatedTours(normalized);
            return;
          }
        }

        // Nếu không đủ 3, fallback: lấy 3 tour cũ nhất từ toàn bộ tour public
        const allTours = await getTours();
        const sorted = [...allTours].sort((a, b) => {
          const da = new Date(a.createdAt ?? '').getTime() || 0;
          const db = new Date(b.createdAt ?? '').getTime() || 0;
          if (da && db) return da - db;
          return (a.id - b.id); // fallback sort by id
        });
        setRelatedTours(sorted.slice(0, 3));
      } catch {
        // Nếu lỗi, giữ nguyên (không hiển thị Related Tours)
      }
    };

    void loadTours();
  }, [apiResult?.suggestedTours]);

  const totalCount = questions.length;
  const correctCount =
    apiResult?.correctCount ??
    (questions.some((q) => q.options?.some((o) => o.isCorrect === true))
      ? questions.filter((q) => {
          const idx = selectedAnswers[q.id];
          return idx !== undefined && q.options?.[idx]?.isCorrect === true;
        }).length
      : undefined);
  const percentage =
    apiResult?.scorePercent ??
    (totalCount > 0 && correctCount !== undefined
      ? Math.round((correctCount / totalCount) * 100)
      : undefined);

  const breadcrumbItems = [
    { label: 'Học nhanh', path: '/learn' },
    { label: 'Bài học', path: `/learn/${moduleId ?? ''}` },
    { label: 'Kết quả Quiz' },
  ];

  if (!questions.length) {
    return null;
  }

  return (
    <div className="quiz-results-page">
      <div className="quiz-results-page__container">
        <Breadcrumbs items={breadcrumbItems} />

        <QuizResultBanner
          correctCount={correctCount}
          totalCount={totalCount}
          percentage={percentage}
          submittedOnly={correctCount === undefined}
        />

        <div className="quiz-results-page__content">
          <div className="quiz-results-page__main">
            <h2 className="quiz-results-page__section-title">
              Giải thích & Kết quả chi tiết
            </h2>

            {questions.map((question, index) => {
              const optionTexts = question.options?.map((o) => o.optionText) ?? [];
              const correctIndex =
                question.options?.findIndex((o) => o.isCorrect === true) ?? -1;

              const apiQuestionResult = apiResult?.questionResults?.find(
                (qr) => qr.questionId === question.id
              );

              return (
                <QuizExplanationCard
                  key={question.id}
                  questionNumber={index + 1}
                  questionText={question.questionText}
                  options={optionTexts}
                  selectedAnswer={selectedAnswers[question.id]}
                  correctAnswer={correctIndex >= 0 ? correctIndex : undefined}
                  explanation={apiQuestionResult?.explanationText ?? undefined}
                />
              );
            })}
          </div>

          <div className="quiz-results-page__sidebar">
            <QuizResultSummary
              score={percentage}
              timeSpent={timeSpent}
              correctCount={correctCount}
              totalCount={totalCount}
              retakeUrl={`/learn/${moduleId}/quiz${state?.quizId ? `?quizId=${state.quizId}` : ''}`}
              backUrl={`/learn/${moduleId}`}
              canClaimVoucher={!voucherClaimed && apiResult?.canClaimVoucher === true}
              onClaimVoucher={
                apiResult?.attemptId != null
                  ? async () => {
                      setIsClaimingVoucher(true);
                      try {
                        await claimVoucher(apiResult.attemptId!);
                        setVoucherClaimed(true);
                      } finally {
                        setIsClaimingVoucher(false);
                      }
                    }
                  : undefined
              }
              isClaimingVoucher={isClaimingVoucher}
            />
          </div>
        </div>

        {relatedTours.length > 0 && <RelatedTours tours={relatedTours} />}
      </div>
    </div>
  );
}
