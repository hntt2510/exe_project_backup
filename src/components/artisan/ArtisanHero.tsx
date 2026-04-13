import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "../../styles/components/artisan/_artisan-hero.scss";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
};

export default function ArtisanHero() {
  const navigate = useNavigate();

  return (
    <section className="artisan-hero">
      <motion.img
        src="/dauvao.png"
        alt="Văn hoá Tây Nguyên"
        className="artisan-hero__img"
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55 }}
      />

      <div className="artisan-hero__overlay">
        <motion.div
          className="artisan-hero__inner"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          <motion.h1
            className="artisan-hero__title"
            variants={fadeUp}
            transition={{ duration: 0.45 }}
          >
            Khám phá văn hoá Tây Nguyên
          </motion.h1>
          <motion.p
            className="artisan-hero__subtitle"
            variants={fadeUp}
            transition={{ duration: 0.45 }}
          >
            Hành trình khám phá nền văn hoá độc đáo của người dân tộc thiểu số
            với những truyền thống lâu đời và cảnh quan thiên nhiên hùng vĩ.
          </motion.p>
          <motion.button
            type="button"
            className="artisan-hero__btn"
            onClick={() => navigate("/tours")}
            variants={fadeUp}
            transition={{ duration: 0.45 }}
          >
            Khám phá ngay
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
