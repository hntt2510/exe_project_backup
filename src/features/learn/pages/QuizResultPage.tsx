import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { message, Modal } from "antd";
import Breadcrumbs from "../../../components/Breadcrumbs";
import { getApiErrorMessage, getTours } from "../../../services/api";
import { isLearnVoucher } from "../../../services/profileApi";
import {
  claimVoucher,
  checkQuizVoucherClaimed,
  getMyClaimedVouchers,
  type ClaimedVoucherInfo,
} from "../../../services/learnApi";
import type { LearnQuizQuestion, Tour } from "../../../types";
import "../../../styles/features/learn/_learn-public.scss";

interface QuizResultState {
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
    canClaimVoucher?: boolean;
    questionResults?: Array<{
      questionId: number;
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
  };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m} phút ${s} giây`;
}

export default function QuizResultPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as QuizResultState | undefined;

  const questions = state?.questions ?? [];
  const selectedAnswers = state?.selectedAnswers ?? {};
  const apiResult = state?.apiResult;

  const [openQuestionId, setOpenQuestionId] = useState<number | null>(questions[0]?.id ?? null);
  const [relatedTours, setRelatedTours] = useState<Tour[]>([]);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimedVoucher, setClaimedVoucher] = useState<ClaimedVoucherInfo | null>(null);
  const [alreadyClaimedFromApi, setAlreadyClaimedFromApi] = useState<boolean | null>(null);
  const [alreadyClaimedModalOpen, setAlreadyClaimedModalOpen] = useState(false);

  useEffect(() => {
    if (!questions.length) navigate(`/learn/${moduleId ?? ""}`, { replace: true });
  }, [questions.length, moduleId, navigate]);

  // Kiểm tra user đã nhận voucher cho quiz này chưa (dựa vào userId)
  useEffect(() => {
    const quizId = state?.quizId;
    if (!quizId || !localStorage.getItem("accessToken")) return;
    checkQuizVoucherClaimed(quizId)
      .then((claimed) => setAlreadyClaimedFromApi(claimed))
      .catch(() => setAlreadyClaimedFromApi(null));
  }, [state?.quizId]);

  useEffect(() => {
    const loadTours = async () => {
      if (apiResult?.suggestedTours?.length) {
        const transformed = apiResult.suggestedTours.map((t) => ({
          id: t.id,
          provinceId: 0,
          provinceName: t.location,
          title: t.title,
          slug: t.slug,
          description: t.description,
          maxParticipants: 0,
          price: t.price,
          thumbnailUrl: t.thumbnailUrl ?? "/nen.png",
          images: [],
          averageRating: 0,
          totalReviews: 0,
          createdAt: "",
          updatedAt: "",
        }));
        setRelatedTours(transformed.slice(0, 3));
        return;
      }
      const allTours = await getTours();
      setRelatedTours([...allTours].slice(0, 3));
    };
    void loadTours();
  }, [apiResult?.suggestedTours]);

  const correctCount = useMemo(() => {
    if (apiResult?.correctCount != null) return apiResult.correctCount;
    return questions.filter((q) => {
      const selected = selectedAnswers[q.id];
      return selected != null && q.options?.[selected]?.isCorrect === true;
    }).length;
  }, [apiResult?.correctCount, questions, selectedAnswers]);

  const totalQuestions = apiResult?.totalQuestions ?? questions.length;
  const scorePercent = apiResult?.scorePercent ?? Math.round((correctCount / Math.max(1, totalQuestions)) * 100);
  const isPerfectScore = scorePercent >= 100;
  const canClaim = apiResult?.canClaimVoucher && apiResult?.attemptId != null;
  /** Đã nhận voucher cho quiz này rồi — không cho làm lại (từ API hoặc từ submit result) */
  const hasAlreadyClaimedForQuiz =
    claimed ||
    alreadyClaimedFromApi === true ||
    (isPerfectScore && apiResult && !canClaim);

  if (!questions.length) return null;

  return (
    <div className="learn-public quiz-result">
      <div className="learn-public__container">
        <Breadcrumbs
          items={[
            { label: "Học nhanh", path: "/learn" },
            { label: state?.quizTitle || "Module", path: `/learn/${moduleId}` },
            { label: "Kết quả Quiz" },
          ]}
        />

        {/* Banner */}
        <section className="qr-banner">
          <div className="qr-banner__icon">
            <svg viewBox="0 0 48 48" width="48" height="48">
              <circle cx="24" cy="24" r="24" fill={scorePercent >= 50 ? "#16a34a" : "#dc2626"} />
              <path
                d="M14 24l7 7 13-13"
                fill="none"
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="qr-banner__title">
            {scorePercent >= 50 ? "Chúc mừng!" : "Cố gắng thêm!"} Bạn đạt {correctCount}/{totalQuestions} câu ({scorePercent}%)
          </h1>
          <p className="qr-banner__subtitle">
            Cảm ơn bạn đã tham gia Quiz. Xem giải thích và gợi ý tour bên dưới.
          </p>
        </section>

        {/* Voucher 100% — luôn hiển thị khi đạt 100%, thể hiện rõ đã nhận voucher */}
        {isPerfectScore && (
          <section className="qr-voucher-banner">
            <div className="qr-voucher-banner__icon">🎫</div>
            <h2 className="qr-voucher-banner__title">
              {hasAlreadyClaimedForQuiz
                ? "✅ Đã nhận voucher!"
                : canClaim
                  ? "Bạn đạt 100% — Nhận voucher ngay!"
                  : "Hoàn thành xuất sắc! 100%"}
            </h2>
            <p className="qr-voucher-banner__desc">
              {claimed
                ? claimedVoucher
                  ? `Mã voucher của bạn: ${claimedVoucher.code} — ${claimedVoucher.discountType === 'PERCENTAGE' ? `${claimedVoucher.discountValue}% giảm giá` : `Giảm ${claimedVoucher.discountValue.toLocaleString('vi-VN')}đ`}. Vào Hồ sơ → Ví voucher để xem. Khi đặt tour, chọn voucher trong bước thanh toán.`
                  : "Voucher từ Learn đã được ghi nhận. (Không áp dụng giảm giá khi đặt tour.)"
                : canClaim
                  ? "Nhấn nút bên dưới để nhận voucher vào tài khoản. Voucher từ Learn không áp dụng giảm giá khi đặt tour."
                  : apiResult
                    ? "Bạn đã nhận voucher cho quiz này trước đó."
                    : "Đăng nhập và nộp bài qua hệ thống để nhận voucher."}
            </p>
            {claimed && claimedVoucher && !isLearnVoucher(claimedVoucher.code) && (
              <div className="qr-voucher-banner__code-block">
                <span className="qr-voucher-banner__code-label">Mã voucher:</span>
                <code className="qr-voucher-banner__code">{claimedVoucher.code}</code>
                <button
                  type="button"
                  className="qr-voucher-banner__copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(claimedVoucher.code);
                    message.success('Đã sao chép mã voucher!');
                  }}
                >
                  Sao chép
                </button>
              </div>
            )}
            {canClaim && !hasAlreadyClaimedForQuiz && (
              <button
                type="button"
                className="learn-btn qr-voucher-banner__btn"
                disabled={claiming || apiResult?.attemptId == null}
                onClick={async () => {
                  if (apiResult?.attemptId == null) return;
                  setClaiming(true);
                  try {
                    await claimVoucher(apiResult.attemptId);
                    setClaimed(true);
                    setAlreadyClaimedFromApi(true);
                    const list = await getMyClaimedVouchers();
                    const sorted = [...list].sort((a, b) =>
                      (b.claimedAt ?? '').localeCompare(a.claimedAt ?? '')
                    );
                    const latest = sorted[0] ?? list[0];
                    if (latest && !isLearnVoucher(latest.code)) setClaimedVoucher(latest);
                  } catch (err) {
                    const msg = getApiErrorMessage(err);
                    setAlreadyClaimedModalOpen(true);
                    setClaimed(true);
                    setAlreadyClaimedFromApi(true);
                    message.error(msg);
                  } finally {
                    setClaiming(false);
                  }
                }}
              >
                {claiming ? "Đang nhận..." : "Nhận voucher"}
              </button>
            )}
          </section>
        )}

        {/* Main layout */}
        <div className="qr-layout">
          {/* Left: Question results */}
          <main className="qr-main">
            <h2 className="qr-main__heading">Giải thích & Kết quả chi tiết</h2>
            <div className="qr-question-list">
              {questions.map((question, idx) => {
                const result = apiResult?.questionResults?.find((x) => x.questionId === question.id);
                const isOpen = openQuestionId === question.id;
                const selected = selectedAnswers[question.id];
                const correctIndex = question.options.findIndex((o) => o.isCorrect === true);
                const isCorrect = result?.isCorrect ?? (selected === correctIndex && correctIndex >= 0);

                return (
                  <article
                    key={question.id}
                    className={`qr-question ${isCorrect ? "qr-question--correct" : "qr-question--wrong"}`}
                  >
                    <button
                      type="button"
                      className="qr-question__header"
                      onClick={() => setOpenQuestionId((prev) => (prev === question.id ? null : question.id))}
                    >
                      <span className={`qr-question__icon ${isCorrect ? "qr-question__icon--ok" : "qr-question__icon--bad"}`}>
                        {isCorrect ? "✓" : "✗"}
                      </span>
                      <span className="qr-question__text">
                        <strong>Câu {idx + 1}:</strong> {question.questionText}
                      </span>
                      <span className={`qr-question__chevron ${isOpen ? "qr-question__chevron--open" : ""}`}>▼</span>
                    </button>
                    {isOpen && (
                      <div className="qr-question__body">
                        {correctIndex >= 0 && (
                          <p>
                            <strong>Đáp án đúng:</strong> {question.options[correctIndex]?.optionText}
                          </p>
                        )}
                        {result?.explanationText && (
                          <p className="qr-question__explain">
                            <strong>Giải thích:</strong> {result.explanationText}
                          </p>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </main>

          {/* Right: Summary */}
          <aside className="qr-aside">
            <div className="qr-summary">
              <h3 className="qr-summary__title">Tổng kết nhanh</h3>
              <div className="qr-summary__row">
                <span>Điểm số</span>
                <strong>{scorePercent}%</strong>
              </div>
              <div className="qr-summary__row">
                <span>Thời gian</span>
                <strong>{formatTime(state?.timeSpent ?? 0)}</strong>
              </div>
              <div className="qr-summary__row">
                <span>Số câu đúng</span>
                <strong>{correctCount}/{totalQuestions}</strong>
              </div>

              {/* Knowledge bar */}
              <div className="qr-summary__bar-wrap">
                <div className="qr-summary__bar">
                  <div className="qr-summary__bar-fill" style={{ width: `${scorePercent}%` }} />
                </div>
              </div>

              {apiResult?.canClaimVoucher && !hasAlreadyClaimedForQuiz && (
                <button
                  type="button"
                  className="learn-btn qr-summary__btn"
                  disabled={claiming || apiResult?.attemptId == null}
                  onClick={async () => {
                    if (apiResult?.attemptId == null) return;
                    setClaiming(true);
                    try {
                      await claimVoucher(apiResult.attemptId);
                      setClaimed(true);
                      setAlreadyClaimedFromApi(true);
                      const list = await getMyClaimedVouchers();
                      const sorted = [...list].sort((a, b) =>
                        (b.claimedAt ?? '').localeCompare(a.claimedAt ?? '')
                      );
                      const latest = sorted[0] ?? list[0];
                      if (latest && !isLearnVoucher(latest.code)) setClaimedVoucher(latest);
                    } catch (err) {
                      const msg = getApiErrorMessage(err);
                      setAlreadyClaimedModalOpen(true);
                      setClaimed(true);
                      setAlreadyClaimedFromApi(true);
                      message.error(msg);
                    } finally {
                      setClaiming(false);
                    }
                  }}
                >
                  {claiming ? "Đang nhận..." : "Nhận voucher"}
                </button>
              )}
              {claimed && <p className="qr-summary__claimed">✅ Đã nhận voucher!</p>}

              {hasAlreadyClaimedForQuiz ? (
                <p className="qr-summary__no-retake">
                  Bạn đã nhận voucher cho bài quiz này rồi. Không thể làm lại.
                </p>
              ) : (
                <button
                  type="button"
                  className="learn-btn qr-summary__btn"
                  onClick={() => navigate(`/learn/${moduleId}/quiz?quizId=${state?.quizId ?? ""}`)}
                >
                  Làm lại Quiz
                </button>
              )}
              <Link className="learn-btn learn-btn--ghost qr-summary__btn" to={`/learn/${moduleId}`}>
                Quay về bài học
              </Link>
            </div>
          </aside>
        </div>

        {/* Popup khi đã nhận voucher rồi */}
        <Modal
          title="Đã nhận voucher"
          open={alreadyClaimedModalOpen}
          onCancel={() => setAlreadyClaimedModalOpen(false)}
          footer={[
            <button
              key="ok"
              type="button"
              className="learn-btn"
              onClick={() => setAlreadyClaimedModalOpen(false)}
            >
              Đã hiểu
            </button>,
          ]}
          centered
        >
          <p>Bạn đã nhận voucher cho bài quiz này rồi. Không thể nhận thêm.</p>
        </Modal>

        {/* Gợi ý tour */}
        {relatedTours.length > 0 && (
          <section className="qr-tours">
            <h2 className="qr-tours__heading">TRẢI NGHIỆM VĂN HOÁ NGAY TẠI TÂY NGUYÊN</h2>
            <p className="qr-tours__subtitle">
              Chọn một tour phù hợp để chạm vào không gian cồng chiêng & đời sống bản địa.
            </p>
            <div className="qr-tours__grid">
              {relatedTours.map((tour) => (
                <Link key={tour.id} to={`/tours/${tour.id}`} className="qr-tour-card">
                  <div className="qr-tour-card__img-wrap">
                    <img
                      src={tour.thumbnailUrl || "/nen.png"}
                      alt={tour.title}
                      onError={(e) => { (e.target as HTMLImageElement).src = "/nen.png"; }}
                    />
                  </div>
                  <div className="qr-tour-card__body">
                    <h4 className="qr-tour-card__title">{tour.title}</h4>
                    <p className="qr-tour-card__desc">{tour.description}</p>
                    <div className="qr-tour-card__footer">
                      <strong>{new Intl.NumberFormat("vi-VN").format(tour.price)}VND</strong>
                      <span className="qr-tour-card__cta">Đặt ngay</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
