import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Breadcrumbs from '../../Breadcrumbs';
import BookingSteps from '../BookingSteps';
import ConfirmTourCard from './ConfirmTourCard';
import ConfirmGuestInfo from './ConfirmGuestInfo';
import ConfirmNotes from './ConfirmNotes';
import ConfirmCancelPolicy from './ConfirmCancelPolicy';
import ConfirmSidebar from './ConfirmSidebar';
import { getTourById, getProvinceById } from '../../../services/api';
import type { Tour, Province } from '../../../types';
import type { ContactInfo } from '../ContactForm';
import type { BookingDetailsData } from '../BookingDetails';
import '../../../styles/components/tourBookingscss/step2/_booking-confirm.scss';

interface BookingConfirmState {
  contactInfo: ContactInfo;
  bookingDetails: BookingDetailsData;
}

export default function BookingConfirm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [tour, setTour] = useState<Tour | null>(null);
  const [province, setProvince] = useState<Province | null>(null);
  const [loading, setLoading] = useState(true);

  // Receive state from Step 1 via navigation state
  const state = location.state as BookingConfirmState | undefined;

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
      } catch (err) {
        console.error('Failed to load tour for confirmation:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Redirect back to step 1 if no state was passed
  useEffect(() => {
    if (!loading && !state) {
      navigate(`/tours/${id}/booking`, { replace: true });
    }
  }, [loading, state, id, navigate]);

  const handleConfirm = () => {
    if (!tour) return;
    navigate(`/tours/${tour.id}/booking/payment`, {
      state: { contactInfo, bookingDetails },
    });
  };

  const handleBack = () => {
    navigate(`/tours/${id}/booking`, {
      state: { contactInfo, bookingDetails },
    });
  };

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div className="booking-confirm-loading">
        <div className="booking-confirm-loading__spinner" />
        <p>Đang tải xác nhận đặt tour...</p>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="booking-confirm-loading">
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
    { label: 'Xác nhận thông tin' },
  ];

  return (
    <div className="booking-confirm">
      {/* Top bar */}
      <div className="booking-confirm__top-bar">
        <button type="button" className="booking-confirm__back-btn" onClick={handleBack}>
          <ArrowLeft size={20} />
        </button>
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      {/* Steps */}
      <BookingSteps currentStep={2} />

      {/* Content */}
      <div className="booking-confirm__content">
        {/* Left column */}
        <div className="booking-confirm__main">
          <h2 className="booking-confirm__heading">Xác nhận thông tin</h2>

          <ConfirmTourCard tour={tour} />

          <ConfirmGuestInfo
            contactInfo={contactInfo}
            bookingDetails={bookingDetails}
            onEditClick={handleBack}
          />

          <ConfirmNotes
            notes={bookingDetails.notes}
            specialRequirements={bookingDetails.specialRequirements}
          />

          <ConfirmCancelPolicy />
        </div>

        {/* Right column */}
        <div className="booking-confirm__sidebar">
          <ConfirmSidebar
            tour={tour}
            province={province}
            bookingDetails={bookingDetails}
            onConfirm={handleConfirm}
            onBack={handleBack}
          />
        </div>
      </div>
    </div>
  );
}
