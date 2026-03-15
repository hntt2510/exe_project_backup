import type { AuthLoginResponse } from "../services/authApi";

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
      avatarUrl: "",
      role: response.role || "CUSTOMER",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    })
  );
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
