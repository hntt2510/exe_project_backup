import { Navigate, useLocation } from "react-router-dom";
import { setLoginRedirect } from "../utils/loginRedirectCookie";

function hasAuthToken(): boolean {
  return !!localStorage.getItem("accessToken");
}

/**
 * Bảo vệ route — yêu cầu đăng nhập mới cho vào.
 * Nếu chưa đăng nhập: lưu redirect, chuyển về /login.
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  if (!hasAuthToken()) {
    const currentPath = location.pathname + location.search;
    setLoginRedirect({ path: currentPath });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
