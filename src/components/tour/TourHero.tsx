import { ChevronDown } from 'lucide-react';
import '../../styles/components/tourHero.scss';

export default function TourHero() {
  const scrollToContent = () => {
    document.getElementById('tour-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="tour-hero">
      <div className="tour-hero__container">
        <span className="tour-hero__badge">Trải nghiệm văn hoá bản địa</span>
        <h1 className="tour-hero__title">Khám phá văn hoá Tây Nguyên</h1>
        <p className="tour-hero__subtitle">
          Hành trình khám phá nền văn hoá độc đáo của người dân tộc thiểu số với
          những truyền thống lâu đời và cảnh quan thiên nhiên hùng vĩ.
        </p>
        <button
          type="button"
          className="tour-hero__cta"
          onClick={scrollToContent}
          aria-label="Xem danh sách tour"
        >
          Khám phá ngay
        </button>
        <button
          type="button"
          className="tour-hero__scroll-hint"
          onClick={scrollToContent}
          aria-label="Cuộn xuống"
        >
          <ChevronDown size={24} />
        </button>
      </div>
    </section>
  );
}
