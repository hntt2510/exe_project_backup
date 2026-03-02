import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, Play } from 'lucide-react';
import '../../styles/components/_hero-section.scss';

const sliderImages = [
  { 
    src: '/home/slider/anh1.jpg', 
    alt: 'Văn hóa Tây Nguyên - Lễ hội Cồng Chiêng',
    title: 'Lễ hội Cồng Chiêng',
    subtitle: 'Di sản văn hóa phi vật thể UNESCO'
  },
  { 
    src: '/home/slider/anh2.jpg', 
    alt: 'Văn hóa Tây Nguyên - Cà phê Buôn Ma Thuột',
    title: 'Cà phê Buôn Ma Thuột',
    subtitle: 'Hương vị đậm đà của đất đỏ bazan'
  },
  { 
    src: '/home/slider/anh3.jpg', 
    alt: 'Văn hóa Tây Nguyên - Thổ cẩm truyền thống',
    title: 'Thổ cẩm truyền thống',
    subtitle: 'Nghệ thuật dệt may độc đáo'
  },
  { 
    src: '/home/slider/anh4.jpg', 
    alt: 'Văn hóa Tây Nguyên - Nhà rông',
    title: 'Nhà rông Tây Nguyên',
    subtitle: 'Kiến trúc độc đáo của vùng cao'
  },
];

export default function HeroSection() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <section className="hero-section">
      {/* Slider Images with Zoom Effect */}
      {sliderImages.map((image, index) => (
        <div
          key={index}
          className={`hero-section__slide ${
            index === currentSlide 
              ? 'hero-section__slide--active' 
              : 'hero-section__slide--inactive'
          }`}
        >
          <div
            className={`hero-section__slide-image ${
              index === currentSlide ? 'hero-section__slide-image--active' : ''
            }`}
            style={{
              backgroundImage: `url('${image.src}')`,
            }}
            role="img"
            aria-label={image.alt}
          />
        </div>
      ))}

      {/* Gradient Overlays */}
      <div className="hero-section__overlay hero-section__overlay--top" />
      <div className="hero-section__overlay hero-section__overlay--bottom" />

      {/* Content */}
      <div className="hero-section__content">
        <div className="hero-section__container">
          <div className="hero-section__wrapper">
            {/* Slide Number Indicator */}
            <div className="hero-section__slide-number">
              <div className="hero-section__slide-number-line" />
              <span className="hero-section__slide-number-text">
                {String(currentSlide + 1).padStart(2, '0')} / {String(sliderImages.length).padStart(2, '0')}
              </span>
            </div>

            {/* Title with Animation */}
            <div className="hero-section__title-section">
              <h2 className="hero-section__title-section-subtitle">
                {sliderImages[currentSlide].title}
              </h2>
              <h1 className="hero-section__title-section-main">
                BẢO TỒN VÀ{' '}
                <span className="hero-section__title-section-main-highlight">
                  TRẢI NGHIỆM
                </span>
                <br />
                VĂN HÓA TÂY NGUYÊN
              </h1>
              <p className="hero-section__title-section-description">
                {sliderImages[currentSlide].subtitle}
              </p>
            </div>

            {/* Buttons */}
            <div className="hero-section__buttons">
              <button 
                onClick={() => navigate('/tour')}
                className="hero-section__button hero-section__button--primary"
              >
                Khám phá ngay
                <ArrowRight className="hero-section__button-icon" />
              </button>
              <button 
                onClick={() => navigate('/about')}
                className="hero-section__button hero-section__button--secondary"
              >
                <Play className="hero-section__button-icon" />
                Về chúng tôi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="hero-section__indicators">
        {sliderImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`hero-section__indicator ${
              index === currentSlide
                ? 'hero-section__indicator--active'
                : 'hero-section__indicator--inactive'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="hero-section__navigation">
        <button
          onClick={prevSlide}
          className="hero-section__navigation-button hero-section__navigation-button--prev"
          aria-label="Previous slide"
        >
          <ChevronLeft className="hero-section__navigation-button-icon" />
        </button>
        <button
          onClick={nextSlide}
          className="hero-section__navigation-button hero-section__navigation-button--next"
          aria-label="Next slide"
        >
          <ChevronRight className="hero-section__navigation-button-icon" />
        </button>
      </div>

      {/* Decorative Elements */}
      <div className="hero-section__decoration" />
    </section>
  );
}
