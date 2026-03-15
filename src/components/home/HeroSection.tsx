import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import '../../styles/components/_hero-section.scss';

const AUTO_RUN_DELAY = 7000;
const ANIM_DURATION = 3000;

const slides = [
  {
    src: '/home/slider/anh1.jpg',
    alt: 'Văn hóa Tây Nguyên - Lễ hội Cồng Chiêng',
    title: 'Lễ hội Cồng Chiêng',
    subtitle: 'Di sản văn hóa phi vật thể UNESCO',
    description: 'Khám phá âm thanh cồng chiêng vang vọng giữa đại ngàn, nét văn hóa đặc trưng của đồng bào Tây Nguyên được UNESCO công nhận.',
  },
  {
    src: '/home/slider/anh2.jpg',
    alt: 'Văn hóa Tây Nguyên - Cà phê Buôn Ma Thuột',
    title: 'Cà phê Buôn Ma Thuột',
    subtitle: 'Hương vị đậm đà của đất đỏ bazan',
    description: 'Trải nghiệm hương cà phê rang xay thơm lừng từ thủ phủ cà phê Việt Nam, nơi hội tụ tinh hoa của đất đỏ bazan.',
  },
  {
    src: '/home/slider/anh3.jpg',
    alt: 'Văn hóa Tây Nguyên - Thổ cẩm truyền thống',
    title: 'Thổ cẩm truyền thống',
    subtitle: 'Nghệ thuật dệt may độc đáo',
    description: 'Chiêm ngưỡng nghệ thuật dệt thổ cẩm truyền thống với hoa văn độc đáo, kể câu chuyện văn hóa qua từng sợi chỉ.',
  },
  {
    src: '/home/slider/anh4.jpg',
    alt: 'Văn hóa Tây Nguyên - Nhà rông',
    title: 'Nhà rông Tây Nguyên',
    subtitle: 'Kiến trúc độc đáo của vùng cao',
    description: 'Khám phá nhà rông - trái tim của buôn làng Tây Nguyên, biểu tượng kiến trúc và văn hóa cộng đồng.',
  },
];

export default function HeroSection() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const resetAutoTimer = useCallback(() => {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    autoTimerRef.current = setTimeout(nextSlide, AUTO_RUN_DELAY);
  }, [nextSlide]);

  const resetProgressBar = useCallback(() => {
    setProgressKey((k) => k + 1);
  }, []);

  const goNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    nextSlide();
    resetAutoTimer();
    resetProgressBar();
    setTimeout(() => setIsTransitioning(false), ANIM_DURATION);
  }, [nextSlide, resetAutoTimer, resetProgressBar, isTransitioning]);

  const goPrev = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    resetAutoTimer();
    resetProgressBar();
    setTimeout(() => setIsTransitioning(false), ANIM_DURATION);
  }, [resetAutoTimer, resetProgressBar, isTransitioning]);

  useEffect(() => {
    resetAutoTimer();
    resetProgressBar();
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, [resetAutoTimer, resetProgressBar, currentSlide]);

  const activeSlide = slides[currentSlide];

  return (
    <section className="hero-section" aria-label="Hero slider">
      {/* Full-width carousel: background image fills entire section */}
      <div
        className="hero-section__carousel"
        style={{ backgroundImage: `url('${activeSlide.src}')` }}
      >
        {/* Progress bar (time running) - ref from image-slider */}
        <div key={progressKey} className="hero-section__progress" />

        {/* Left content overlay - ref: .list .item .content */}
        <div className="hero-section__content">
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
              onClick={() => navigate('/tour')}
            >
              Khám phá ngay
              <ArrowRight size={18} />
            </button>
            <button
              type="button"
              className="hero-section__button hero-section__button--secondary"
              onClick={() => navigate('/about')}
            >
              Về chúng tôi
            </button>
          </div>

          {/* Slider arrows - ref: .arrows */}
          <div className="hero-section__arrows">
            <button
              type="button"
              className="hero-section__arrow hero-section__arrow--prev"
              onClick={goPrev}
              aria-label="Trước"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="hero-section__arrow hero-section__arrow--next"
              onClick={goNext}
              aria-label="Tiếp"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Cards ảnh bên phải, nút <> giữa phía dưới */}
        <div className="hero-section__thumbnails">
          <div className="hero-section__thumbnails-list">
            {slides.map((slide, idx) => (
              <div
                key={idx}
                className={`hero-section__thumb-item ${
                  idx === currentSlide ? 'hero-section__thumb-item--active' : ''
                }`}
                onClick={() => {
                  if (idx !== currentSlide) {
                    setCurrentSlide(idx);
                    resetAutoTimer();
                    resetProgressBar();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && idx !== currentSlide) {
                    setCurrentSlide(idx);
                    resetAutoTimer();
                    resetProgressBar();
                  }
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
          <div className="hero-section__thumb-arrows">
            <button
              type="button"
              className="hero-section__thumb-arrow"
              onClick={goPrev}
              aria-label="Trước"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="hero-section__thumb-arrow"
              onClick={goNext}
              aria-label="Tiếp"
            >
              <ChevronRight size={16} />
            </button>
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
            onClick={() => {
              setCurrentSlide(idx);
              resetAutoTimer();
              resetProgressBar();
            }}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
