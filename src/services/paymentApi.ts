import type { ApiResponse, TourSchedule } from '../types';
import { api } from './api';

// ========== Payment Method ==========

export type PaymentMethod = 'VNPAY' | 'MOMO' | 'CASH';

// ========== Tour Schedules ==========

/**
 * GET /api/tours/public/{id}/schedules
 * Lấy danh sách lịch khởi hành của tour (public, không cần auth).
 */
export const getTourSchedules = async (tourId: number): Promise<TourSchedule[]> => {
  const response = await api.get<ApiResponse<TourSchedule[]>>(
    `/api/tours/public/${tourId}/schedules`,
  );
  return response.data.data;
};

/**
 * GET /api/tour-schedules/{id}
 * Lấy thông tin 1 schedule.
 */
export const getTourScheduleById = async (id: number): Promise<TourSchedule> => {
  const response = await api.get<ApiResponse<TourSchedule>>(
    `/api/tour-schedules/${id}`,
  );
  return response.data.data;
};

// ========== Booking ==========

export interface CreateBookingRequest {
  tourId: number;
  tourScheduleId: number;
  numParticipants: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  voucherCode?: string;
  paymentMethod: PaymentMethod;
}

export interface BookingResponse {
  id: number;
  bookingCode: string;
  userId: number;
  tourId: number;
  tourTitle: string;
  tourScheduleId: number;
  tourDate: string;
  tourStartTime: string;
  numParticipants: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  paidAt: string | null;
  cancelledAt: string | null;
  cancellationFee: number;
  refundAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Timeout cao hơn cho booking/payment vì Render.com free tier cold start có thể mất > 60s
const PAYMENT_TIMEOUT = 120_000; // 2 phút

/**
 * POST /api/bookings
 * Tạo booking mới → trả về bookingId.
 */
export const createBooking = async (
  data: CreateBookingRequest,
): Promise<BookingResponse> => {
  const response = await api.post<ApiResponse<BookingResponse>>(
    '/api/bookings',
    data,
    { timeout: PAYMENT_TIMEOUT },
  );
  return response.data.data;
};

// ========== Payment ==========

export interface CreatePaymentRequest {
  bookingId: number;
  paymentMethod: PaymentMethod;
  /**
   * MoMo requestType — quyết định giao diện thanh toán:
   * - 'captureWallet'  → trang đơn giản, chỉ nút "Thanh toán bằng Ví MoMo"
   * - 'payWithMethod'  → trang đầy đủ với QR code, VietQR, ngân hàng…
   */
  requestType?: string;
}

export interface CreatePaymentResponse {
  id: number;
  bookingId: number;
  bookingCode: string;
  transactionId: string;
  paymentMethod: string;
  amount: number;
  status: string;
  gatewayTransactionId: string;
  paymentUrl: string;
  paidAt: string | null;
  createdAt: string;
}

/**
 * POST /api/payments/create
 * Tạo payment từ bookingId → trả về paymentUrl (MoMo/VNPay redirect).
 */
export const createPayment = async (
  data: CreatePaymentRequest,
): Promise<CreatePaymentResponse> => {
  const response = await api.post<ApiResponse<CreatePaymentResponse>>(
    '/api/payments/create',
    data,
    { timeout: PAYMENT_TIMEOUT },
  );
  return response.data.data;
};

/**
 * GET /api/bookings/{id}
 * Lấy thông tin chi tiết booking.
 */
export const getBookingById = async (id: number): Promise<BookingResponse> => {
  const response = await api.get<ApiResponse<BookingResponse>>(
    `/api/bookings/${id}`,
  );
  return response.data.data;
};

/**
 * GET /api/payments/{id}
 * Lấy thông tin payment.
 */
export const getPaymentById = async (id: number): Promise<CreatePaymentResponse> => {
  const response = await api.get<ApiResponse<CreatePaymentResponse>>(
    `/api/payments/${id}`,
  );
  return response.data.data;
};

/**
 * GET /api/payments/vnpay/return
 * VNPay payment return callback (browser redirect).
 */
export const getVnpayReturn = async (queryString: string): Promise<CreatePaymentResponse> => {
  const response = await api.get<ApiResponse<CreatePaymentResponse>>(
    `/api/payments/vnpay/return?${queryString}`,
  );
  return response.data.data;
};

/**
 * GET /api/payments/momo/return
 * MoMo payment return callback (browser redirect).
 */
export const getMomoReturn = async (queryString: string): Promise<CreatePaymentResponse> => {
  const response = await api.get<ApiResponse<CreatePaymentResponse>>(
    `/api/payments/momo/return?${queryString}`,
  );
  return response.data.data;
};

/**
 * GET /api/bookings/public/by-code/{bookingCode}
 * Lấy thông tin booking bằng booking code (public endpoint — không cần auth).
 */
export const getBookingByCode = async (bookingCode: string): Promise<BookingResponse> => {
  const response = await api.get<ApiResponse<BookingResponse>>(
    `/api/bookings/public/by-code/${encodeURIComponent(bookingCode)}`,
  );
  return response.data.data;
};

// ========== Voucher ==========

export interface Voucher {
  id: number;
  code: string;
  discountType: string;       // "PERCENTAGE" | "FIXED_AMOUNT"
  discountValue: number;
  minPurchase: number;
  maxUsage: number;
  currentUsage: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
}

/**
 * GET /api/vouchers/public/validate/{code}
 * Validate 1 mã voucher cụ thể — trả về thông tin voucher nếu hợp lệ.
 */
export const validateVoucher = async (code: string): Promise<Voucher> => {
  const response = await api.get<ApiResponse<Voucher>>(
    `/api/vouchers/public/validate/${encodeURIComponent(code)}`,
  );
  return response.data.data;
};

/**
 * Tính giá trị giảm của voucher trên 1 số tiền.
 */
export function calcVoucherDiscount(voucher: Voucher, amount: number): number {
  if (amount < voucher.minPurchase) return 0;
  if (voucher.discountType === 'PERCENTAGE') {
    return Math.round(amount * voucher.discountValue / 100);
  }
  // FIXED_AMOUNT
  return Math.min(voucher.discountValue, amount);
}
