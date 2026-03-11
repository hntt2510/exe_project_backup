import { useEffect } from "react";
import { message, Spin } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import type { AuthLoginResponse } from "../services/authApi";
import { clearAuthSession, persistAuthSession } from "../utils/authSession";

type OAuthCallbackPayload = {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
  role: AuthLoginResponse["role"];
  userId: number;
  username: string;
  email: string;
  message?: string;
};

type JwtPayload = {
  sub?: string;
  role?: string;
  userId?: number;
  exp?: number;
};

const parseBoolean = (value: string | null): boolean | undefined => {
  if (value == null) return undefined;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "success", "ok"].includes(normalized)) return true;
  if (["0", "false", "failed", "error"].includes(normalized)) return false;
  return undefined;
};

const parseRole = (value: string | null): AuthLoginResponse["role"] => {
  const normalized = (value ?? "").trim().toUpperCase();
  if (
    normalized === "ADMIN" ||
    normalized === "STAFF" ||
    normalized === "ARTISAN" ||
    normalized === "CUSTOMER"
  ) {
    return normalized;
  }
  return "CUSTOMER";
};

const decodeJwtPayload = (token?: string): JwtPayload | null => {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
};

const parseNumber = (value: string | null, fallback: number): number => {
  if (!value) return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const buildParams = (search: string, hash: string): URLSearchParams => {
  const queryParams = new URLSearchParams(search);
  const hashText = hash.startsWith("#") ? hash.slice(1) : hash;
  const hashParams = new URLSearchParams(hashText);
  const merged = new URLSearchParams(queryParams);

  hashParams.forEach((value, key) => {
    if (!merged.has(key)) {
      merged.set(key, value);
    }
  });

  return merged;
};

const getPayloadFromUrl = (search: string, hash: string): OAuthCallbackPayload => {
  const params = buildParams(search, hash);

  const accessToken =
    params.get("accessToken") ??
    params.get("access_token") ??
    params.get("token") ??
    params.get("jwt") ??
    undefined;
  const refreshToken =
    params.get("refreshToken") ?? params.get("refresh_token") ?? "google_oauth";
  const tokenType = params.get("tokenType") ?? params.get("token_type") ?? "Bearer";
  const expiresIn = parseNumber(params.get("expiresIn") ?? params.get("expires_in"), 3600);
  const successByToken = Boolean(accessToken);
  const successParam =
    parseBoolean(params.get("success")) ??
    parseBoolean(params.get("status")) ??
    parseBoolean(params.get("result"));
  const success = successParam ?? successByToken;
  const jwt = decodeJwtPayload(accessToken);

  const roleFromJwt = parseRole(jwt?.role ?? null);
  const roleFromQuery = parseRole(params.get("role"));
  const role = params.get("role") ? roleFromQuery : roleFromJwt;

  const userIdFromQuery = Number(params.get("userId") ?? params.get("id") ?? 0);
  const userIdFromJwt = Number(jwt?.userId ?? 0);
  const userId = userIdFromQuery > 0 ? userIdFromQuery : userIdFromJwt;

  const username =
    params.get("username") ??
    params.get("name") ??
    jwt?.sub ??
    "Google User";

  return {
    success,
    accessToken,
    refreshToken,
    tokenType,
    expiresIn,
    role,
    userId,
    username,
    email: params.get("email") ?? "",
    message: params.get("message") ?? params.get("error_description") ?? params.get("error") ?? undefined,
  };
};

const GoogleAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const payload = getPayloadFromUrl(location.search, location.hash);

    if (!payload.success || !payload.accessToken) {
      clearAuthSession();
      message.error(payload.message || "Đăng nhập Google thất bại");
      navigate("/login", { replace: true });
      return;
    }

    const jwt = decodeJwtPayload(payload.accessToken);
    if (jwt?.exp && jwt.exp * 1000 <= Date.now()) {
      clearAuthSession();
      message.error("Token đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      navigate("/login", { replace: true });
      return;
    }

    persistAuthSession({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken || "google_oauth",
      tokenType: payload.tokenType,
      userId: payload.userId || 0,
      username: payload.username,
      email: payload.email,
      role: payload.role,
      expiresIn: payload.expiresIn,
    });

    const storedToken = localStorage.getItem("accessToken");
    if (!storedToken) {
      clearAuthSession();
      message.error("Không thể lưu phiên đăng nhập. Vui lòng thử lại.");
      navigate("/login", { replace: true });
      return;
    }

    message.success("Đăng nhập Google thành công!");
    navigate("/", { replace: true });
  }, [location.hash, location.search, navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Spin size="large" tip="Đang xử lý đăng nhập Google..." />
    </div>
  );
};

export default GoogleAuthCallback;
