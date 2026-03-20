/**
 * Staff API - Gọi đúng endpoint backend cho role Staff.
 * BE: GET /api/bookings, /api/tours/public, /api/artisans/public, /api/tour-schedules/tour/{id}
 */
import api from "./api";
import type { ApiResponse } from "../types";

export interface StaffBooking {
  id: number;
  bookingCode?: string;
  userId?: number;
  tourId?: number;
  tourTitle?: string;
  tourScheduleId?: number;
  tourDate?: string;
  tourStartTime?: string;
  numParticipants?: number;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  totalAmount?: number;
  discountAmount?: number;
  finalAmount?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  paidAt?: string | null;
  cancelledAt?: string | null;
  cancellationFee?: number;
  refundAmount?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StaffTourSchedule {
  id?: number;
  tour?: { id?: number; title?: string };
  tourDate?: string;
  tour_date?: string;
  startTime?: string | object;
  maxSlots?: number;
  max_slots?: number;
  bookedSlots?: number;
  booked_slots?: number;
  status?: string;
}

function extractArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const arr =
      (obj.content as T[]) ??
      (obj.data as T[]) ??
      (obj.items as T[]) ??
      (obj.bookings as T[]) ??
      [];
    return Array.isArray(arr) ? arr : [];
  }
  return [];
}

/** GET /api/bookings - Staff xem tất cả booking */
export async function getStaffBookings(): Promise<StaffBooking[]> {
  const response = await api.get<ApiResponse<StaffBooking[]>>("/api/bookings");
  const body = response?.data as Record<string, unknown> | undefined;
  const raw = body?.data ?? body;
  return extractArray<StaffBooking>(raw);
}

/** GET /api/tours/public - Danh sách tour */
export async function getStaffTours(): Promise<Array<{ id: number; title?: string }>> {
  const response = await api.get<ApiResponse<Array<{ id: number; title?: string }>>>(
    "/api/tours/public"
  );
  const body = response.data as Record<string, unknown>;
  const raw = body?.data ?? body;
  const arr = extractArray<{ id: number; title?: string }>(raw);
  return arr.filter((t) => t && typeof t.id === "number");
}

/** GET /api/artisans/public - Danh sách nghệ nhân */
export async function getStaffArtisans(): Promise<unknown[]> {
  const response = await api.get<ApiResponse<unknown[]>>("/api/artisans/public");
  const body = response.data as Record<string, unknown>;
  const raw = body?.data ?? body;
  return extractArray(raw);
}

/** GET /api/tour-schedules/tour/{tourId} - Lịch tour theo tourId */
export async function getStaffTourSchedules(
  tourId: number
): Promise<StaffTourSchedule[]> {
  if (!tourId || tourId <= 0) return [];
  const response = await api.get<ApiResponse<StaffTourSchedule[]>>(
    `/api/tour-schedules/tour/${tourId}`
  );
  const body = response.data as Record<string, unknown>;
  const raw = body?.data ?? body;
  return extractArray<StaffTourSchedule>(raw);
}
