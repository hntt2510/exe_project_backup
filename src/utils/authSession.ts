import type { AuthLoginResponse } from "../services/authApi";
import { getUserProfile } from "../services/profileApi";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const SESSION_LOGIN_TIME_KEY = "sessionLoginTime";

export const persistAuthSession = (response: AuthLoginResponse) => {
  const now = Date.now();
  localStorage.setItem("accessToken", response.accessToken);
  localStorage.setItem("refreshToken", response.refreshToken);
  localStorage.setItem("isAuthenticated", "true");
  localStorage.setItem("userAccount", response.email);
  localStorage.setItem(SESSION_LOGIN_TIME_KEY, String(now));
  localStorage.setItem(
    "userInfo",
    JSON.stringify({
      id: response.userId,
      email: response.email,
      fullName: response.username || response.email,
      phone: "",
      avatarUrl: response.avatarUrl ?? "",
      role: response.role || "CUSTOMER",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    })
  );
};

/**
 * Đồng bộ userInfo (đặc biệt avatarUrl) từ profile API.
 * Gọi sau khi đăng nhập để đảm bảo avatar và thông tin profile được lưu đúng.
 */
export const syncUserInfoFromProfile = async (userId: number): Promise<void> => {
  try {
    const profile = await getUserProfile(userId);
    const stored = localStorage.getItem("userInfo");
    if (!stored) return;
    const parsed = JSON.parse(stored);
    const updated = {
      ...parsed,
      fullName: profile.fullName || parsed.fullName,
      avatarUrl: profile.avatarUrl || parsed.avatarUrl || "",
      phone: profile.phone ?? parsed.phone,
    };
    localStorage.setItem("userInfo", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("auth-login"));
  } catch {
    // ignore - token có thể chưa sẵn sàng
  }
};

export const isSessionExpired = (): boolean => {
  const loginTime = localStorage.getItem(SESSION_LOGIN_TIME_KEY);
  if (!loginTime) {
    return false;
  }
  const elapsed = Date.now() - parseInt(loginTime, 10);
  return elapsed > SESSION_TIMEOUT_MS;
};

const AI_CHAT_STORAGE_KEY = "aiChatMessages";

export const clearAuthSession = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("userAccount");
  localStorage.removeItem("userInfo");
  localStorage.removeItem(SESSION_LOGIN_TIME_KEY);
  sessionStorage.removeItem(AI_CHAT_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("auth-logout"));
};
