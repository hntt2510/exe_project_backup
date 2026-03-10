import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Breadcrumbs from '../../Breadcrumbs';
import BookingSteps from '../BookingSteps';
import ETicketCard from './ETicketCard';
import ETicketActions from './ETicketActions';
import { getTourById, getProvinceById } from '../../../services/api';
import { getBookingById, getBookingByCode, type BookingResponse } from '../../../services/paymentApi';
import type { Tour, Province } from '../../../types';
import type { ContactInfo } from '../ContactForm';
import type { BookingDetailsData } from '../BookingDetails';
import '../../../styles/components/tourBookingscss/e-ticketscss/_e-ticket-page.scss';

interface ETicketLocationState {
  bookingId: number;
  bookingCode?: string;
  contactInfo: ContactInfo;
  bookingDetails: BookingDetailsData;
}

export default function ETicketPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const state = location.state as ETicketLocationState | undefined;
  const bookingCodeFromQuery = searchParams.get('bookingCode');

  const [tour, setTour] = useState<Tour | null>(null);
  const [province, setProvince] = useState<Province | null>(null);
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Fallback contact info from navigation state
  const contactInfo: ContactInfo = state?.contactInfo ?? {
    fullName: '',
    email: '',
    phone: '',
  };

  const bookingDetails: BookingDetailsData = state?.bookingDetails
    ? {
        ...state.bookingDetails,
      }
    : {
        departureDate: null,
        participants: 2,
        specialRequirements: '',
        tourType: 'individual',
        notes: '',
        agreedToTerms: false,
        tourScheduleId: null,
        selectedStartTime: null,
        schedulePrice: null,
        scheduleBasePrice: null,
      };

  useEffect(() => {
    if (!id) return;
    const tourId = Number(id);
    setLoading(true);

    const fetchData = async () => {
      try {
        const tourData = await getTourById(tourId);
        setTour(tourData);

        if (tourData.provinceId) {
          const provinceData = await getProvinceById(tourData.provinceId);
          setProvince(provinceData);
        }

        // Priority 1: Fetch booking from URL query param (bookingCode)
        if (bookingCodeFromQuery) {
          try {
            console.log('[ETicket] Fetching booking by code:', bookingCodeFromQuery);
            const bookingData = await getBookingByCode(bookingCodeFromQuery);
            setBooking(bookingData);
            console.log('[ETicket] Booking data fetched from code:', bookingData);
            return; // Don't try state-based fetch if query param worked
          } catch (err) {
            console.warn('[ETicket] Could not fetch booking by code:', err);
            // Continue to state-based fetch as fallback
          }
        }

        // Priority 2: Fetch booking from navigation state (bookingId)
        if (state?.bookingId) {
          try {
            console.log('[ETicket] Fetching booking by ID:', state.bookingId);
            const bookingData = await getBookingById(state.bookingId);
            setBooking(bookingData);
            console.log('[ETicket] Booking data fetched from ID:', bookingData);
          } catch (err) {
            console.warn('[ETicket] Could not fetch booking by ID, using navigation state.', err);
          }
        }
      } catch (err) {
        console.error('[ETicket] Failed to load e-ticket data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, state?.bookingId, bookingCodeFromQuery]);

  // Redirect if no state and no query param
  useEffect(() => {
    if (!loading && !state && !bookingCodeFromQuery) {
      navigate(`/tours/${id}/booking`, { replace: true });
    }
  }, [loading, state, bookingCodeFromQuery, id, navigate]);

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div className="e-ticket-page-loading">
        <div className="e-ticket-page-loading__spinner" />
        <p>Đang tải e-ticket...</p>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="e-ticket-page-loading">
        <p>Không tìm thấy tour này.</p>
        <Link to="/tours" className="btn btn-primary">
          Quay lại danh sách tour
        </Link>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Tour', path: '/tours' },
    ...(province ? [{ label: province.name, path: `/tours?province=${province.id}` }] : []),
    { label: 'E-Ticket' },
  ];

  return (
    <div className="e-ticket-page">
      {/* Top bar */}
      <div className="e-ticket-page__top-bar">
        <button
          type="button"
          className="e-ticket-page__back-btn"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={20} />
        </button>
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      {/* Steps – step 4 active */}
      <BookingSteps currentStep={4} />

      {/* Success header */}
      <div className="e-ticket-page__success">
        <div className="e-ticket-page__success-icon">✓</div>
        <h2 className="e-ticket-page__success-title">Đặt tour thành công!</h2>
        <p className="e-ticket-page__success-desc">
          Cảm ơn bạn đã đặt tour. Dưới đây là vé điện tử của bạn.
        </p>
      </div>

      {/* E-ticket card */}
      <ETicketCard
        tour={tour}
        province={province}
        booking={booking}
        contactInfo={contactInfo}
        bookingDetails={bookingDetails}
        bookingCode={state?.bookingCode}
      />

      {/* Actions */}
      <ETicketActions tourId={tour.id} />
    </div>
  );
}
