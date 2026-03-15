import { useRef } from 'react';
import { Typography, Button, Image } from 'antd';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search,
  FileEdit,
  CheckCircle as CheckIcon,
  CreditCard,
  Ticket,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import '../styles/pages/_guide.scss';

const { Title, Paragraph, Text } = Typography;

interface GuideStep {
  number: string;
  title: string;
  description: string;
  images: string[];
  color: string;
  icon: React.ComponentType<{ size?: number }>;
  link?: string;
  linkLabel?: string;
}

const steps: GuideStep[] = [
  {
    number: '01',
    title: 'Chọn tour phù hợp',
    description:
      'Truy cập trang Tour, sử dụng ô tìm kiếm và bộ lọc theo tỉnh thành hoặc nghệ nhân để tìm tour phù hợp. Xem chi tiết mô tả, thời lượng, giá và lịch trình. Khi đã chọn tour ưng ý, bấm nút "Đặt ngay" để bắt đầu đặt chỗ.',
    images: ['/huongdan/1.png', '/huongdan/2.png', '/huongdan/3.png'],
    color: 'primary',
    icon: Search,
    link: '/tours',
    linkLabel: 'Xem danh sách tour',
  },
  {
    number: '02',
    title: 'Điền thông tin',
    description:
      'Điền đầy đủ họ tên, email và số điện thoại. Chọn ngày khởi hành, giờ khởi hành, số lượng người tham gia và loại tour (Cá nhân, Nhóm, Gia đình). Có thể thêm ghi chú cho nhà tổ chức. Đồng ý với điều khoản dịch vụ và chính sách hủy trước khi bấm Xác nhận.',
    images: ['/huongdan/4.png', '/huongdan/5.png'],
    color: 'amber',
    icon: FileEdit,
  },
  {
    number: '03',
    title: 'Xác nhận thông tin',
    description:
      'Kiểm tra kỹ thông tin tour đã chọn, thông tin khách và lịch khởi hành. Nếu có sai sót, bấm "Quay lại chỉnh sửa" để sửa. Khi đã chắc chắn đúng, tick các ô xác nhận và bấm "Xác nhận và thanh toán".',
    images: ['/huongdan/6.png'],
    color: 'teal',
    icon: CheckIcon,
  },
  {
    number: '04',
    title: 'Thanh toán',
    description:
      'Chọn phương thức thanh toán: VNPay (thanh toán trực tuyến), Momo/Ví điện tử, hoặc Tiền mặt (trả tại điểm hẹn). Có thể nhập mã voucher để giảm giá. Đồng ý điều khoản và bấm "Thanh toán" để hoàn tất.',
    images: ['/huongdan/7.png'],
    color: 'green',
    icon: CreditCard,
  },
  {
    number: '05',
    title: 'Nhận E-ticket và tham gia',
    description:
      'Sau khi thanh toán thành công, E-ticket sẽ được gửi qua email và lưu trong tài khoản của bạn. Mang theo bản in hoặc hiển thị trên màn hình điện thoại khi đến điểm tập trung. Chúc bạn có trải nghiệm văn hóa đáng nhớ!',
    images: [],
    color: 'primary',
    icon: Ticket,
  },
];

export default function GuidePage() {
  const scrollYRef = useRef(0);

  const handleImageClickCapture = () => {
    scrollYRef.current = window.scrollY;
  };

  const handlePreviewOpenChange = (_visible: boolean) => {
    const y = scrollYRef.current;
    requestAnimationFrame(() => window.scrollTo(0, y));
    setTimeout(() => window.scrollTo(0, y), 20);
  };

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
              Đặt tour <span className="guide-page__title-highlight">trong 5 bước</span>
            </Title>
            <Paragraph className="guide-page__subtitle">
              Quy trình đặt tour trải nghiệm văn hóa đơn giản, minh bạch và an toàn. Làm theo các bước bên dưới để bắt đầu hành trình.
            </Paragraph>
          </motion.div>
        </div>
      </section>

      <section className="guide-page__steps">
        <div className="guide-page__container">
          <div className="guide-page__steps-list">
            {steps.map((step, index) => (
              <motion.article
                key={index}
                className="guide-page__step-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <div className="guide-page__step-header">
                  <div
                    className={`guide-page__step-icon guide-page__step-icon--${step.color}`}
                  >
                    <step.icon size={24} />
                  </div>
                  <span className="guide-page__step-number">{step.number}</span>
                  <Title level={3} className="guide-page__step-title">
                    {step.title}
                  </Title>
                </div>
                <Paragraph className="guide-page__step-desc">
                  {step.description}
                </Paragraph>
                {step.images.length > 0 && (
                  <Image.PreviewGroup
                    preview={{
                      onOpenChange: handlePreviewOpenChange,
                    }}
                  >
                    <div
                      className="guide-page__step-images"
                      onClickCapture={handleImageClickCapture}
                    >
                      {step.images.map((src, i) => (
                        <div key={i} className="guide-page__step-image-wrapper">
                          <Image
                            src={src}
                            alt={`Bước ${step.number} - ${i + 1}`}
                            className="guide-page__step-image"
                            rootClassName="guide-page__step-image-root"
                          />
                        </div>
                      ))}
                    </div>
                  </Image.PreviewGroup>
                )}
                {step.link && step.linkLabel && (
                  <Link to={step.link} className="guide-page__step-link">
                    <Button
                      type="primary"
                      size="middle"
                      className="guide-page__step-btn"
                    >
                      {step.linkLabel}
                      <ArrowRight size={18} />
                    </Button>
                  </Link>
                )}
              </motion.article>
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
