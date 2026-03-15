import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Star,
  MapPin,
  Play,
  Calendar,
  Car,
  BookOpen,
  Utensils,
  Landmark,
  HandHeart,
} from "lucide-react";

import {
  getTourById,
  getTourHighlights,
  getTourCultureItems,
  getProvinceById,
} from "../../services/api";
import type { Tour, CultureItem, Province } from "../../types";
import "../../styles/pages/tourDetail.scss";

type TabKey = "intro" | "highlights" | "videos" | "festivals" | "food";

interface TabItem {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabItem[] = [
  { key: "intro", label: "Giới thiệu chung", icon: <BookOpen size={16} /> },
  { key: "videos", label: "Videos/Story", icon: <Play size={16} /> },
  { key: "highlights", label: "Địa điểm nổi bật", icon: <MapPin size={16} /> },
  {
    key: "festivals",
    label: "Lễ hội – phong tục",
    icon: <Landmark size={16} />,
  },
  { key: "food", label: "Ẩm thực địa phương", icon: <Utensils size={16} /> },
];

const formatPrice = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value);

const parseImages = (images?: string | string[]): string[] => {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  const trimmed = String(images).trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

const renderStars = (rating: number, prefix = "star") =>
  Array.from({ length: 5 }).map((_, i) => (
    <Star
      key={`${prefix}-${i}`}
      className={`td-star ${i < Math.floor(rating) ? "td-star--active" : "td-star--inactive"}`}
    />
  ));

/** Convert any YouTube URL to embeddable format */
const toYouTubeEmbed = (url: string): string => {
  try {
    const u = new URL(url);
    // Already embed URL
    if (u.pathname.startsWith("/embed/")) return url;
    // https://www.youtube.com/watch?v=VIDEO_ID
    const vParam = u.searchParams.get("v");
    if (vParam) return `https://www.youtube.com/embed/${vParam}`;
    // https://youtu.be/VIDEO_ID
    if (u.hostname === "youtu.be") {
      const videoId = u.pathname.slice(1);
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    // https://www.youtube.com/shorts/VIDEO_ID
    const shortsMatch = u.pathname.match(/\/shorts\/([^/?]+)/);
    if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
  } catch {
    /* not a valid URL, return as-is */
  }
  return url;
};

export default function TourDetail() {
  const { id } = useParams<{ id: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [province, setProvince] = useState<Province | null>(null);
  const [highlightItems, setHighlightItems] = useState<CultureItem[]>([]);
  const [cultureItems, setCultureItems] = useState<CultureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("intro");
  const sectionRefs = useRef<Record<TabKey, HTMLElement | null>>({
    intro: null,
    highlights: null,
    videos: null,
    festivals: null,
    food: null,
  });

  useEffect(() => {
    if (!id) return;
    const tourId = Number(id);
    setLoading(true);

    const fetchData = async () => {
      try {
        const tourData = await getTourById(tourId);
        console.log(
          "[TourDetail] tour =>",
          JSON.parse(JSON.stringify(tourData)),
        );
        setTour(tourData);

        // provinceId có thể nằm ở tourData.provinceId hoặc tourData.province?.id
        const pId = tourData.provinceId || (tourData as any).province?.id;

        const [provinceData, highlights, culture] = await Promise.all([
          pId ? getProvinceById(pId) : Promise.resolve(null),
          getTourHighlights(tourId).catch(() => []),
          getTourCultureItems(tourId).catch(() => []),
        ]);

        console.log(
          "[TourDetail] highlights =>",
          JSON.parse(JSON.stringify(highlights)),
        );

        setProvince(provinceData);
        setHighlightItems(highlights);
        setCultureItems(culture);
      } catch (err) {
        console.error("Failed to load tour detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const scrollToSection = (key: TabKey) => {
    setActiveTab(key);
    sectionRefs.current[key]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  if (loading) {
    return (
      <div className="td-loading">
        <div className="td-loading__spinner" />
        <p>Đang tải thông tin tour...</p>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="td-loading">
        <p>Không tìm thấy tour này.</p>
        <Link to="/tours" className="btn btn-primary">
          Quay lại danh sách tour
        </Link>
      </div>
    );
  }

  // Deduplicate items from highlights + culture-items APIs (they may overlap)
  const allItemsMap = new Map<number, CultureItem>();
  [...highlightItems, ...cultureItems].forEach((item) => {
    if (!allItemsMap.has(item.id)) allItemsMap.set(item.id, item);
  });
  const allItems = Array.from(allItemsMap.values());

  const highlightFiltered = allItems.filter((c) =>
    ["CRAFT", "LEGEND", "INSTRUMENT"].includes(c.category),
  );
  const festivals = allItems
    .filter((c) => ["FESTIVAL", "COSTUME", "DANCE"].includes(c.category))
    .slice(0, 2);
  const foodItems = allItems.filter((c) => c.category === "FOOD");
  const videoItem = allItems.find((c) => c.videoUrl);

  // Extract enriched province info from API items (highlights/culture-items include nested province with bestSeason, etc.)
  const itemProvince = highlightItems[0]?.province || cultureItems[0]?.province;
  const bestSeason = itemProvince?.bestSeason || province?.bestSeason;
  const transportation =
    itemProvince?.transportation || province?.transportation;
  const culturalTips = itemProvince?.culturalTips || province?.culturalTips;
  const provinceName = province?.name || itemProvince?.name;

  return (
    <div className="tour-detail">
      {/* Hero */}
      <section className="td-hero">
        <img
          className="td-hero__image"
          src={tour.thumbnailUrl || "/nen.png"}
          alt={tour.title}
        />
      </section>

      {/* Tabs */}
      <nav className="td-tabs">
        <div className="td-tabs__container">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`td-tabs__item ${activeTab === tab.key ? "td-tabs__item--active" : ""}`}
              onClick={() => scrollToSection(tab.key)}
              type="button"
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* GIỚI THIỆU CHUNG */}
      <section
        className="td-section td-intro"
        ref={(el) => {
          sectionRefs.current.intro = el;
        }}
      >
        <div className="td-section__container">
          <h2 className="td-section__title td-section__title--decorated">
            GIỚI THIỆU CHUNG
          </h2>
          <div className="td-intro__grid">
            <div className="td-intro__text">
              <p>{tour.description}</p>
              {province && <p>{province.description}</p>}
            </div>
            <div className="td-intro__sidebar">
              <div className="td-quick-info">
                <h3 className="td-quick-info__title">Thông tin nhanh</h3>
                <div className="td-quick-info__item">
                  <Calendar size={16} />
                  <div>
                    <strong>Thời điểm đẹp nhất</strong>
                    <p>{bestSeason || "Liên hệ để biết thêm"}</p>
                  </div>
                </div>
                <div className="td-quick-info__item">
                  <Car size={16} />
                  <div>
                    <strong>Cách di chuyển</strong>
                    <p>
                      {transportation ||
                        (provinceName
                          ? `Từ ${provinceName}`
                          : "Liên hệ để biết thêm")}
                    </p>
                  </div>
                </div>
                <div className="td-quick-info__item">
                  <HandHeart size={16} />
                  <div>
                    <strong>Lưu ý văn hoá</strong>
                    <p>
                      {culturalTips ||
                        "Trang phục lịch sự, tôn trọng phong tục địa phương"}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/tours/${tour.id}/booking`}
                  className="btn btn-primary td-quick-info__cta"
                >
                  Đặt ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section
        className="td-section td-video"
        ref={(el) => {
          sectionRefs.current.videos = el;
        }}
      >
        <div className="td-video__wrapper">
          {videoItem?.videoUrl ? (
            <iframe
              className="td-video__player"
              src={toYouTubeEmbed(videoItem.videoUrl)}
              title={videoItem.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="td-video__placeholder">
              <img
                src={
                  parseImages(tour.images)[1] || tour.thumbnailUrl || "/nen.png"
                }
                alt="Video placeholder"
              />
              <div className="td-video__play-btn">
                <Play size={48} />
              </div>
            </div>
          )}
        </div>
        <div className="td-video__caption">
          <h3>{tour.title}</h3>
          <p>
            {tour.description
              ? tour.description.length > 120
                ? tour.description.slice(0, 120) + "..."
                : tour.description
              : `Khám phá vẻ đẹp thiên nhiên và văn hoá đặc sắc tại ${provinceName || "vùng đất này"}`}
          </p>
        </div>
      </section>

      {/* ĐỊA ĐIỂM NỔI BẬT */}
      <section
        className="td-section td-highlights"
        ref={(el) => {
          sectionRefs.current.highlights = el;
        }}
      >
        <div className="td-section__container">
          <h2 className="td-section__title td-section__title--stamp">
            ĐỊA ĐIỂM NỔI BẬT
          </h2>
          <div className="td-highlights__grid">
            {(highlightFiltered.length > 0 ? highlightFiltered : allItems)
              .slice(0, 3)
              .map((item) => (
                <article key={item.id} className="td-stamp-card">
                  <div className="td-stamp-card__image-wrapper">
                    <div className="td-stamp-card__image-frame">
                      <img
                        className="td-stamp-card__image"
                        src={item.thumbnailUrl || "/nen.png"}
                        alt={item.title}
                      />
                    </div>
                  </div>
                  <div className="td-stamp-card__content">
                    <h3 className="td-stamp-card__title">{item.title}</h3>
                    <div className="td-stamp-card__meta">
                      <span>
                        <MapPin size={14} />{" "}
                        {item.province?.name || provinceName || "Việt Nam"}
                      </span>
                    </div>
                    <p className="td-stamp-card__desc">{item.description}</p>
                  </div>
                </article>
              ))}
            {highlightFiltered.length === 0 && allItems.length === 0 && (
              <>
                {parseImages(tour.images)
                  .slice(0, 3)
                  .map((img, i) => (
                    <article key={i} className="td-stamp-card">
                      <div className="td-stamp-card__image-wrapper">
                        <div className="td-stamp-card__image-frame">
                          <img
                            className="td-stamp-card__image"
                            src={img}
                            alt={`Điểm nổi bật ${i + 1}`}
                          />
                        </div>
                      </div>
                      <div className="td-stamp-card__content">
                        <h3 className="td-stamp-card__title">
                          Điểm tham quan {i + 1}
                        </h3>
                      </div>
                    </article>
                  ))}
              </>
            )}
          </div>
        </div>
      </section>

      {/* LỄ HỘI - PHONG TỤC */}
      <section
        className="td-section td-festivals"
        ref={(el) => {
          sectionRefs.current.festivals = el;
        }}
      >
        <div className="td-section__container">
          <h2 className="td-section__title td-section__title--decorated">
            LỄ HỘI &amp; PHONG TỤC
          </h2>
          <div className="td-festivals__body">
            {/* Festival cards — max 2, left column */}
            <div className="td-festivals__cards">
              {(festivals.length > 0
                ? festivals
                : [
                    {
                      id: -1,
                      title: "Lễ hội cầu mùa",
                      description:
                        "Nghi lễ truyền thống của người Bahnar diễn ra vào đầu mùa khô, cầu mong một năm mưa thuận gió hoà, mùa màng bội thu.",
                    },
                    {
                      id: -2,
                      title: "Không gian Cồng chiêng",
                      description:
                        "Di sản văn hoá phi vật thể của nhân loại, thể hiện tâm hồn và triết lý sống của người Tây Nguyên qua âm thanh cồng chiêng.",
                    },
                  ]
              ).map((item, idx) => (
                <div key={item.id} className="td-festivals__card">
                  <div className="td-festivals__card-icon">
                    {idx === 0 ? (
                      <Calendar size={28} />
                    ) : (
                      <Landmark size={28} />
                    )}
                  </div>
                  <div className="td-festivals__card-text">
                    <h4 className="td-festivals__card-title">{item.title}</h4>
                    <p className="td-festivals__card-desc">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Cultural behavior tips — hardcoded, right column */}
            <div className="td-festivals__tips-card">
              <h4 className="td-festivals__tips-heading">
                <HandHeart size={20} />
                Lưu ý ứng xử văn hoá
              </h4>
              <ul className="td-festivals__tips-list">
                <li className="td-festivals__tip">
                  Trang phục lịch sự khi tham dự nghi lễ
                </li>
                <li className="td-festivals__tip">
                  Tôn trọng không gian sinh hoạt chung
                </li>
                <li className="td-festivals__tip">
                  Trước khi chụp ảnh người dân địa phương, hãy luôn chủ động xin
                  phép họ
                </li>
                <li className="td-festivals__tip">
                  Không làm ồn trong khu vực linh thiêng
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ẨM THỰC ĐỊA PHƯƠNG */}
      <section
        className="td-section td-food"
        ref={(el) => {
          sectionRefs.current.food = el;
        }}
      >
        <div className="td-section__container">
          <h2 className="td-section__title td-section__title--stamp">
            ẨM THỰC ĐỊA PHƯƠNG
          </h2>
          <div className="td-food__grid">
            {foodItems.length > 0 ? (
              foodItems.slice(0, 3).map((item) => (
                <article key={item.id} className="td-stamp-card">
                  <div className="td-stamp-card__image-wrapper">
                    <div className="td-stamp-card__image-frame">
                      <img
                        className="td-stamp-card__image"
                        src={item.thumbnailUrl || "/nen.png"}
                        alt={item.title}
                      />
                    </div>
                  </div>
                  <div className="td-stamp-card__content">
                    <h3 className="td-stamp-card__title">{item.title}</h3>
                    <p className="td-stamp-card__desc">{item.description}</p>
                  </div>
                </article>
              ))
            ) : (
              <div className="td-food__empty">
                <p>Thông tin ẩm thực đang được cập nhật...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="td-cta-banner">
        <div className="td-cta-banner__container">
          <h3>Sẵn sàng khám phá địa điểm này chưa?</h3>
          <p>
            Đặt tour văn hoá để trải nghiệm những nét đẹp truyền thống và thiên
            nhiên tươi đẹp nơi đây
          </p>
          <div className="td-cta-banner__buttons">
            <Link to={`/tours/${tour.id}/booking`} className="btn btn-primary">
              Đặt tour ngay
            </Link>
            <Link
              to={`/tours?province=${tour.provinceId || (tour as any).province?.id || ""}`}
              className="btn-outline"
            >
              Xem tour liên quan
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
