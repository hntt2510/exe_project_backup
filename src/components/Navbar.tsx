import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User } from "lucide-react";
import { Drawer } from "antd";
import "../styles/components/_navbar.scss";
import type { User as UserInfo } from "../types";
import { authLogout } from "../services/authApi";
import { isSessionExpired, clearAuthSession } from "../utils/authSession";

const navLinks = [
  { path: "/", label: "Trang chủ" },
  { path: "/tours", label: "Tours" },
  { path: "/artisans", label: "Góc nghệ nhân" },
  { path: "/blog", label: "Blog" },
  { path: "/learn", label: "Học nhanh" },
  { path: "/about", label: "Về chúng tôi" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() =>
    Boolean(localStorage.getItem("accessToken"))
  );
  const [userInfo, setUserInfo] = useState<UserInfo | null>(() => {
    const raw = localStorage.getItem("userInfo");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserInfo;
    } catch (error) {
      console.error("[Navbar] Failed to parse userInfo:", error);
      return null;
    }
  });

  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  // Check session timeout every 1 minute
  useEffect(() => {
    const checkSessionTimeout = () => {
      if (isLoggedIn && isSessionExpired()) {
        console.warn("[Navbar] Session expired, logging out...");
        handleLogoutAndRedirect();
      }
    };

    const interval = setInterval(checkSessionTimeout, 60000); // Check every 1 minute
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleLogoutAndRedirect = async () => {
    try {
      await authLogout();
    } catch (error) {
      console.error("[Navbar] Logout failed:", error);
    } finally {
      clearAuthSession();
      setIsLoggedIn(false);
      setUserInfo(null);
      setIsOpen(false);
      navigate("/login?expired=true");
    }
  };

  useEffect(() => {
    const handleStorage = () => {
      const token = localStorage.getItem("accessToken");
      setIsLoggedIn(Boolean(token));
      if (!token) {
        setUserInfo(null);
        return;
      }
      const raw = localStorage.getItem("userInfo");
      if (!raw) {
        setUserInfo(null);
        return;
      }
      try {
        setUserInfo(JSON.parse(raw) as UserInfo);
      } catch (error) {
        console.error("[Navbar] Failed to parse userInfo:", error);
        setUserInfo(null);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return "KH";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await authLogout();
    } catch (error) {
      console.error("[Navbar] Logout failed:", error);
    } finally {
      clearAuthSession();
      setIsLoggedIn(false);
      setUserInfo(null);
      setIsOpen(false);
      navigate("/");
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar__container">
        {/* Left: Logo */}
        <div className="navbar__logo">
          <Link to="/" className="navbar__logo-link">
            <img
              src="/logo.png"
              alt="Cội Việt"
              className="navbar__logo-image"
            />
          </Link>
          <span className="navbar__logo-text brand-name">Cội Việt</span>
        </div>

        {/* Center: Navigation Menu */}
        <div className="navbar__menu">
          <div className="navbar__menu-container">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`navbar__menu-link ${
                  isActive(link.path) ? "navbar__menu-link--active" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Auth Buttons */}
        <div className="navbar__auth">
          {isLoggedIn ? (
            <div className="navbar__auth-logged-in">
              <Link
                to="/profile"
                className="navbar__auth-avatar"
                aria-label="Tài khoản"
              >
                {userInfo?.avatarUrl ? (
                  <img
                    src={userInfo.avatarUrl}
                    alt={userInfo.fullName || "Tài khoản"}
                    className="navbar__auth-avatar-image"
                  />
                ) : (
                  <span className="navbar__auth-avatar-fallback">
                    {getInitials(userInfo?.fullName)}
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="navbar__auth-button navbar__auth-button--logout"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="navbar__auth-button navbar__auth-button--login"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="navbar__auth-button navbar__auth-button--register"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>

        {/* Mobile: Hamburger */}
        <div className="navbar__mobile-toggle">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="navbar__mobile-toggle-button"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu (Drawer) */}
      <Drawer
        open={isOpen}
        onClose={() => setIsOpen(false)}
        placement="right"
        size={280}
        className="navbar__drawer-antd"
        styles={{
          body: { padding: 0 }
        }}
      >
        <div className="navbar__drawer-content">
          <div className="navbar__drawer-header">
            <span className="navbar__drawer-header-title">Menu</span>
            <button
              onClick={() => setIsOpen(false)}
              className="navbar__drawer-header-close"
            >
              <X size={20} />
            </button>
          </div>

          <div className="navbar__drawer-links">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`navbar__drawer-link ${
                  isActive(link.path) ? "navbar__drawer-link--active" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="navbar__drawer-auth">
            {isLoggedIn ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="navbar__drawer-auth-button navbar__drawer-auth-button--profile"
                >
                  {userInfo?.avatarUrl ? (
                    <img
                      src={userInfo.avatarUrl}
                      alt={userInfo.fullName || "Tài khoản"}
                      className="navbar__drawer-avatar-image"
                    />
                  ) : (
                    <span className="navbar__drawer-avatar-fallback">
                      {getInitials(userInfo?.fullName)}
                    </span>
                  )}
                  Tài khoản
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="navbar__drawer-auth-button navbar__drawer-auth-button--logout"
                >
                  <User size={20} /> Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="navbar__drawer-auth-button navbar__drawer-auth-button--login"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="navbar__drawer-auth-button navbar__drawer-auth-button--register"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </Drawer>
    </nav>
  );
}
