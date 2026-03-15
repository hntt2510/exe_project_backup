import { Search, Percent, Smartphone, ShieldCheck } from 'lucide-react';
import '../../styles/components/why-choose-section.scss';

const benefits = [
  {
    icon: Search,
    title: 'Khám phá văn hóa độc đáo',
    description:
      'Hàng trăm địa điểm, tour và trải nghiệm văn hóa Tây Nguyên đang chờ bạn khám phá.',
  },
  {
    icon: Percent,
    title: 'Ưu đãi hấp dẫn',
    description:
      'Tour chất lượng với mức giá hợp lý. Đăng ký để nhận ưu đãi độc quyền.',
  },
  {
    icon: Smartphone,
    title: 'Đặt tour dễ dàng',
    description:
      'Đặt tour trực tuyến mọi lúc, thanh toán linh hoạt và hủy miễn phí theo điều kiện.',
  },
  {
    icon: ShieldCheck,
    title: 'Đồng hành tin cậy',
    description:
      'Đọc đánh giá thực tế và nhận hỗ trợ 24/7. Chúng tôi đồng hành cùng bạn mọi bước.',
  },
];

export default function WhyChooseSection() {
  return (
    <section className="section-container why-choose">
      <div className="why-choose__container">
        <h2 className="why-choose__title">Vì sao chọn Cội Việt</h2>
        <div className="why-choose__grid">
          {benefits.map((item, idx) => (
            <div key={idx} className="why-choose__card">
              <div className="why-choose__icon-wrap">
                <item.icon size={32} className="why-choose__icon" />
              </div>
              <h3 className="why-choose__card-title">{item.title}</h3>
              <p className="why-choose__card-desc">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
