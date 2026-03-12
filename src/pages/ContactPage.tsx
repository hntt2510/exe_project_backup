import { Typography, Button, Input, Form } from 'antd';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import '../styles/pages/_contact.scss';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const contactInfo = [
  {
    icon: Phone,
    label: 'Điện thoại',
    value: '0123 456 789',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'info@coiviet.com',
  },
  {
    icon: MapPin,
    label: 'Địa chỉ',
    value: 'Đại học FPT, Thủ Đức, TP.HCM',
  },
];

export default function ContactPage() {
  const [form] = Form.useForm();

  const onFinish = () => {
    // Hardcoded - no actual submit
    form.resetFields();
  };

  return (
    <div className="contact-page">
      <section className="contact-page__hero">
        <div className="contact-page__hero-bg">
          <div className="contact-page__hero-pattern" />
          <div className="contact-page__hero-blob contact-page__hero-blob--primary" />
        </div>
        <div className="contact-page__container">
          <motion.div
            className="contact-page__hero-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Title level={1} className="contact-page__title">
              Liên hệ <span className="contact-page__title-highlight">Cội Việt</span>
            </Title>
            <Paragraph className="contact-page__subtitle">
              Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Gửi tin nhắn hoặc liên hệ trực tiếp qua các kênh bên dưới.
            </Paragraph>
          </motion.div>
        </div>
      </section>

      <section className="contact-page__content">
        <div className="contact-page__container">
          <div className="contact-page__grid">
            <motion.div
              className="contact-page__info"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Text className="contact-page__info-label">Thông tin liên hệ</Text>
              <Title level={4} className="contact-page__info-title">
                Hãy đến với chúng tôi
              </Title>
              <div className="contact-page__info-list">
                {contactInfo.map((item, index) => (
                  <div key={index} className="contact-page__info-item">
                    <item.icon className="contact-page__info-icon" size={20} />
                    <div>
                      <Text className="contact-page__info-item-label">{item.label}</Text>
                      <p className="contact-page__info-item-value">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="contact-page__form-wrapper"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="contact-page__form-card">
                <Title level={4} className="contact-page__form-title">
                  Gửi tin nhắn
                </Title>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={onFinish}
                  className="contact-page__form"
                >
                  <Form.Item
                    name="name"
                    label="Họ và tên"
                    rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                  >
                    <Input placeholder="Nguyễn Văn A" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: 'Vui lòng nhập email' },
                      { type: 'email', message: 'Email không hợp lệ' },
                    ]}
                  >
                    <Input placeholder="example@email.com" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="message"
                    label="Nội dung"
                    rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
                  >
                    <TextArea
                      rows={5}
                      placeholder="Nội dung bạn muốn gửi..."
                      className="contact-page__textarea"
                    />
                  </Form.Item>
                  <Form.Item className="contact-page__form-submit">
                    <Button
                      type="primary"
                      size="large"
                      htmlType="submit"
                      icon={<Send size={18} />}
                      className="contact-page__submit-btn"
                    >
                      Gửi tin nhắn
                    </Button>
                  </Form.Item>
                </Form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
