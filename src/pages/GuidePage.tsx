import { Typography, Button } from 'antd';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search,
  FileEdit,
  CreditCard,
  Ticket,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import '../styles/pages/_guide.scss';

const { Title, Paragraph, Text } = Typography;

const steps = [
  {
    icon: Search,
    number: '01',
    title: 'Chọn tour phù hợp',
    description:
      'Truy cập trang Tour, lọc theo tỉnh thành hoặc nghệ nhân. Xem chi tiết mô tả, thời lượng, giá và lịch trình. Chọn ngày và số lượng khách.',
    color: 'primary',
  },
  {
    icon: FileEdit,
    number: '02',
    title: 'Điền thông tin khách',
    description:
      'Nhập họ tên, số điện thoại, email và thông tin cần thiết cho từng khách. Kiểm tra chính sách hủy và điều khoản trước khi tiếp tục.',
    color: 'amber',
  },
  {
    icon: CreditCard,
    number: '03',
    title: 'Thanh toán an toàn',
    description:
      'Chọn phương thức thanh toán (VNPay, MoMo, thẻ ATM, Visa/MasterCard). Thanh toán trong thời gian quy định để giữ chỗ. Bạn sẽ nhận xác nhận qua email.',
    color: 'teal',
  },
  {
    icon: Ticket,
    number: '04',
    title: 'Nhận E-ticket và tham gia',
    description:
      'E-ticket được gửi qua email và lưu trong tài khoản. Mang theo bản in hoặc màn hình điện thoại khi đến điểm tập trung. Chúc bạn có trải nghiệm đáng nhớ!',
    color: 'green',
  },
];

export default function GuidePage() {
  return (
    <div className="guide-page">
      <section className="guide-page__hero">
        <div className="guide-page__hero-bg">
          <div className="guide-page__hero-pattern" />
          <div className="guide-page__hero-blob guide-page__hero-blob--primary" />
        </div>
        <div className="guide-page__container">
          <motion.div
            className="guide-page__hero-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Text className="guide-page__badge">Hướng dẫn</Text>
            <Title level={1} className="guide-page__title">
              Đặt tour <span className="guide-page__title-highlight">trong 4 bước</span>
            </Title>
            <Paragraph className="guide-page__subtitle">
              Quy trình đặt tour trải nghiệm văn hóa đơn giản, minh bạch và an toàn. Làm theo các bước bên dưới để bắt đầu hành trình.
            </Paragraph>
          </motion.div>
        </div>
      </section>

      <section className="guide-page__steps">
        <div className="guide-page__container">
          <div className="guide-page__steps-grid">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="guide-page__step-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="guide-page__step-header">
                  <div
                    className={`guide-page__step-icon guide-page__step-icon--${step.color}`}
                  >
                    <step.icon size={24} />
                  </div>
                  <span className="guide-page__step-number">{step.number}</span>
                </div>
                <Title level={4} className="guide-page__step-title">
                  {step.title}
                </Title>
                <Paragraph className="guide-page__step-desc">
                  {step.description}
                </Paragraph>
                {index < steps.length - 1 && (
                  <div className="guide-page__step-connector">
                    <ArrowRight size={20} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div
            className="guide-page__cta"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="guide-page__cta-content">
              <CheckCircle size={32} className="guide-page__cta-icon" />
              <div>
                <Title level={4} className="guide-page__cta-title">
                  Sẵn sàng đặt tour?
                </Title>
                <Paragraph className="guide-page__cta-desc">
                  Khám phá các tour trải nghiệm văn hóa Tây Nguyên ngay hôm nay.
                </Paragraph>
              </div>
              <Link to="/tours">
                <Button
                  type="primary"
                  size="large"
                  className="guide-page__cta-btn"
                >
                  Xem danh sách tour
                  <ArrowRight size={20} />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
