import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import '../../styles/components/tourHero.scss';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

export default function TourHero() {
  const scrollToContent = () => {
    document.getElementById('tour-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="tour-hero">
      <motion.div
        className="tour-hero__container"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        <motion.span
          className="tour-hero__badge"
          variants={fadeUp}
          transition={{ duration: 0.5 }}
        >
          Trải nghiệm văn hoá bản địa
        </motion.span>
        <motion.h1
          className="tour-hero__title"
          variants={fadeUp}
          transition={{ duration: 0.6 }}
        >
          Khám phá văn hoá Tây Nguyên
        </motion.h1>
        <motion.p
          className="tour-hero__subtitle"
          variants={fadeUp}
          transition={{ duration: 0.5 }}
        >
          Hành trình khám phá nền văn hoá độc đáo của người dân tộc thiểu số với
          những truyền thống lâu đời và cảnh quan thiên nhiên hùng vĩ.
        </motion.p>
        <motion.button
          type="button"
          className="tour-hero__cta"
          onClick={scrollToContent}
          aria-label="Xem danh sách tour"
          variants={fadeUp}
          transition={{ duration: 0.5 }}
        >
          Khám phá ngay
        </motion.button>
        <motion.button
          type="button"
          className="tour-hero__scroll-hint"
          onClick={scrollToContent}
          aria-label="Cuộn xuống"
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <ChevronDown size={24} />
        </motion.button>
      </motion.div>
    </section>
  );
}
