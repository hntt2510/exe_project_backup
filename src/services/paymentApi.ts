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

/** Parse VNPay params từ URL query string */
export function parseVnpayParams(queryString: string): {
  bookingCode: string;
  status: 'PAID' | 'FAILED';
  vnpResponseCode: string;
  amount: number;
} {
  const params = new URLSearchParams(queryString);
  const vnpOrderInfo = params.get('vnp_OrderInfo') || params.get('vnp_Orderinfo') || '';
  const bookingCode = vnpOrderInfo.replace(/^Thanh toan tour\s+/i, '').trim();
  const vnpResponseCode = params.get('vnp_ResponseCode') || '';
  const vnpAmount = parseInt(params.get('vnp_Amount') || '0', 10);
  return {
    bookingCode,
    status: vnpResponseCode === '00' ? 'PAID' : 'FAILED',
    vnpResponseCode,
    amount: vnpAmount / 100,
  };
}

/**
 * GET /api/payments/vnpay/return
 * Backend trả 302 redirect (success) hoặc 200 plain text (failure), KHÔNG trả JSON.
 * Gọi backend để xử lý + verify, sau đó FE redirect theo kết quả.
 */
export const getVnpayReturn = async (
  queryString: string,
): Promise<{ redirectUrl?: string; paymentResponse: CreatePaymentResponse }> => {
  const parsed = parseVnpayParams(queryString);
  const fallbackResponse: CreatePaymentResponse = {
    id: 0,
    bookingId: 0,
    bookingCode: parsed.bookingCode,
    transactionId: '',
    paymentMethod: 'VNPAY',
    amount: parsed.amount,
    status: parsed.status,
    gatewayTransactionId: '',
    paymentUrl: '',
    paidAt: null,
    createdAt: '',
  };

  try {
    const response = await api.get<unknown>(`/api/payments/vnpay/return?${queryString}`, {
      maxRedirects: 0,
      validateStatus: (s) => s === 200 || s === 302,
    });

    if (response.status === 302) {
      const loc = response.headers.location;
      const redirectUrl = typeof loc === 'string' ? loc : Array.isArray(loc) ? loc[0] : undefined;
      if (redirectUrl) {
        return { redirectUrl, paymentResponse: { ...fallbackResponse, status: 'PAID' } };
      }
    }

    return { paymentResponse: { ...fallbackResponse, status: 'FAILED' } };
  } catch (err) {
    return { paymentResponse: fallbackResponse };
  }
};

/**
 * GET /api/payments/momo/return
 * MoMo payment return callback (browser redirect).
 */
export const getMomoReturn = async (queryString: string): Promise<CreatePaymentResponse> => {
  const response = await api.get<ApiResponse<CreatePaymentResponse>>(
    `/api/payments/momo/return?${queryString}`,
  );
  const payload = response.data?.data;
  if (!payload || typeof payload !== 'object') {
    throw new Error('Không nhận được dữ liệu kết quả thanh toán MoMo');
  }
  return payload;
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
 * GET /api/vouchers/public/by-tour/{tourId}
 * Lấy danh sách voucher áp dụng cho tour.
 */
export const getVouchersByTourId = async (tourId: number): Promise<Voucher[]> => {
  const response = await api.get<ApiResponse<Voucher[]>>(
    `/api/vouchers/public/by-tour/${tourId}`,
  );
  const raw = response.data.data ?? [];
  return raw.map((v: Record<string, unknown>) => ({
    id: Number(v.id ?? 0),
    code: (v.code as string) ?? "",
    discountType: (v.discountType as string) ?? "PERCENTAGE",
    discountValue: Number(v.discountValue ?? 0),
    minPurchase: Number(v.minPurchase ?? 0),
    maxUsage: Number(v.maxUsage ?? 1),
    currentUsage: Number(v.currentUsage ?? 0),
    validFrom: (v.validFrom as string) ?? "",
    validUntil: (v.validUntil as string) ?? "",
    isActive: (v.isActive as boolean) ?? true,
    createdAt: (v.createdAt as string) ?? "",
  }));
};

/**
 * GET /api/vouchers/public/validate/{code}
 * Validate voucher — trả về thông tin nếu hợp lệ. Có thể truyền purchaseAmount để kiểm tra minPurchase.
 */
export const validateVoucher = async (code: string, purchaseAmount?: number): Promise<Voucher> => {
  const params = purchaseAmount != null ? `?purchaseAmount=${purchaseAmount}` : '';
  const response = await api.get<ApiResponse<Voucher>>(
    `/api/vouchers/public/validate/${encodeURIComponent(code)}${params}`,
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
