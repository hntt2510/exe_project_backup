import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader } from 'lucide-react';
import { getVnpayReturn, getMomoReturn, getBookingByCode, type BookingResponse, type CreatePaymentResponse } from '../../services/paymentApi';
import './PaymentReturnPage.scss';

function readLastBooking(): { bookingCode?: string; tourId?: number } | null {
  try {
    const raw = sessionStorage.getItem('lastBooking');
    if (!raw) return null;
    return JSON.parse(raw) as { bookingCode?: string; tourId?: number };
  } catch {
    return null;
  }
}

function isPaymentSuccess(status: string | undefined): boolean {
  if (!status) return false;
  const s = status.toUpperCase().trim();
  return (
    s === 'PAID' ||
    s === 'SUCCESS' ||
    s === 'COMPLETED' ||
    s === 'CONFIRMED' ||
    s === 'SUCCEEDED' ||
    s === 'DONE'
  );
}

export default function PaymentReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processPaymentReturn = async () => {
      try {
        setIsProcessing(true);
        setError(null);

        // Detect payment method from URL or params
        const isVnpayReturn = window.location.pathname.includes('/payment-return/vnpay');
        const isMomoReturn = window.location.pathname.includes('/payment-return/momo');

        let paymentResponse: CreatePaymentResponse | null = null;
        let bookingData: BookingResponse | null = null;
        let paymentStatus = 'FAILED';
        let tourId = 0;

        // Get query string
        const queryString = searchParams.toString();

        // Call appropriate payment return API
        if (isVnpayReturn) {
          if (!queryString || !queryString.includes('vnp_')) {
            setError('Thiếu thông tin từ VNPay. Vui lòng thử lại từ trang thanh toán.');
            return;
          }
          try {
            console.log('[PaymentReturn] VNPay return, processing...');
            const { redirectUrl, paymentResponse: vnpayResult } = await getVnpayReturn(queryString);
            paymentResponse = vnpayResult;
            paymentStatus = vnpayResult.status?.toUpperCase() || 'FAILED';
            console.log('[PaymentReturn] VNPay payment response:', vnpayResult);

            if (redirectUrl) {
              window.location.href = redirectUrl;
              return;
            }
          } catch (err) {
            console.error('[PaymentReturn] VNPay return error:', err);
            const errorMsg = axios.isAxiosError(err)
              ? err.response?.data?.message || 'Thanh toán VNPay thất bại'
              : 'Lỗi kết nối với VNPay';
            setError(errorMsg);
            return;
          }
        } else if (isMomoReturn) {
          try {
            console.log('[PaymentReturn] MoMo return, processing...');
            const response = await getMomoReturn(queryString);
            paymentResponse = response;
            paymentStatus = response.status?.toUpperCase() || 'FAILED';
            console.log('[PaymentReturn] MoMo payment response:', response);
          } catch (err) {
            console.error('[PaymentReturn] MoMo return error:', err);
            const errorMsg = axios.isAxiosError(err)
              ? err.response?.data?.message || 'Thanh toán MoMo thất bại'
              : 'Lỗi kết nối với MoMo';
            setError(errorMsg);
            return;
          }
        } else {
          setError('Invalid payment return URL - Không xác định được phương thức thanh toán');
          return;
        }

        if (!paymentResponse) {
          setError('Không nhận được kết quả từ cổng thanh toán');
          return;
        }

        const lastBooking = readLastBooking();
        let effectiveBookingCode = (paymentResponse.bookingCode || '').trim();

        // Fallback session (MoMo/VNPay): backend đôi khi không trả bookingCode; tourId cần cho URL /tours/:id/...
        if (!effectiveBookingCode && lastBooking?.bookingCode) {
          effectiveBookingCode = lastBooking.bookingCode;
        }
        if (lastBooking?.tourId) {
          tourId = lastBooking.tourId;
        }

        if (effectiveBookingCode) {
          paymentResponse = { ...paymentResponse, bookingCode: effectiveBookingCode };
        }

        if (paymentResponse.bookingCode) {
          try {
            bookingData = await getBookingByCode(paymentResponse.bookingCode);
            paymentStatus = bookingData.paymentStatus?.toUpperCase() || paymentStatus;
            if (bookingData.tourId) {
              tourId = bookingData.tourId;
            }
            console.log('[PaymentReturn] Booking data fetched:', bookingData);
          } catch (err) {
            console.warn('[PaymentReturn] Could not fetch booking details:', err);
          }
        }

        if (!tourId && lastBooking?.tourId) {
          tourId = lastBooking.tourId;
        }

        console.log('[PaymentReturn] Final payment status:', paymentStatus, 'tourId:', tourId);

        const hasCode = Boolean(paymentResponse.bookingCode);

        if (isPaymentSuccess(paymentStatus) && hasCode && tourId > 0) {
          console.log('[PaymentReturn] Payment succeeded ✓, navigating to e-ticket');
          navigate(
            `/tours/${tourId}/booking/e-ticket?bookingCode=${encodeURIComponent(
              paymentResponse.bookingCode,
            )}`,
            { replace: true },
          );
        } else if (isPaymentSuccess(paymentStatus) && hasCode && tourId === 0) {
          setError(
            'Thanh toán thành công nhưng thiếu thông tin tour. Vui lòng vào Hồ sơ → Đơn của tôi để xem e-ticket.',
          );
        } else {
          // Payment failed or pending → navigate to failure page
          console.log('[PaymentReturn] Payment status:', paymentStatus, '- navigating to failure page');
          navigate('/payment-failure', {
            state: {
              bookingCode: paymentResponse.bookingCode,
              tourId: tourId,
              amount: paymentResponse.amount,
              paymentMethod: paymentResponse.paymentMethod,
              errorCode: paymentResponse.status,
              errorMessage:
                'Thanh toán không thành công. Vui lòng thử lại hoặc chọn phương thức khác.',
            },
            replace: true,
          });
        }
      } catch (err) {
        console.error('[PaymentReturn] Unexpected error:', err);
        const errorMsg = err instanceof Error ? err.message : 'Đã xảy ra lỗi không mong muốn';
        setError(errorMsg);
      } finally {
        setIsProcessing(false);
      }
    };

    processPaymentReturn();
  }, [searchParams, navigate]);

  // If there's an error, show it and redirect to failure page
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        navigate('/payment-failure', {
          state: {
            errorMessage: error,
          },
          replace: true,
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, navigate]);

  return (
    <div className="payment-return">
      <div className="payment-return__container">
        {isProcessing && !error ? (
          <>
            <div className="payment-return__spinner">
              <Loader size={48} />
            </div>
            <h2 className="payment-return__title">Đang xử lý kết quả thanh toán...</h2>
            <p className="payment-return__message">
              Vui lòng chờ trong giây lát, chúng tôi đang kiểm tra trạng thái giao dịch của bạn.
            </p>
          </>
        ) : error ? (
          <>
            <div className="payment-return__error-icon">⚠️</div>
            <h2 className="payment-return__title">Có lỗi xảy ra</h2>
            <p className="payment-return__message">{error}</p>
            <p className="payment-return__submessage">Sẽ chuyển hướng sang trang thanh toán thất bại...</p>
          </>
        ) : null}
      </div>
    </div>
  );
}
