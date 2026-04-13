import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { getArtisanDetail } from "../../../services/artisanApi";
import type { ArtisanDetail, ArtisanNarrativeBlock } from "../../../types";
import ArtisanPagination from "../ArtisanPagination";
import "../../../styles/components/artisan/artisanDetailscss/_artisan-detail.scss";

const FALLBACK_IMG = "/dauvao.png";
const CONNECT_PAGE_SIZE = 3;

/* ── Sticky tab definitions ── */
const TABS = [
  { key: "narrative", label: "Nghệ nhân của tôi" },
  { key: "gong", label: "Cồng chiêng truyền thống" },
  { key: "culture", label: "Bảo tồn văn hoá" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

/* ── Helper: safely parse narrativeContent ── */
function parseNarrative(raw: unknown): ArtisanNarrativeBlock[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/* ── Format price ── */
function formatPrice(n: number) {
  return n.toLocaleString("vi-VN");
}

export default function ArtisanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artisan, setArtisan] = useState<ArtisanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("narrative");
  const [panoramaIdx, setPanoramaIdx] = useState(0);
  const [culturePage, setCulturePage] = useState(1);
  const [tourPage, setTourPage] = useState(1);

  const sectionRefs = useRef<Record<TabKey, HTMLElement | null>>({
    narrative: null,
    gong: null,
    culture: null,
  });

  /* ── Fetch data ── */
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getArtisanDetail(Number(id));
        if (!cancelled) setArtisan(data);
      } catch (err) {
        console.error("[ArtisanDetail] Fetch failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    setCulturePage(1);
    setTourPage(1);
  }, [id]);

  useEffect(() => {
    const n = artisan?.relatedCultureItems?.length ?? 0;
    const tp = Math.max(1, Math.ceil(n / CONNECT_PAGE_SIZE));
    setCulturePage((p) => Math.min(p, tp));
  }, [artisan?.relatedCultureItems?.length]);

  useEffect(() => {
    const n = artisan?.relatedTours?.length ?? 0;
    const tp = Math.max(1, Math.ceil(n / CONNECT_PAGE_SIZE));
    setTourPage((p) => Math.min(p, tp));
  }, [artisan?.relatedTours?.length]);

  /* ── Scroll to section ── */
  const scrollTo = useCallback((key: TabKey) => {
    setActiveTab(key);
    sectionRefs.current[key]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  /* ── Panorama slider ── */
  const images = artisan?.images ?? [];
  const panoramaImages =
    images.length > 0
      ? images
      : artisan?.panoramaImageUrl
        ? [artisan.panoramaImageUrl]
        : [];
  const prevSlide = () =>
    setPanoramaIdx((i) => (i === 0 ? panoramaImages.length - 1 : i - 1));
  const nextSlide = () =>
    setPanoramaIdx((i) => (i === panoramaImages.length - 1 ? 0 : i + 1));

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div className="ad-loading">
        <div className="ad-loading__spinner" />
        <p>Đang tải thông tin nghệ nhân...</p>
      </div>
    );
  }

  /* ---------- Not found ---------- */
  if (!artisan) {
    return (
      <div className="ad-loading">
        <p>Không tìm thấy nghệ nhân này.</p>
        <Link to="/artisans" className="ad-back-btn">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  /* ---------- Derived ---------- */
  const narrativeBlocks = parseNarrative(artisan.narrativeContent);

  const cultureItems = artisan.relatedCultureItems ?? [];
  const cultureTotalPages = Math.max(
    1,
    Math.ceil(cultureItems.length / CONNECT_PAGE_SIZE)
  );
  const culturePageSafe = Math.min(culturePage, cultureTotalPages);
  const cultureSlice = cultureItems.slice(
    (culturePageSafe - 1) * CONNECT_PAGE_SIZE,
    culturePageSafe * CONNECT_PAGE_SIZE
  );

  const tourItems = artisan.relatedTours ?? [];
  const tourTotalPages = Math.max(
    1,
    Math.ceil(tourItems.length / CONNECT_PAGE_SIZE)
  );
  const tourPageSafe = Math.min(tourPage, tourTotalPages);
  const tourSlice = tourItems.slice(
    (tourPageSafe - 1) * CONNECT_PAGE_SIZE,
    tourPageSafe * CONNECT_PAGE_SIZE
  );

  const sectionMotion = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.5 },
  };

  return (
    <div className="artisan-detail">
      {/* ═══════════ HERO — dark photo overlay ═══════════ */}
      <motion.section
        className="ad-hero-banner"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.img
          className="ad-hero-banner__bg"
          src={artisan.profileImageUrl || FALLBACK_IMG}
          alt={artisan.fullName}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <div className="ad-hero-banner__overlay" />

        <button
          className="ad-hero-banner__back"
          onClick={() => navigate("/artisans")}
          type="button"
        >
          <ArrowLeft size={20} />
        </button>

        <motion.div
          className="ad-hero-banner__content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 className="ad-hero-banner__title">{artisan.specialization}</h1>
          <p className="ad-hero-banner__subtitle">
            {artisan.heroSubtitle || artisan.bio}
          </p>
          <Link to="/tours" className="ad-hero-banner__btn">
            Khám phá ngay
          </Link>
        </motion.div>
      </motion.section>

      {/* ═══════════ INFO CARD — name, tabs, stats ═══════════ */}
      <motion.section
        className="ad-info"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="ad-info__container">
          <h2 className="ad-info__name">Nghệ nhân {artisan.fullName}</h2>

          {/* Sticky-ish tabs */}
          <nav className="ad-info__tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`ad-info__tab ${activeTab === t.key ? "ad-info__tab--active" : ""}`}
                onClick={() => scrollTo(t.key)}
                type="button"
              >
                {t.label}
              </button>
            ))}
          </nav>

          {/* Quick stats row */}
          <div className="ad-info__stats">
            <div className="ad-info__stat">
              <span className="ad-info__stat-label">Dân tộc</span>
              <span className="ad-info__stat-value">
                {artisan.ethnicity || "—"}
              </span>
            </div>
            <div className="ad-info__stat">
              <span className="ad-info__stat-label">Tuổi</span>
              <span className="ad-info__stat-value">{artisan.age || "—"}</span>
            </div>
            <div className="ad-info__stat">
              <span className="ad-info__stat-label">Nơi sinh sống</span>
              <span className="ad-info__stat-value">
                {artisan.location || "—"}
              </span>
            </div>
          </div>

          {/* Bio paragraph */}
          {artisan.bio && <p className="ad-info__bio">{artisan.bio}</p>}
        </div>
      </motion.section>

      {/* ═══════════ NARRATIVE SECTIONS ═══════════ */}
      {narrativeBlocks.length > 0 && (
        <motion.section
          className="ad-narrative"
          ref={(el) => {
            sectionRefs.current.narrative = el;
          }}
          {...sectionMotion}
        >
          <div className="ad-narrative__container">
            <h2 className="ad-narrative__heading">
              Hành trình của nghệ nhân {artisan.fullName}
            </h2>

            {narrativeBlocks.map((block, idx) => (
              <motion.div
                key={idx}
                className={`ad-narrative__block ${idx % 2 !== 0 ? "ad-narrative__block--reverse" : ""}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <div className="ad-narrative__text">
                  <h3 className="ad-narrative__block-title">{block.title}</h3>
                  <p className="ad-narrative__block-content">{block.content}</p>
                </div>
                {block.imageUrl && (
                  <div className="ad-narrative__img-wrap">
                    <img
                      src={block.imageUrl}
                      alt={block.title}
                      className="ad-narrative__img"
                      loading="lazy"
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ═══════════ PANORAMA SLIDER ═══════════ */}
      {panoramaImages.length > 0 && (
        <motion.section
          className="ad-panorama"
          ref={(el) => {
            sectionRefs.current.gong = el;
          }}
          {...sectionMotion}
        >
          <div className="ad-panorama__slider">
            <img
              className="ad-panorama__img"
              src={panoramaImages[panoramaIdx] || FALLBACK_IMG}
              alt={`Panorama ${panoramaIdx + 1}`}
            />
            {panoramaImages.length > 1 && (
              <>
                <button
                  className="ad-panorama__arrow ad-panorama__arrow--left"
                  onClick={prevSlide}
                  type="button"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  className="ad-panorama__arrow ad-panorama__arrow--right"
                  onClick={nextSlide}
                  type="button"
                >
                  <ChevronRight size={28} />
                </button>
                <div className="ad-panorama__dots">
                  {panoramaImages.map((_, i) => (
                    <span
                      key={i}
                      className={`ad-panorama__dot ${i === panoramaIdx ? "ad-panorama__dot--active" : ""}`}
                      onClick={() => setPanoramaIdx(i)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.section>
      )}

      {/* ═══════════ KẾT NỐI VĂN HOÁ — related culture + tours ═══════════ */}
      <motion.section
        className="ad-connect"
        ref={(el) => {
          sectionRefs.current.culture = el;
        }}
        {...sectionMotion}
      >
        <div className="ad-connect__container">
          <h2 className="ad-connect__heading">Kết nối văn hoá</h2>

          {cultureItems.length > 0 && (
            <>
              <h3 className="ad-connect__subheading">Văn hoá liên quan</h3>
              <div className="ad-connect__grid ad-connect__grid--3">
                {cultureSlice.map((item, i) => (
                  <motion.div
                    key={item.id}
                    className="ad-connect__card"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.08 }}
                  >
                    <div className="ad-connect__card-img-wrap">
                      <img
                        src={item.thumbnailUrl || FALLBACK_IMG}
                        alt={item.title}
                        className="ad-connect__card-img"
                        loading="lazy"
                      />
                    </div>
                    <div className="ad-connect__card-body">
                      <h4>{item.title}</h4>
                      <p>{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              {cultureTotalPages > 1 && (
                <div className="ad-connect__pagination">
                  <ArtisanPagination
                    currentPage={culturePageSafe}
                    totalPages={cultureTotalPages}
                    onPageChange={setCulturePage}
                  />
                </div>
              )}
            </>
          )}

          {tourItems.length > 0 && (
            <>
              <h3 className="ad-connect__subheading">Tour liên quan</h3>
              <div className="ad-connect__grid ad-connect__grid--3">
                {tourSlice.map((tour, i) => (
                  <motion.div
                    key={tour.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.08 }}
                  >
                    <Link to={`/tours/${tour.id}`} className="ad-connect__card ad-connect__card--tour">
                      <div className="ad-connect__card-img-wrap">
                        <img
                          src={tour.thumbnailUrl || FALLBACK_IMG}
                          alt={tour.title}
                          className="ad-connect__card-img"
                          loading="lazy"
                        />
                      </div>
                      <div className="ad-connect__card-body">
                        <h4>{tour.title}</h4>
                        <p className="ad-connect__card-price">
                          {formatPrice(tour.price)} VNĐ
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
              {tourTotalPages > 1 && (
                <div className="ad-connect__pagination">
                  <ArtisanPagination
                    currentPage={tourPageSafe}
                    totalPages={tourTotalPages}
                    onPageChange={setTourPage}
                  />
                </div>
              )}
            </>
          )}

          {/* CTA row */}
          <div className="ad-connect__cta-row">
            <Link
              to="/artisans"
              className="ad-connect__cta ad-connect__cta--outline"
            >
              Danh sách các nghệ nhân
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
