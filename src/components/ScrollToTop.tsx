import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function scrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

/**
 * Scroll lên đầu trang mỗi khi navigate sang route mới.
 * Bỏ qua khi có hash #dang-ky-tu-van (để HomePage scroll tới section Đăng ký tư vấn).
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash === '#dang-ky-tu-van') return;

    scrollToTop();
    const raf = requestAnimationFrame(() => {
      scrollToTop();
      requestAnimationFrame(() => scrollToTop());
    });
    const t = setTimeout(scrollToTop, 100);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [pathname, hash]);

  return null;
}
