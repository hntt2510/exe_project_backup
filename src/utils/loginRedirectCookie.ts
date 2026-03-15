/**
 * Lưu/thử lấy thông tin redirect sau khi đăng nhập (ví dụ: quay lại trang thanh toán).
 * Dùng cookie để persist qua refresh và OAuth redirect.
 */

const COOKIE_NAME = 'login_redirect';
const COOKIE_MAX_AGE = 60 * 15; // 15 phút
const COOKIE_PATH = '/';

export interface LoginRedirectPayload {
  path: string;
  state?: {
    contactInfo?: { fullName: string; email: string; phone: string };
    bookingDetails?: Record<string, unknown>;
  };
}

/**
 * Lưu thông tin redirect vào cookie trước khi chuyển đến trang login
 */
export function setLoginRedirect(payload: LoginRedirectPayload): void {
  try {
    const json = JSON.stringify(payload);
    const encoded = btoa(encodeURIComponent(json));
    const maxLen = 3800; // Giữ dưới giới hạn cookie ~4KB
    const value = encoded.length > maxLen ? encoded.slice(0, maxLen) : encoded;
    document.cookie = `${COOKIE_NAME}=${value}; path=${COOKIE_PATH}; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch (e) {
    console.warn('[loginRedirect] Failed to set cookie:', e);
  }
}

/**
 * Đọc và xóa cookie redirect, trả về payload nếu có
 */
export function consumeLoginRedirect(): LoginRedirectPayload | null {
  try {
    const match = document.cookie.match(new RegExp(`(?:(?:^|.*;\\s*)${COOKIE_NAME}\\s*=\\s*([^;]*).*$)|^.*$`));
    const raw = match ? match[1] : null;
    if (!raw) return null;

    const decoded = decodeURIComponent(atob(raw));
    const payload = JSON.parse(decoded) as LoginRedirectPayload;

    // Xóa cookie ngay sau khi đọc
    document.cookie = `${COOKIE_NAME}=; path=${COOKIE_PATH}; max-age=0`;

    if (payload.path) return payload;
    return null;
  } catch {
    // Xóa cookie lỗi
    document.cookie = `${COOKIE_NAME}=; path=${COOKIE_PATH}; max-age=0`;
    return null;
  }
}
