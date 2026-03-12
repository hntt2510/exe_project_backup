import { Link } from 'react-router-dom';
import { Facebook, Youtube, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import '../styles/components/_footer.scss';

const footerLinks = {
    explore: [
        { label: 'Bản đồ văn hóa', path: '/#cultural-map' },
        { label: 'Tour trải nghiệm', path: '/tours' },
        { label: 'Nghệ nhân truyền tải', path: '/artisans' },
        { label: 'Chính sách', path: '/policy' },
    ],
    support: [
        { label: 'Liên hệ', path: '/contact' },
        { label: 'Câu hỏi thường gặp', path: '/faq' },
        { label: 'Hướng dẫn đặt tour', path: '/guide' },
        { label: 'Chính sách', path: '/policy' },
    ],
};

const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: Youtube, href: 'https://youtube.com', label: 'YouTube' },
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
];

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer__container">
                <div className="footer__content">
                    {/* Brand Column */}
                    <div className="footer__brand">
                        <Link to="/" className="footer__brand-link">
                            <img
                                src="/logo.png"
                                alt="Cội Việt"
                                className="footer__brand-logo"
                            />
                            <span className="footer__brand-text">Cội Việt</span>
                        </Link>
                        <p className="footer__brand-description">
                            Khám phá văn hóa Việt Nam qua những trải nghiệm vùng miền
                        </p>
                        {/* Social Links */}
                        <div className="footer__social">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="footer__social-link"
                                    aria-label={social.label}
                                >
                                    <social.icon />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Explore Links */}
                    <div className="footer__column">
                        <h3 className="footer__title">Khám phá</h3>
                        <ul className="footer__links">
                            {footerLinks.explore.map((link) => (
                                <li key={link.path} className="footer__link-item">
                                    <Link to={link.path} className="footer__link">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div className="footer__column">
                        <h3 className="footer__title">Hỗ trợ</h3>
                        <ul className="footer__links">
                            {footerLinks.support.map((link) => (
                                <li key={link.path} className="footer__link-item">
                                    <Link to={link.path} className="footer__link">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="footer__column">
                        <h3 className="footer__title">Liên hệ</h3>
                        <ul className="footer__contact">
                            <li className="footer__contact-item">
                                <Phone />
                                <span>0123 456 789</span>
                            </li>
                            <li className="footer__contact-item">
                                <Mail />
                                <span>info@coiviet.com</span>
                            </li>
                            <li className="footer__contact-item">
                                <MapPin />
                                <span>Đại học FPT, Thủ Đức, TP.HCM</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="footer__bottom">
                    <p className="footer__copyright">
                        © 2025 Cội Việt. Tất cả quyền được bảo lưu.
                    </p>
                    <div className="footer__legal">
                        <Link to="/privacy" className="footer__legal-link">
                            Chính sách bảo mật
                        </Link>
                        <Link to="/terms" className="footer__legal-link">
                            Điều khoản sử dụng
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
