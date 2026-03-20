import { Typography, Button } from 'antd';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Map, Heart, BookOpen, Users, Mail, Compass, 
    Sparkles, Globe, Camera, Music, ChefHat, TreePine,
    ArrowRight, CheckCircle, Star, Award, TrendingUp
} from 'lucide-react';
import '../../styles/pages/_about.scss';

const { Title, Paragraph, Text } = Typography;

// Stats data
const stats = [
    { number: '54', label: 'Dân tộc', icon: Users },
    { number: '63', label: 'Tỉnh thành', icon: Map },
    { number: '100+', label: 'Tour độc đáo', icon: Compass },
    { number: '500+', label: 'Nghệ nhân', icon: Award },
];

// Features data
const features = [
    {
        icon: Camera,
        title: 'Tour trải nghiệm thực tế',
        description: 'Tham gia các hành trình khám phá văn hóa bản địa, gặp gỡ nghệ nhân và trải nghiệm làm nghề truyền thống.',
        color: 'primary'
    },
    {
        icon: BookOpen,
        title: 'Học văn hóa qua câu chuyện',
        description: 'Thư viện số với hàng trăm bài học về lịch sử, phong tục, tín ngưỡng và nghệ thuật các vùng miền.',
        color: 'amber'
    },
    {
        icon: Music,
        title: 'Di sản phi vật thể',
        description: 'Khám phá không gian cồng chiêng Tây Nguyên, hát then Tày Nùng, ca trù và nhiều loại hình nghệ thuật khác.',
        color: 'teal'
    },
    {
        icon: ChefHat,
        title: 'Ẩm thực bản địa',
        description: 'Trải nghiệm và học cách chế biến những món ăn truyền thống từ các cộng đồng địa phương.',
        color: 'rose'
    },
    {
        icon: TreePine,
        title: 'Du lịch bền vững',
        description: 'Hỗ trợ cộng đồng địa phương phát triển kinh tế, bảo tồn môi trường và văn hóa truyền thống.',
        color: 'green'
    },
    {
        icon: Globe,
        title: 'Kết nối toàn cầu',
        description: 'Giúp kiều bào và bạn bè quốc tế hiểu và yêu văn hóa Việt Nam qua nền tảng đa ngôn ngữ.',
        color: 'blue'
    },
];

// Timeline data
const timeline = [
    {
        year: '2024',
        title: 'Khởi nguồn',
        description: 'Ý tưởng Cội Việt được hình thành từ nhóm sinh viên đam mê văn hóa bản địa Tây Nguyên.'
    },
    {
        year: '2025',
        title: 'Ra mắt phiên bản đầu tiên',
        description: 'Cội Việt chính thức ra mắt với 20 tour trải nghiệm và thư viện văn hóa Tây Nguyên.'
    },
    {
        year: '2026',
        title: 'Mở rộng vùng miền',
        description: 'Đang mở rộng sang các vùng Tây Bắc, đồng bằng sông Cửu Long và miền Trung Việt Nam.'
    },
    {
        year: '2027',
        title: 'Tầm nhìn tương lai',
        description: 'Bao phủ trọn vẹn 63 tỉnh thành, trở thành nền tảng văn hóa số hàng đầu Việt Nam.'
    },
];

// Values data
const values = [
    'Tôn trọng và bảo tồn bản sắc văn hóa',
    'Hỗ trợ cộng đồng địa phương phát triển',
    'Trải nghiệm chân thực, không "làm màu"',
    'Công nghệ phục vụ di sản, không thay thế',
    'Phát triển du lịch bền vững và có trách nhiệm',
];

const About: React.FC = () => {
    return (
        <div className="about-page">
            {/* Hero Section */}
            <section className="about-page__hero">
                <div className="about-page__hero-bg">
                    <div className="about-page__hero-pattern" />
                    <div className="about-page__hero-blob about-page__hero-blob--primary" />
                    <div className="about-page__hero-blob about-page__hero-blob--secondary" />
                </div>

                <div className="about-page__container">
                    <motion.div
                        className="about-page__hero-content"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="about-page__hero-badge">
                            <Sparkles size={16} />
                            <span>Nền tảng văn hóa số Việt Nam</span>
                        </div>
                        <Title level={1} className="about-page__title">
                            Khám phá <span className="about-page__title-highlight">Cội Nguồn</span>
                            <br />Văn Hóa Việt
                        </Title>
                        <Paragraph className="about-page__subtitle">
                            Cội Việt là nền tảng số kết nối bạn với văn hóa bản địa Việt Nam — 
                            từ những tour trải nghiệm thực tế đến kho tàng kiến thức về 54 dân tộc anh em.
                        </Paragraph>
                        <div className="about-page__hero-actions">
                            <Link to="/blog" className="about-page__hero-link">
                                <Button type="primary" size="large" className="about-page__hero-btn">
                                    Khám phá ngay
                                    <ArrowRight size={20} />
                                </Button>
                            </Link>
                            <Link to="/tours" className="about-page__hero-link">
                                <Button size="large" className="about-page__hero-btn about-page__hero-btn--outline">
                                    Xem tour
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="about-page__stats">
                <div className="about-page__container">
                    <div className="about-page__stats-grid">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                className="about-page__stat-item"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <stat.icon className="about-page__stat-icon" />
                                <div className="about-page__stat-number">{stat.number}</div>
                                <div className="about-page__stat-label">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission & Vision Section */}
            <section className="about-page__mission">
                <div className="about-page__container">
                    <div className="about-page__section-header">
                        <Text className="about-page__section-label">Sứ mệnh & Tầm nhìn</Text>
                        <Title level={2} className="about-page__section-title">
                            Khơi dậy niềm tự hào<br />văn hóa Việt
                        </Title>
                    </div>

                    <div className="about-page__mission-grid">
                        <motion.div
                            className="about-page__card about-page__card--mission"
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="about-page__card-bg">
                                <Heart className="about-page__card-bg-icon" />
                            </div>
                            <div className="about-page__card-content">
                                <div className="about-page__card-icon about-page__card-icon--amber">
                                    <Heart size={28} />
                                </div>
                                <Title level={3} className="about-page__card-title">Sứ mệnh</Title>
                                <Paragraph className="about-page__card-text">
                                    Trở thành cầu nối thế hệ trẻ và kiều bào với cội nguồn văn hóa đa dạng của Việt Nam.
                                    Cội Việt tạo ra không gian để những người lớn tuổi, các nghệ nhân truyền dạy ký ức,
                                    phục dựng bức tranh văn hóa thông qua công nghệ số hóa hiện đại.
                                </Paragraph>
                            </div>
                        </motion.div>

                        <motion.div
                            className="about-page__card about-page__card--vision"
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <div className="about-page__card-bg">
                                <BookOpen className="about-page__card-bg-icon about-page__card-bg-icon--primary" />
                            </div>
                            <div className="about-page__card-content">
                                <div className="about-page__card-icon about-page__card-icon--primary">
                                    <BookOpen size={28} />
                                </div>
                                <Title level={3} className="about-page__card-title">Tầm nhìn</Title>
                                <Paragraph className="about-page__card-text">
                                    Xây dựng một hệ sinh thái văn hóa số toàn diện, không chỉ dừng lại ở du lịch
                                    mà là nơi lưu giữ, học hỏi và trải nghiệm bản sắc Việt. Bắt đầu từ dải đất
                                    Tây Nguyên đại ngàn và hướng tới bao phủ trọn vẹn 63 tỉnh thành Việt Nam.
                                </Paragraph>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="about-page__features">
                <div className="about-page__container">
                    <div className="about-page__section-header">
                        <Text className="about-page__section-label">Tính năng</Text>
                        <Title level={2} className="about-page__section-title">
                            Cội Việt mang đến gì cho bạn?
                        </Title>
                        <Paragraph className="about-page__section-desc">
                            Khám phá những trải nghiệm văn hóa độc đáo và kiến thức bản địa phong phú
                        </Paragraph>
                    </div>

                    <div className="about-page__features-grid">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                className="about-page__feature-card"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <div className={`about-page__feature-icon about-page__feature-icon--${feature.color}`}>
                                    <feature.icon size={24} />
                                </div>
                                <Title level={4} className="about-page__feature-title">{feature.title}</Title>
                                <Paragraph className="about-page__feature-text">{feature.description}</Paragraph>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="about-page__values">
                <div className="about-page__container">
                    <div className="about-page__values-wrapper">
                        <motion.div
                            className="about-page__values-content"
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <Text className="about-page__section-label">Giá trị cốt lõi</Text>
                            <Title level={2} className="about-page__values-title">
                                Những giá trị chúng tôi theo đuổi
                            </Title>
                            <Paragraph className="about-page__values-desc">
                                Mỗi hành trình cùng Cội Việt đều được xây dựng dựa trên sự tôn trọng,
                                trách nhiệm và cam kết mang lại giá trị thực sự cho cộng đồng.
                            </Paragraph>
                            <ul className="about-page__values-list">
                                {values.map((value, index) => (
                                    <motion.li
                                        key={index}
                                        className="about-page__values-item"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4, delay: index * 0.1 }}
                                    >
                                        <CheckCircle className="about-page__values-check" />
                                        <span>{value}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>

                        <motion.div
                            className="about-page__values-image"
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <div className="about-page__values-img-wrapper">
                                <img 
                                    src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=800" 
                                    alt="Tây Nguyên văn hóa"
                                />
                                <div className="about-page__values-badge">
                                    <Star size={20} />
                                    <span>Trải nghiệm đáng giá</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Timeline Section */}
            <section className="about-page__timeline">
                <div className="about-page__container">
                    <div className="about-page__section-header">
                        <Text className="about-page__section-label">Hành trình</Text>
                        <Title level={2} className="about-page__section-title">
                            Câu chuyện của Cội Việt
                        </Title>
                    </div>

                    <div className="about-page__timeline-grid">
                        {timeline.map((item, index) => (
                            <motion.div
                                key={index}
                                className="about-page__timeline-item"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.15 }}
                            >
                                <div className="about-page__timeline-year">{item.year}</div>
                                <div className="about-page__timeline-content">
                                    <Title level={4} className="about-page__timeline-title">{item.title}</Title>
                                    <Paragraph className="about-page__timeline-desc">{item.description}</Paragraph>
                                </div>
                                {index < timeline.length - 1 && (
                                    <div className="about-page__timeline-connector" />
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team & Contact Section */}
            <section className="about-page__team">
                <div className="about-page__container">
                    <div className="about-page__section-header">
                        <Text className="about-page__section-label">Đội ngũ</Text>
                        <Title level={2} className="about-page__section-title">Đội ngũ & Hợp tác</Title>
                    </div>

                    <div className="about-page__team-grid">
                        <motion.div
                            className="about-page__team-card"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="about-page__team-card-icon about-page__team-card-icon--primary">
                                <Users size={24} />
                            </div>
                            <div className="about-page__team-card-content">
                                <Title level={5} className="about-page__team-card-title">Đội ngũ sáng lập</Title>
                                <Paragraph className="about-page__team-card-text">
                                    Nhóm sinh viên và chuyên gia đam mê văn hóa bản địa, 
                                    cam kết tôn trọng và phục dựng câu chuyện đúng bản chất.
                                </Paragraph>
                            </div>
                        </motion.div>

                        <motion.div
                            className="about-page__team-card"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <div className="about-page__team-card-icon about-page__team-card-icon--amber">
                                <TrendingUp size={24} />
                            </div>
                            <div className="about-page__team-card-content">
                                <Title level={5} className="about-page__team-card-title">Đối tác & Cộng đồng</Title>
                                <Paragraph className="about-page__team-card-text">
                                    Hợp tác với nghệ nhân, làng nghề và tổ chức văn hóa địa phương
                                    để phát triển các sản phẩm du lịch bền vững.
                                </Paragraph>
                            </div>
                        </motion.div>

                        <motion.div
                            className="about-page__team-card"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="about-page__team-card-icon about-page__team-card-icon--teal">
                                <Mail size={24} />
                            </div>
                            <div className="about-page__team-card-content">
                                <Title level={5} className="about-page__team-card-title">Liên hệ hợp tác</Title>
                                <Paragraph className="about-page__team-card-text">
                                    Email: hello@coiviet.vn<br />
                                    Hotline: 1900 xxxx
                                </Paragraph>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="about-page__cta">
                <div className="about-page__container">
                    <motion.div
                        className="about-page__cta-content"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <Title level={2} className="about-page__cta-title">
                            Sẵn sàng khám phá văn hóa Việt?
                        </Title>
                        <Paragraph className="about-page__cta-desc">
                            Bắt đầu hành trình tìm về cội nguồn cùng Cội Việt ngay hôm nay.
                            Hàng trăm tour trải nghiệm và bài học văn hóa đang chờ bạn.
                        </Paragraph>
                        <div className="about-page__cta-actions">
                            <Link to="/#dang-ky-tu-van" className="about-page__cta-link">
                                <Button type="primary" size="large" className="about-page__cta-btn">
                                    Đăng ký miễn phí
                                    <ArrowRight size={20} />
                                </Button>
                            </Link>
                            <Link to="/tours" className="about-page__cta-link">
                                <Button size="large" className="about-page__cta-btn about-page__cta-btn--ghost">
                                    Tìm hiểu thêm
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default About;
