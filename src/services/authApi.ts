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

export const authLogin = async (data: LoginRequest): Promise<AuthLoginResponse> => {
  const response = await api.post<ApiResponse<AuthLoginResponse>>("/api/auth/login", data);
  return response.data.data;
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
  const response = await api.post<ApiResponse<AuthLoginResponse>>("/api/auth/google", data);
  return response.data.data;
};

export const startGoogleOAuth2Login = (): void => {
  window.location.href = GOOGLE_OAUTH2_URL;
};

export const authRefreshToken = async (
  data: RefreshTokenRequest
): Promise<AuthLoginResponse> => {
  const response = await api.post<ApiResponse<AuthLoginResponse>>("/api/auth/refresh", data);
  return response.data.data;
};
