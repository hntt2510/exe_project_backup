import { Typography, Collapse } from 'antd';
import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import '../styles/pages/_faq.scss';

const { Title, Paragraph, Text } = Typography;

const faqItems = [
  {
    q: 'Tour được tổ chức như thế nào?',
    a: 'Mỗi tour do nghệ nhân địa phương hoặc hướng dẫn viên có kinh nghiệm dẫn dắt. Số lượng khách thường từ 4–20 người, đảm bảo trải nghiệm gần gũi và an toàn.',
  },
  {
    q: 'Tôi cần chuẩn bị gì khi tham gia tour?',
    a: 'Bạn chỉ cần mang theo giấy tờ tùy thân, trang phục thoải mái phù hợp thời tiết, giày đi bộ nhẹ. Một số tour có hoạt động làm nghề thủ công, bạn có thể mang theo camera nếu muốn ghi lại.',
  },
  {
    q: 'Thanh toán qua những hình thức nào?',
    a: 'Chúng tôi hỗ trợ thanh toán qua VNPay, MoMo ( ví điện tử và thẻ ATM nội địa, Visa, MasterCard, JCB). Bạn thanh toán trước để xác nhận đặt chỗ.',
  },
  {
    q: 'Tôi có thể hủy hoặc đổi ngày tour không?',
    a: 'Có. Hủy trước 48 giờ được hoàn 100% phí. Đổi ngày cần thông báo trước 24 giờ, chúng tôi sẽ sắp xếp tour phù hợp nếu còn chỗ.',
  },
  {
    q: 'E-ticket là gì và tôi nhận nó khi nào?',
    a: 'E-ticket là vé điện tử gửi qua email và hiển thị trong tài khoản sau khi thanh toán thành công. Bạn mang theo bản in hoặc màn hình điện thoại khi tham gia tour.',
  },
  {
    q: 'Tour có phù hợp cho trẻ em và người lớn tuổi không?',
    a: 'Mỗi tour có mô tả độ khó. Một số tour nhẹ nhàng phù hợp cả gia đình. Bạn có thể xem chi tiết từng tour và liên hệ CSKH nếu cần tư vấn thêm.',
  },
];

export default function FAQPage() {
  const items = faqItems.map((item, index) => ({
    key: String(index),
    label: (
      <span className="faq-page__collapse-label">
        <HelpCircle size={18} className="faq-page__collapse-icon" />
        {item.q}
      </span>
    ),
    children: (
      <Paragraph className="faq-page__collapse-content">{item.a}</Paragraph>
    ),
  }));

  return (
    <div className="faq-page">
      <section className="faq-page__hero">
        <div className="faq-page__hero-bg">
          <div className="faq-page__hero-pattern" />
          <div className="faq-page__hero-blob faq-page__hero-blob--primary" />
        </div>
        <div className="faq-page__container">
          <motion.div
            className="faq-page__hero-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Title level={1} className="faq-page__title">
              Câu hỏi <span className="faq-page__title-highlight">thường gặp</span>
            </Title>
            <Paragraph className="faq-page__subtitle">
              Tìm câu trả lời cho những thắc mắc phổ biến về tour trải nghiệm và dịch vụ của Cội Việt.
            </Paragraph>
          </motion.div>
        </div>
      </section>

      <section className="faq-page__content">
        <div className="faq-page__container">
          <motion.div
            className="faq-page__collapse-wrapper"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Collapse
              items={items}
              defaultActiveKey={['0']}
              className="faq-page__collapse"
            />
          </motion.div>
        </div>
      </section>
    </div>
  );
}
