import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Calendar, Clock, MapPin } from 'lucide-react';
import type { Tour, Province } from '../../types';
import type { BookingDetailsData } from './BookingDetails';
import { formatPrice } from '../tour/TourDetail/utils';
import '../../styles/components/tourBookingscss/_booking-sidebar.scss';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// SVG marker icon matching home page style
const locationIcon = L.divIcon({
  className: 'booking-sidebar__marker-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
  html: `
    <svg viewBox="0 0 512 512" width="28" height="28" aria-hidden="true">
      <path
        d="M256 48c-79.5 0-144 64.5-144 144 0 108.2 144 272 144 272s144-163.8 144-272c0-79.5-64.5-144-144-144zm0 208a64 64 0 1 1 0-128 64 64 0 0 1 0 128z"
        fill="none" stroke="#b91c1c" stroke-width="28"
        stroke-linecap="round" stroke-linejoin="round"
      />
    </svg>
  `,
});

interface BookingSidebarProps {
  tour: Tour;
  province: Province | null;
  bookingDetails: BookingDetailsData;
}

function formatDuration(hours: number): string {
  const days = Math.ceil(hours / 24);
  const nights = days - 1;
  if (days <= 1) return `${hours} giờ`;
  return `${days} ngày ${nights} đêm`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export default function BookingSidebar({ tour, province, bookingDetails }: BookingSidebarProps) {
  const unitPrice = bookingDetails.schedulePrice ?? tour.price;
  const totalPrice = bookingDetails.participants * unitPrice;
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Province coordinates (fallback to central Vietnam)
  const lat = province?.latitude ?? 14.5;
  const lng = province?.longitude ?? 108.0;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy previous instance if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 9,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    L.marker([lat, lng], { icon: locationIcon }).addTo(map)
      .bindPopup(province?.name || tour.provinceName || 'Việt Nam');

    mapInstanceRef.current = map;

    // Fix tile rendering after container becomes visible
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [lat, lng, province?.name, tour.provinceName]);

  return (
    <div className="booking-sidebar">
      {/* Tour thumbnail */}
      <div className="booking-sidebar__image">
        <img src={tour.thumbnailUrl || '/nen.png'} alt={tour.title} />
      </div>

      {/* Tour summary */}
      <div className="booking-sidebar__content">
        <h3 className="booking-sidebar__title">{tour.title}</h3>

        <div className="booking-sidebar__meta">
          <div className="booking-sidebar__meta-item">
            <Calendar size={14} />
            <span>Lịch khởi hành</span>
            <strong>
              {bookingDetails.selectedStartTime
                ? `${bookingDetails.selectedStartTime} - ${formatDate(bookingDetails.departureDate)}`
                : formatDate(bookingDetails.departureDate)}
            </strong>
          </div>
          <div className="booking-sidebar__meta-item">
            <Clock size={14} />
            <span>Thời lượng</span>
            <strong>{formatDuration(tour.durationHours)}</strong>
          </div>
          <div className="booking-sidebar__meta-item">
            <MapPin size={14} />
            <span>Điểm đến</span>
            <strong>{tour.provinceName || 'Việt Nam'}</strong>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="booking-sidebar__pricing">
          <h4 className="booking-sidebar__pricing-title">Giá tham chiếu</h4>

          {/* Show discount comparison when schedule has discount */}
          {bookingDetails.scheduleBasePrice != null && bookingDetails.schedulePrice != null && bookingDetails.schedulePrice < bookingDetails.scheduleBasePrice ? (
            <div className="booking-sidebar__price-discount">
              <span className="booking-sidebar__price-original">
                {formatPrice(bookingDetails.scheduleBasePrice)} VND
              </span>
              <span className="booking-sidebar__price-sale">
                {formatPrice(bookingDetails.schedulePrice)} VND
              </span>
            </div>
          ) : null}

          <div className="booking-sidebar__price-row">
            <span>{formatPrice(unitPrice)} × {bookingDetails.participants} người</span>
            <strong>{formatPrice(totalPrice)} VND</strong>
          </div>
          <div className="booking-sidebar__price-total">
            <span>Tổng tạm tính</span>
            <strong>{formatPrice(totalPrice)} VND</strong>
          </div>
          <p className="booking-sidebar__price-note">
            {bookingDetails.schedulePrice
              ? 'Giá theo khung giờ đã chọn'
              : 'Giá có thể thay đổi theo khung giờ khởi hành'}
          </p>
          <a href="#" className="booking-sidebar__refund-link">
            Xem chính sách hoàn huỷ
          </a>
        </div>

        {/* Real Leaflet map */}
        <div className="booking-sidebar__map">
          <div ref={mapContainerRef} className="booking-sidebar__map-leaflet" />
        </div>
      </div>
    </div>
  );
}
