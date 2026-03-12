import { Link } from 'react-router-dom';
import { Facebook, Youtube, Instagram, Mail, Phone, MapPin } from 'lucide-react';

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
        <footer className="layout-footer">
            <div className="layout-footer__container">
                <div className="layout-footer__grid">
                    {/* Brand Column */}
                    <div className="layout-footer__brand">
                        <Link to="/" className="layout-footer__brand-link">
                            <div className="layout-footer__brand-icon">
                                <span className="layout-footer__brand-letter">C</span>
                            </div>
                            <span className="layout-footer__brand-name">Cội Việt</span>
                        </Link>
                        <p className="layout-footer__brand-desc">
                            Khám phá văn hóa Việt Nam qua những trải nghiệm vùng miền
                        </p>
                        <div className="layout-footer__socials">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="layout-footer__social-link"
                                    aria-label={social.label}
                                >
                                    <social.icon size={20} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Explore Links */}
                    <div>
                        <h3 className="layout-footer__heading">Khám phá</h3>
                        <ul className="layout-footer__link-list">
                            {footerLinks.explore.map((link) => (
                                <li key={link.path}>
                                    <Link to={link.path} className="layout-footer__link">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div>
                        <h3 className="layout-footer__heading">Hỗ trợ</h3>
                        <ul className="layout-footer__link-list">
                            {footerLinks.support.map((link) => (
                                <li key={link.path}>
                                    <Link to={link.path} className="layout-footer__link">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="layout-footer__heading">Liên hệ</h3>
                        <ul className="layout-footer__link-list">
                            <li className="layout-footer__contact-item">
                                <Phone size={16} />
                                <span>0123 456 789</span>
                            </li>
                            <li className="layout-footer__contact-item">
                                <Mail size={16} />
                                <span>info@coiviet.com</span>
                            </li>
                            <li className="layout-footer__contact-item layout-footer__contact-item--top">
                                <MapPin size={16} />
                                <span>Đại học FPT, Thủ Đức, TP.HCM</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="layout-footer__bottom">
                    <div className="layout-footer__bottom-inner">
                        <p className="layout-footer__copyright">
                            © 2025 Cội Việt. Tất cả quyền được bảo lưu.
                        </p>
                        <div className="layout-footer__legal">
                            <Link to="/privacy" className="layout-footer__legal-link">
                                Chính sách bảo mật
                            </Link>
                            <Link to="/terms" className="layout-footer__legal-link">
                                Điều khoản sử dụng
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
