import { Typography } from 'antd';
import { motion } from 'framer-motion';
import { FileText, Shield, RotateCcw, Lock } from 'lucide-react';
import '../styles/pages/_policy.scss';

const { Title, Paragraph, Text } = Typography;

const policySections = [
  {
    icon: FileText,
    title: 'Chính sách đặt tour',
    items: [
      'Tour được đặt trước tối thiểu 24 giờ để đảm bảo sắp xếp nghệ nhân và hướng dẫn viên.',
      'Thanh toán online qua VNPay hoặc MoMo ngay sau khi xác nhận thông tin.',
      'Sau khi thanh toán, bạn sẽ nhận e-ticket qua email và tài khoản.',
    ],
  },
  {
    icon: RotateCcw,
    title: 'Chính sách hủy và hoàn tiền',
    items: [
      'Hủy trước 48 giờ: hoàn 100% phí tour.',
      'Hủy trước 24 giờ: hoàn 50% phí tour.',
      'Hủy trong vòng 24 giờ: không hoàn phí.',
      'Trường hợp bất khả kháng (thiên tai, dịch bệnh): liên hệ bộ phận CSKH để xử lý.',
    ],
  },
  {
    icon: Lock,
    title: 'Bảo mật thông tin',
    items: [
      'Mọi thông tin cá nhân và thanh toán được mã hóa và bảo vệ theo chuẩn PCI DSS.',
      'Chúng tôi không bán hoặc chia sẻ dữ liệu với bên thứ ba.',
      'Bạn có quyền yêu cầu xóa dữ liệu bất cứ lúc nào.',
    ],
  },
  {
    icon: Shield,
    title: 'Cam kết chất lượng',
    items: [
      'Tour được tổ chức bởi nghệ nhân địa phương có kinh nghiệm.',
      'Nếu trải nghiệm không đúng mô tả, chúng tôi hoàn 50% phí tour.',
      'Đánh giá và phản hồi của bạn giúp chúng tôi cải thiện dịch vụ.',
    ],
  },
];

export default function PolicyPage() {
  return (
    <div className="policy-page">
      <section className="policy-page__hero">
        <div className="policy-page__hero-bg">
          <div className="policy-page__hero-pattern" />
          <div className="policy-page__hero-blob policy-page__hero-blob--primary" />
        </div>
        <div className="policy-page__container">
          <motion.div
            className="policy-page__hero-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Title level={1} className="policy-page__title">
              Chính sách <span className="policy-page__title-highlight">Cội Việt</span>
            </Title>
            <Paragraph className="policy-page__subtitle">
              Chính sách đặt tour, hủy/hoàn tiền và bảo mật thông tin — minh bạch và rõ ràng cho mọi khách hàng.
            </Paragraph>
          </motion.div>
        </div>
      </section>

      <section className="policy-page__content">
        <div className="policy-page__container">
          {policySections.map((section, index) => (
            <motion.div
              key={index}
              className="policy-page__section"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="policy-page__section-header">
                <div className={`policy-page__section-icon policy-page__section-icon--${index % 4}`}>
                  <section.icon size={24} />
                </div>
                <Title level={3} className="policy-page__section-title">
                  {section.title}
                </Title>
              </div>
              <ul className="policy-page__section-list">
                {section.items.map((item, i) => (
                  <li key={i} className="policy-page__section-item">
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
