import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { getArtisanDetail } from "../../../services/artisanApi";
import type { ArtisanDetail, ArtisanNarrativeBlock } from "../../../types";
import Breadcrumbs from "../../Breadcrumbs";
import "../../../styles/components/artisan/artisanDetailscss/_artisan-detail.scss";

const FALLBACK_IMG = "/dauvao.png";

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
  const profileImg = artisan.profileImageUrl || FALLBACK_IMG;

  const breadcrumbItems = [
    { label: "Trang chủ", path: "/" },
    { label: "Nghệ nhân", path: "/artisans" },
    { label: artisan.fullName },
  ];

  return (
    <div className="artisan-detail">
      <Breadcrumbs items={breadcrumbItems} />

      {/* ═══════════ HERO — dark photo overlay ═══════════ */}
      <section className="ad-hero-banner">
        <img
          className="ad-hero-banner__bg"
          src={artisan.profileImageUrl || FALLBACK_IMG}
          alt={artisan.fullName}
        />
        <div className="ad-hero-banner__overlay" />

        <button
          className="ad-hero-banner__back"
          onClick={() => navigate("/artisans")}
        >
          <ArrowLeft size={20} />
        </button>

        <div className="ad-hero-banner__content">
          <h1 className="ad-hero-banner__title">{artisan.specialization}</h1>
          <p className="ad-hero-banner__subtitle">
            {artisan.heroSubtitle || artisan.bio}
          </p>
          <Link to="/tours" className="ad-hero-banner__btn">
            Khám phá ngay
          </Link>
        </div>
      </section>

      {/* ═══════════ INFO CARD — name, tabs, stats ═══════════ */}
      <section className="ad-info">
        <div className="ad-info__container">
          <h2 className="ad-info__name">Nghệ nhân {artisan.fullName}</h2>

          {/* Sticky-ish tabs */}
          <nav className="ad-info__tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`ad-info__tab ${activeTab === t.key ? "ad-info__tab--active" : ""}`}
                onClick={() => scrollTo(t.key)}
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
      </section>

      {/* ═══════════ NARRATIVE SECTIONS ═══════════ */}
      {narrativeBlocks.length > 0 && (
        <section
          className="ad-narrative"
          ref={(el) => {
            sectionRefs.current.narrative = el;
          }}
        >
          <div className="ad-narrative__container">
            <h2 className="ad-narrative__heading">
              Hành trình của nghệ nhân {artisan.fullName}
            </h2>

            {narrativeBlocks.map((block, idx) => (
              <div
                key={idx}
                className={`ad-narrative__block ${idx % 2 !== 0 ? "ad-narrative__block--reverse" : ""}`}
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
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════ PANORAMA SLIDER ═══════════ */}
      {panoramaImages.length > 0 && (
        <section
          className="ad-panorama"
          ref={(el) => {
            sectionRefs.current.gong = el;
          }}
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
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  className="ad-panorama__arrow ad-panorama__arrow--right"
                  onClick={nextSlide}
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
        </section>
      )}

      {/* ═══════════ KẾT NỐI VĂN HOÁ — related culture + tours + otherArtisans ═══════════ */}
      <section
        className="ad-connect"
        ref={(el) => {
          sectionRefs.current.culture = el;
        }}
      >
        <div className="ad-connect__container">
          <h2 className="ad-connect__heading">Kết nối văn hoá</h2>

          {/* Related culture items — hiển thị đầy đủ theo JSON */}
          {artisan.relatedCultureItems && artisan.relatedCultureItems.length > 0 && (
            <>
              <h3 className="ad-connect__subheading">Văn hoá liên quan</h3>
              <div className="ad-connect__grid">
                {artisan.relatedCultureItems.map((item) => (
                  <div key={item.id} className="ad-connect__card">
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
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Related tours — hiển thị đầy đủ theo JSON */}
          {artisan.relatedTours && artisan.relatedTours.length > 0 && (
            <>
              <h3 className="ad-connect__subheading">Tour liên quan</h3>
              <div className="ad-connect__grid">
                {artisan.relatedTours.map((tour) => (
                  <Link
                    to={`/tours/${tour.id}`}
                    key={tour.id}
                    className="ad-connect__card ad-connect__card--tour"
                  >
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
                      <p>{tour.location}</p>
                      <p className="ad-connect__card-price">
                        {formatPrice(tour.price)} VNĐ
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
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
      </section>
    </div>
  );
}
