import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import type { PublicArtisan } from "../../types";
import "../../styles/components/artisan/_artisan-card.scss";

interface Props {
  artisan: PublicArtisan;
}

const FALLBACK_IMG = "/dauvao.png";

export default function ArtisanCard({ artisan }: Props) {
  const navigate = useNavigate();
  const imgSrc = artisan.profileImageUrl || artisan.user?.avatarUrl || FALLBACK_IMG;

  const handleClick = () => {
    navigate(`/artisans/${artisan.id}`);
  };

  return (
    <motion.article
      className="artisan-card"
      onClick={handleClick}
      style={{ cursor: "pointer" }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* stamp border wrapper */}
      <div className="artisan-card__stamp">
        <div className="artisan-card__img-wrap">
          <img
            src={imgSrc}
            alt={artisan.fullName}
            className="artisan-card__img"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_IMG;
            }}
          />
        </div>
      </div>

      <div className="artisan-card__info">
        <h3 className="artisan-card__name">{artisan.fullName}</h3>
        <p className="artisan-card__spec">
          {artisan.specialization}
          {artisan.province?.name && ` - ${artisan.province.name}`}
        </p>

        {artisan.averageRating > 0 && (
          <div className="artisan-card__rating">
            <Star size={14} />
            <span>{artisan.averageRating.toFixed(1)}</span>
          </div>
        )}

        <button className="artisan-card__link">
          Xem thêm <ArrowRight size={14} />
        </button>
      </div>
    </motion.article>
  );
}
