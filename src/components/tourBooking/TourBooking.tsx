import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Breadcrumbs from '../Breadcrumbs';
import BookingSteps from './BookingSteps';
import TourInfo from './TourInfo';
import ContactForm, { type ContactInfo } from './ContactForm';
import BookingDetails, { type BookingDetailsData } from './BookingDetails';
import BookingSidebar from './BookingSidebar';
import BookingActions from './BookingActions';
import { getTourById, getProvinceById } from '../../services/api';
import type { Tour, Province } from '../../types';
import '../../styles/components/tourBookingscss/_tour-booking.scss';

interface BookingLocationState {
  contactInfo?: ContactInfo;
  bookingDetails?: BookingDetailsData;
}

export default function TourBooking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [tour, setTour] = useState<Tour | null>(null);
  const [province, setProvince] = useState<Province | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore state when coming back from Step 2
  const incoming = location.state as BookingLocationState | undefined;

  const [contactInfo, setContactInfo] = useState<ContactInfo>(
    incoming?.contactInfo ?? {
      fullName: '',
      email: '',
      phone: '',
    },
  );

  const [bookingDetails, setBookingDetails] = useState<BookingDetailsData>(() => {
    if (incoming?.bookingDetails) {
      return {
        ...incoming.bookingDetails,
      };
    }
    return {
      departureDate: null,
      participants: 2,
      specialRequirements: '',
      tourType: 'individual',
      notes: '',
      agreedToTerms: false,
      tourScheduleId: null,
      selectedStartTime: null,
      schedulePrice: null,
    };
  });

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
        console.error('Failed to load tour for booking:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const canSubmit =
    contactInfo.fullName.trim() !== '' &&
    contactInfo.email.trim() !== '' &&
    contactInfo.phone.trim() !== '' &&
    bookingDetails.departureDate !== null &&
    bookingDetails.tourScheduleId !== null &&
    bookingDetails.agreedToTerms;

  const handleSubmit = () => {
    if (!canSubmit || !tour) return;
    navigate(`/tours/${tour.id}/booking/confirm`, {
      state: { contactInfo, bookingDetails },
    });
  };

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div className="tour-booking-loading">
        <div className="tour-booking-loading__spinner" />
        <p>Đang tải thông tin đặt tour...</p>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="tour-booking-loading">
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
    { label: 'Đặt chỗ' },
  ];

  return (
    <div className="tour-booking">
      {/* Back button + breadcrumbs */}
      <div className="tour-booking__top-bar">
        <button
          type="button"
          className="tour-booking__back-btn"
          onClick={() => navigate(`/tours/${tour.id}`)}
        >
          <ArrowLeft size={20} />
        </button>
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      {/* Steps */}
      <BookingSteps currentStep={1} />

      {/* Main content */}
      <div className="tour-booking__content">
        {/* Left column - Form */}
        <div className="tour-booking__form">
          <TourInfo tour={tour} />
          <ContactForm value={contactInfo} onChange={setContactInfo} />
          <BookingDetails value={bookingDetails} onChange={setBookingDetails} tourId={tour.id} tourPrice={tour.price} />
          <BookingActions tourId={tour.id} canSubmit={canSubmit} onSubmit={handleSubmit} />
        </div>

        {/* Right column - Sidebar */}
        <div className="tour-booking__sidebar">
          <BookingSidebar tour={tour} province={province} bookingDetails={bookingDetails} />
        </div>
      </div>
    </div>
  );
}
