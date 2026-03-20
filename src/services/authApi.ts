import type { ApiResponse, User } from "../types";
import { API_BASE_URL, api } from "./api";

export type LoginRequest = {
  username: string;
  password: string;
};

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
  phone?: string;
  fullName?: string;
  dateOfBirth?: string; // format: YYYY-MM-DD
};

export type ForgotPasswordRequest = {
  email: string;
};

export type VerifyOtpRequest = {
  email: string;
  otp: string;
};

export type ResetPasswordRequest = {
  email: string;
  otp: string;
  newPassword: string;
};

export type AuthLoginResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: number;
  username: string;
  email: string;
  role: "CUSTOMER" | "ARTISAN" | "ADMIN" | "STAFF";
  expiresIn: number;
  avatarUrl?: string;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type GoogleLoginRequest = {
  idToken: string;
};

export const GOOGLE_OAUTH2_URL = `${API_BASE_URL}oauth2/authorization/google`;

/** Chuẩn hóa response login — backend có thể trả role/userId ở top-level hoặc trong user */
function normalizeLoginResponse(raw: unknown): AuthLoginResponse {
  const d = (raw ?? {}) as Record<string, unknown>;
  const user = d.user as Record<string, unknown> | undefined;
  const roleRaw = (d.role as string) ?? (user?.role as string) ?? "CUSTOMER";
  const role = String(roleRaw).toUpperCase() as AuthLoginResponse["role"];
  const validRole = ["ADMIN", "STAFF", "ARTISAN", "CUSTOMER"].includes(role)
    ? role
    : "CUSTOMER";
  return {
    accessToken: (d.accessToken as string) ?? "",
    refreshToken: (d.refreshToken as string) ?? "",
    tokenType: (d.tokenType as string) ?? "Bearer",
    userId: Number(d.userId ?? user?.id ?? 0),
    username: (d.username as string) ?? (user?.username as string) ?? (user?.fullName as string) ?? "",
    email: (d.email as string) ?? (user?.email as string) ?? "",
    role: validRole,
    expiresIn: Number(d.expiresIn ?? 3600),
    avatarUrl: (d.avatarUrl as string) ?? (user?.avatarUrl as string),
  };
}

export const authLogin = async (data: LoginRequest): Promise<AuthLoginResponse> => {
  const response = await api.post<ApiResponse<unknown>>("/api/auth/login", data);
  return normalizeLoginResponse(response.data.data);
};

export const authLogout = async (): Promise<void> => {
  await api.post("/api/auth/logout");
};

export const authRegister = async (data: RegisterRequest): Promise<User> => {
  const response = await api.post<ApiResponse<User>>("/api/users", data);
  return response.data.data;
};

export const authForgotPassword = async (data: ForgotPasswordRequest): Promise<void> => {
  await api.post("/api/auth/forgot-password", data);
};

export const authVerifyOtp = async (data: VerifyOtpRequest): Promise<void> => {
  await api.post("/api/auth/verify-otp", data);
};

export const authResetPassword = async (data: ResetPasswordRequest): Promise<void> => {
  await api.post("/api/auth/reset-password", data);
};

export const authGoogleLogin = async (
  data: GoogleLoginRequest
): Promise<AuthLoginResponse> => {
  const response = await api.post<ApiResponse<unknown>>("/api/auth/google", data);
  return normalizeLoginResponse(response.data.data);
};

export const startGoogleOAuth2Login = (): void => {
  window.location.href = GOOGLE_OAUTH2_URL;
};

export const authRefreshToken = async (
  data: RefreshTokenRequest
): Promise<AuthLoginResponse> => {
  const response = await api.post<ApiResponse<unknown>>("/api/auth/refresh", data);
  return normalizeLoginResponse(response.data.data);
};
