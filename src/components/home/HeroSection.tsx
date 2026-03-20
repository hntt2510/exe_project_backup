import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import '../../styles/components/_hero-section.scss';

const AUTO_RUN_DELAY = 7000;

const slides = [
  {
    src: '/home/slider/anh1.webp',
    alt: 'Văn hóa Tây Nguyên - Lễ hội Cồng Chiêng',
    title: 'Lễ hội Cồng Chiêng',
    subtitle: 'Di sản văn hóa phi vật thể UNESCO',
    description: 'Khám phá âm thanh cồng chiêng vang vọng giữa đại ngàn, nét văn hóa đặc trưng của đồng bào Tây Nguyên được UNESCO công nhận.',
  },
  {
    src: '/home/slider/anh2.webp',
    alt: 'Văn hóa Tây Nguyên - Cà phê Buôn Ma Thuột',
    title: 'Cà phê Buôn Ma Thuột',
    subtitle: 'Hương vị đậm đà của đất đỏ bazan',
    description: 'Trải nghiệm hương cà phê rang xay thơm lừng từ thủ phủ cà phê Việt Nam, nơi hội tụ tinh hoa của đất đỏ bazan.',
  },
  {
    src: '/home/slider/anh3.webp',
    alt: 'Văn hóa Tây Nguyên - Thổ cẩm truyền thống',
    title: 'Thổ cẩm truyền thống',
    subtitle: 'Nghệ thuật dệt may độc đáo',
    description: 'Chiêm ngưỡng nghệ thuật dệt thổ cẩm truyền thống với hoa văn độc đáo, kể câu chuyện văn hóa qua từng sợi chỉ.',
  },
  {
    src: '/home/slider/anh4.webp',
    alt: 'Văn hóa Tây Nguyên - Nhà rông',
    title: 'Nhà rông Tây Nguyên',
    subtitle: 'Kiến trúc độc đáo của vùng cao',
    description: 'Khám phá nhà rông - trái tim của buôn làng Tây Nguyên, biểu tượng kiến trúc và văn hóa cộng đồng.',
  },
];

const ZOOM_DURATION_MS = 700;

export default function HeroSection() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const [contentKey, setContentKey] = useState(0); // Trigger fade-in cho chữ khi đổi slide
  const [zoomState, setZoomState] = useState<{
    from: { left: number; top: number; width: number; height: number; scaleX: number; scaleY: number };
    targetIdx: number;
  } | null>(null);
  const thumbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setContentKey((k) => k + 1);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setContentKey((k) => k + 1);
  }, []);

  const resetAutoTimer = useCallback(() => {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    autoTimerRef.current = setTimeout(nextSlide, AUTO_RUN_DELAY);
  }, [nextSlide]);

  const resetProgressBar = useCallback(() => {
    setProgressKey((k) => k + 1);
  }, []);

  const handleThumbClickFallback = useCallback(
    (idx: number) => {
      resetAutoTimer();
      resetProgressBar();
      setCurrentSlide(idx);
      setContentKey((k) => k + 1);
    },
    [resetAutoTimer, resetProgressBar]
  );

  const handleThumbClick = useCallback(
    (idx: number, el: HTMLDivElement | null) => {
      if (idx === currentSlide) return;
      if (!el) {
        handleThumbClickFallback(idx);
        return;
      }
      const rect = el.getBoundingClientRect();
      const carousel = el.closest('.hero-section__carousel');
      const carouselRect = carousel?.getBoundingClientRect();
      if (!carouselRect) {
        handleThumbClickFallback(idx);
        return;
      }
      const left = rect.left - carouselRect.left;
      const top = rect.top - carouselRect.top;
      const scaleX = rect.width / carouselRect.width;
      const scaleY = rect.height / carouselRect.height;
      resetAutoTimer();
      resetProgressBar();
      setZoomState({
        from: {
          left,
          top,
          width: rect.width,
          height: rect.height,
          scaleX,
          scaleY,
        },
        targetIdx: idx,
      });
      // Khi zoom xong: cập nhật slide + remove overlay (không animation, tránh giật)
      setTimeout(() => {
        setCurrentSlide(idx);
        setZoomState(null);
        setContentKey((k) => k + 1);
      }, ZOOM_DURATION_MS);
    },
    [currentSlide, resetAutoTimer, resetProgressBar, handleThumbClickFallback]
  );

  const handleThumbRef = useCallback((el: HTMLDivElement | null, idx: number) => {
    thumbRefs.current[idx] = el;
  }, []);

  const handleDotClick = useCallback(
    (idx: number) => {
      if (idx !== currentSlide) {
        resetAutoTimer();
        resetProgressBar();
        setCurrentSlide(idx);
        setContentKey((k) => k + 1);
      }
    },
    [currentSlide, resetAutoTimer, resetProgressBar]
  );

  const handleArrowPrev = useCallback(() => {
    resetAutoTimer();
    resetProgressBar();
    prevSlide();
  }, [resetAutoTimer, resetProgressBar, prevSlide]);

  const handleArrowNext = useCallback(() => {
    resetAutoTimer();
    resetProgressBar();
    nextSlide();
  }, [resetAutoTimer, resetProgressBar, nextSlide]);

  useEffect(() => {
    resetAutoTimer();
    resetProgressBar();
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, [resetAutoTimer, resetProgressBar, currentSlide]);

  // Preload ảnh slide tiếp theo + tất cả slide khi mount để giảm giật
  useEffect(() => {
    const nextIdx = (currentSlide + 1) % slides.length;
    const img = new Image();
    img.src = slides[nextIdx].src;
  }, [currentSlide]);

  useEffect(() => {
    slides.forEach((s) => {
      const img = new Image();
      img.src = s.src;
    });
  }, []);

  const activeSlide = slides[currentSlide];

  return (
    <section className="hero-section" aria-label="Hero slider">
      {/* Full-width carousel: background image fills entire section */}
      <div
        className="hero-section__carousel"
        style={{ backgroundImage: `url('${activeSlide.src}')` }}
      >
        {/* Zoom overlay - ảnh nhỏ phóng to thay thế ảnh lớn */}
        {zoomState && (
          <div
            className="hero-section__zoom-overlay"
            style={{
              '--zoom-from-left': `${zoomState.from.left}px`,
              '--zoom-from-top': `${zoomState.from.top}px`,
              '--zoom-scale-x': zoomState.from.scaleX,
              '--zoom-scale-y': zoomState.from.scaleY,
              backgroundImage: `url('${slides[zoomState.targetIdx].src}')`,
            } as React.CSSProperties}
          />
        )}

        {/* Progress bar */}
        <div key={progressKey} className="hero-section__progress" />

        {/* Left content - fade in khi đổi slide */}
        <div key={contentKey} className="hero-section__content">
          <div className="hero-section__brand">VĂN HÓA TÂY NGUYÊN</div>
          <h1 className="hero-section__heading">
            BẢO TỒN VÀ{' '}
            <span className="hero-section__heading-accent">{activeSlide.title}</span>
          </h1>
          <p className="hero-section__description">{activeSlide.description}</p>
          <div className="hero-section__buttons">
            <button
              type="button"
              className="hero-section__button hero-section__button--primary"
              onClick={() => navigate('/blog')}
            >
              Khám phá ngay
              <ArrowRight size={18} />
            </button>
            <button
              type="button"
              className="hero-section__button hero-section__button--secondary"
              onClick={() => navigate('/tours')}
            >
              Xem tour
            </button>
          </div>
        </div>

        {/* Nút mũi tên < > - chỉ hiện trên mobile */}
        <div className="hero-section__arrows">
          <button
            type="button"
            className="hero-section__arrow hero-section__arrow--prev"
            onClick={handleArrowPrev}
            aria-label="Ảnh trước"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            className="hero-section__arrow hero-section__arrow--next"
            onClick={handleArrowNext}
            aria-label="Ảnh sau"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Cards ảnh bên phải - ẩn trên mobile */}
        <div className="hero-section__thumbnails">
          <div className="hero-section__thumbnails-list">
            {slides.map((slide, idx) => (
              <div
                key={idx}
                ref={(el) => handleThumbRef(el, idx)}
                className={`hero-section__thumb-item ${
                  idx === currentSlide ? 'hero-section__thumb-item--active' : ''
                }`}
                onClick={(e) => handleThumbClick(idx, (e.currentTarget as HTMLDivElement))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleThumbClick(idx, thumbRefs.current[idx] ?? null);
                }}
                role="button"
                tabIndex={0}
              >
                <div
                  className="hero-section__thumb-image"
                  style={{ backgroundImage: `url('${slide.src}')` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dots - mobile only */}
      <div className="hero-section__dots">
        {slides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            className={`hero-section__dot ${
              idx === currentSlide ? 'hero-section__dot--active' : ''
            }`}
            onClick={() => handleDotClick(idx)}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
