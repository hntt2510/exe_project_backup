import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "../../styles/components/artisan/_artisan-hero.scss";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

export default function ArtisanHero() {
  const navigate = useNavigate();

  return (
    <section className="artisan-hero">
      <motion.img
        src="/dauvao.png"
        alt="Văn hoá Tây Nguyên"
        className="artisan-hero__img"
        initial={{ opacity: 0, scale: 1.03 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7 }}
      />

      <motion.div
        className="artisan-hero__overlay"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        <motion.h1
          className="artisan-hero__title"
          variants={fadeUp}
          transition={{ duration: 0.5 }}
        >
          Khám phá văn hoá Tây Nguyên
        </motion.h1>
        <motion.p
          className="artisan-hero__subtitle"
          variants={fadeUp}
          transition={{ duration: 0.5 }}
        >
          Gặp gỡ những nghệ nhân tài hoa đang gìn giữ và truyền lửa cho các
          nghề thủ công truyền thống của đồng bào dân tộc Tây Nguyên
        </motion.p>
        <motion.button
          className="artisan-hero__btn"
          onClick={() => navigate("/tours")}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
        >
          Khám phá ngay
        </motion.button>
      </motion.div>
    </section>
  );
}
