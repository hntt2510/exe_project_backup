import { Link } from 'react-router-dom';
import '../../styles/components/inspirationSection.scss';

const CARDS = [
  {
    id: 1,
    image: '/inspiration/1.jpg',
    overlay: 'brown',
    title: 'Trải nghiệm văn hoá đáng nhớ',
    description: 'Khám phá những hoạt động yêu thích khi đến Tây Nguyên',
    tourId: 12,
  },
  {
    id: 2,
    image: '/inspiration/2.jpg',
    overlay: 'purple',
    title: 'Ưu đãi lưu trú hấp dẫn',
    description: 'Tận hưởng những ưu đãi nghỉ dưỡng tuyệt vời tại vùng cao nguyên',
    tourId: 1,
  },
];

export default function InspirationSection() {
  return (
    <section className="inspiration" id="inspiration">
      <div className="inspiration__container">
        <h2 className="inspiration__title">Gợi ý hành trình của bạn</h2>
        <div className="inspiration__cards">
          {CARDS.map((card) => (
            <Link
              key={card.id}
              to={`/tours/${card.tourId}`}
              className={`inspiration__card inspiration__card--${card.overlay}`}
            >
              <div
                className="inspiration__card-bg"
                style={{ backgroundImage: `url(${card.image})` }}
              />
              <div className="inspiration__card-content">
                <div className="inspiration__card-text">
                  <h3 className="inspiration__card-title">{card.title}</h3>
                  <p className="inspiration__card-desc">{card.description}</p>
                </div>
                <span className="inspiration__card-btn">Xem tour</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
