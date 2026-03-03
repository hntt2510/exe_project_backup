import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Tour, Province } from '../../../types';
import type { BookingDetailsData } from '../BookingDetails';
import { formatPrice } from '../../tour/TourDetail/utils';
import '../../../styles/components/tourBookingscss/step2/_confirm-sidebar.scss';

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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

interface ConfirmSidebarProps {
  tour: Tour;
  province: Province | null;
  bookingDetails: BookingDetailsData;
  onConfirm: () => void;
  onBack: () => void;
}

export default function ConfirmSidebar({
  tour,
  province,
  bookingDetails,
  onConfirm,
  onBack,
}: ConfirmSidebarProps) {
  const unitPrice = bookingDetails.schedulePrice ?? tour.price;
  const totalPrice = bookingDetails.participants * unitPrice;
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const lat = province?.latitude ?? 14.5;
  const lng = province?.longitude ?? 108.0;

  useEffect(() => {
    if (!mapContainerRef.current) return;
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
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [lat, lng, province?.name, tour.provinceName]);

  const [infoChecked, setInfoChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const canConfirm = infoChecked && termsChecked;

  return (
    <div className="confirm-sidebar">
      {/* Price summary */}
      <div className="confirm-sidebar__section">
        <h3 className="confirm-sidebar__heading">Tóm tắt &amp; Thành tiền</h3>

        <div className="confirm-sidebar__price-rows">
          {/* Show discount comparison when schedule has discount */}
          {bookingDetails.scheduleBasePrice != null && bookingDetails.schedulePrice != null && bookingDetails.schedulePrice < bookingDetails.scheduleBasePrice ? (
            <div className="confirm-sidebar__price-discount">
              <span className="confirm-sidebar__price-original">
                {formatPrice(bookingDetails.scheduleBasePrice)} VND
              </span>
              <span className="confirm-sidebar__price-sale">
                {formatPrice(bookingDetails.schedulePrice)} VND
              </span>
            </div>
          ) : null}

          <div className="confirm-sidebar__price-row">
            <span>{formatPrice(unitPrice)} × {bookingDetails.participants} người</span>
            <strong>{formatPrice(totalPrice)} VND</strong>
          </div>
        </div>

        <div className="confirm-sidebar__total">
          <span>Tổng tiền</span>
          <strong>{formatPrice(totalPrice)} VND</strong>
        </div>

        <p className="confirm-sidebar__tax-note">
          Giá đã bao gồm thuế &amp; phí cơ bản
        </p>

        {/* Checkboxes */}
        <div className="confirm-sidebar__checks">
          <label className="confirm-sidebar__check-label">
            <input
              type="checkbox"
              checked={infoChecked}
              onChange={(e) => setInfoChecked(e.target.checked)}
            />
            <span>Tôi đã kiểm tra đúng thông tin.</span>
          </label>
          <label className="confirm-sidebar__check-label">
            <input
              type="checkbox"
              checked={termsChecked}
              onChange={(e) => setTermsChecked(e.target.checked)}
            />
            <span>
              Tôi đồng ý với{' '}
              <a href="#" className="confirm-sidebar__terms-link">
                điều khoản dịch vụ &amp; chính sách huỷ
              </a>
              .
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="confirm-sidebar__actions">
          <button
            type="button"
            className="confirm-sidebar__btn confirm-sidebar__btn--primary"
            disabled={!canConfirm}
            onClick={onConfirm}
          >
            Xác nhận và thanh toán
          </button>
          <button
            type="button"
            className="confirm-sidebar__btn confirm-sidebar__btn--outline"
            onClick={onBack}
          >
            Quay lại bước trước
          </button>
        </div>
      </div>

      {/* Leaflet map */}
      <div className="confirm-sidebar__map">
        <div ref={mapContainerRef} className="confirm-sidebar__map-leaflet" />
      </div>
    </div>
  );
}
