import { useNavigate } from "react-router-dom";
import "../../styles/components/blog/_blog-hero.scss";

export default function BlogHero() {
  const navigate = useNavigate();

  const scrollToGrid = () => {
    const grid = document.querySelector(".blog-grid");
    grid?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="blog-hero">
      <div className="blog-hero__overlay">
        <h1 className="blog-hero__title">Câu chuyện văn hoá Tây Nguyên</h1>
        <p className="blog-hero__subtitle">
          Khám phá những câu chuyện, bài viết và góc nhìn sâu sắc về văn hóa
          đa sắc màu của đồng bào dân tộc Tây Nguyên qua từng trang viết
        </p>
        <button className="blog-hero__btn" onClick={() => navigate("/tours")}>
          Khám phá tour
        </button>
      </div>
    </section>
  );
}
