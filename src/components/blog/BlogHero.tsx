import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "../../styles/components/blog/_blog-hero.scss";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

export default function BlogHero() {
  const navigate = useNavigate();

  return (
    <section className="blog-hero">
      <motion.div
        className="blog-hero__overlay"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        <motion.h1
          className="blog-hero__title"
          variants={fadeUp}
          transition={{ duration: 0.5 }}
        >
          Câu chuyện văn hoá Tây Nguyên
        </motion.h1>
        <motion.p
          className="blog-hero__subtitle"
          variants={fadeUp}
          transition={{ duration: 0.5 }}
        >
          Khám phá những câu chuyện, bài viết và góc nhìn sâu sắc về văn hóa
          đa sắc màu của đồng bào dân tộc Tây Nguyên qua từng trang viết
        </motion.p>
        <motion.button
          className="blog-hero__btn"
          onClick={() => navigate("/tours")}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
        >
          Khám phá tour
        </motion.button>
      </motion.div>
    </section>
  );
}
