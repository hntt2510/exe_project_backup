import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authLogin, authGoogleLogin, type LoginRequest } from "../services/authApi";
import { message } from "antd";
import { persistAuthSession, syncUserInfoFromProfile } from "../utils/authSession";
import { consumeLoginRedirect } from "../utils/loginRedirectCookie";
import { getGoogleIdToken } from "../utils/googleAuth";

const GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  "87846938671-76pcjrb3ucf7ngmkai7b2qni7uvrn9qt.apps.googleusercontent.com";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    account: "",
    password: "",
    remember: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if session expired
  useEffect(() => {
    if (searchParams.get("expired") === "true") {
      message.warning("Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.");
    }
  }, [searchParams]);

  // Hiển thị lỗi OAuth khi redirect từ Google callback thất bại
  useEffect(() => {
    const oauthError = searchParams.get("oauth_error");
    if (oauthError) {
      const decoded = decodeURIComponent(oauthError);
      setError(decoded);
      message.error(decoded);
      const next = new URLSearchParams(searchParams);
      next.delete("oauth_error");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams]);

  // Load remembered account
  useEffect(() => {
    const remembered = localStorage.getItem("rememberAccount");
    if (remembered) {
      setFormData({
        account: remembered,
        password: "",
        remember: true,
      });
    }
  }, []);

  // Ẩn scrollbar của body khi ở trang login
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.account || !formData.password) {
      setError("Vui lòng nhập đầy đủ tài khoản và mật khẩu");
      return;
    }

    try {
      setLoading(true);

      // Gọi API login
      const loginData: LoginRequest = {
        username: formData.account,
        password: formData.password,
      };

      const response = await authLogin(loginData);

      // Lưu token vào localStorage
      persistAuthSession(response);

      // Đồng bộ avatar & thông tin từ profile (đảm bảo avatar lưu lại sau khi login)
      if (response.userId) {
        await syncUserInfoFromProfile(response.userId);
      }

      // Lưu thông tin nhớ tài khoản
      if (formData.remember) {
        localStorage.setItem("rememberAccount", formData.account);
      } else {
        localStorage.removeItem("rememberAccount");
      }

      message.success("Đăng nhập thành công!");

      // Ưu tiên redirect về trang thanh toán (từ cookie) nếu có
      const redirect = consumeLoginRedirect();
      if (redirect?.path) {
        navigate(redirect.path, {
          replace: true,
          state: redirect.state ? {
            contactInfo: redirect.state.contactInfo,
            bookingDetails: redirect.state.bookingDetails,
          } : undefined,
        });
        return;
      }

      // Chuyển hướng dựa trên role
      if (response.role === "ADMIN") {
        navigate("/admin");
      } else if (response.role === "STAFF") {
        navigate("/staff");
      } else if (response.role === "ARTISAN") {
        navigate("/artisan");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Đăng nhập thất bại, vui lòng thử lại";
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      setLoading(true);
      const idToken = await getGoogleIdToken(GOOGLE_CLIENT_ID);
      const response = await authGoogleLogin({ idToken });
      persistAuthSession(response);

      // Đồng bộ avatar & thông tin từ profile (đảm bảo avatar lưu lại sau khi login)
      if (response.userId) {
        await syncUserInfoFromProfile(response.userId);
      }

      message.success("Đăng nhập Google thành công!");

      const redirect = consumeLoginRedirect();
      if (redirect?.path) {
        navigate(redirect.path, {
          replace: true,
          state: redirect.state ? {
            contactInfo: redirect.state.contactInfo,
            bookingDetails: redirect.state.bookingDetails,
          } : undefined,
        });
        return;
      }

      if (response.role === "ADMIN") {
        navigate("/admin");
      } else if (response.role === "STAFF") {
        navigate("/staff");
      } else if (response.role === "ARTISAN") {
        navigate("/artisan");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Đăng nhập Google thất bại";
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* LEFT IMAGE - 60% width - Large image container */}
      <div className="login-page__image-container">
        <img
          src="/picture1.png"
          alt="Vietnam Culture"
          className="login-page__image"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            console.error("Failed to load image:", target.src);
          }}
        />
      </div>

      {/* RIGHT FORM - 40% width */}
      <div className="login-page__form-container">
        <div className="login-page__form-wrapper">
          {/* TITLE */}
          <h1 className="login-page__title">
            Đăng Nhập
          </h1>
          <p className="login-page__subtitle">
            Vui lòng đăng nhập để tiếp tục
          </p>

          {/* ERROR */}
          {error && (
            <div className="form__error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-page__form">
            {/* ACCOUNT */}
            <div className="login-page__field">
              <label htmlFor="account" className="login-page__label">
                Tên đăng nhập
              </label>
              <input
                type="text"
                id="account"
                name="account"
                placeholder="Nhập tên đăng nhập"
                value={formData.account}
                onChange={handleChange}
                disabled={loading}
                className="login-page__input"
              />
              <p className="login-page__hint">Đăng nhập bằng tên đăng nhập đã đăng ký.</p>
            </div>

            {/* PASSWORD */}
            <div className="login-page__field">
              <label htmlFor="password" className="login-page__label">
                Mật khẩu
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Nhập mật khẩu"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                className="login-page__input"
              />
            </div>

            {/* OPTIONS */}
            <div className="login-page__options">
              <label className="login-page__checkbox-label">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                />
                <span>Ghi nhớ tài khoản</span>
              </label>
              <Link
                to="/forgot-password"
                className="login-page__forgot-link"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="login-page__submit-button"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

            {/* DIVIDER */}
            <div className="login-page__divider">
              <span>Hoặc</span>
            </div>

            {/* GOOGLE LOGIN */}
            <button
              type="button"
              disabled={loading}
              className="login-page__google-button"
              onClick={handleGoogleLogin}
            >
              <svg 
                viewBox="0 0 24 24" 
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Đăng nhập với Google</span>
            </button>

            {/* REGISTER */}
            <p className="login-page__register-link">
              Bạn chưa có tài khoản?{" "}
              <Link to="/register">
                Đăng ký
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
