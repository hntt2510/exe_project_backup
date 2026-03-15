'use client';

import { useState, useEffect, useMemo } from 'react';
import { getProvinces, getPublicTours, submitLead, getApiErrorMessage } from '../../services/api';
import type { Province, Tour } from '../../types';
import { Send, MapPin } from 'lucide-react';

type ProvinceWithTours = {
  province: Province;
  tours: Tour[];
};

export default function LeadFormSection() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [provinceId, setProvinceId] = useState<number | ''>('');
  const [tourId, setTourId] = useState<number | ''>('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [provincesRes, toursRes] = await Promise.all([
          getProvinces(),
          getPublicTours(),
        ]);
        setProvinces(provincesRes ?? []);
        setTours(toursRes ?? []);
      } catch (err) {
        console.error('[LeadFormSection] Error loading data:', err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const provinceWithTours = useMemo((): ProvinceWithTours[] => {
    const map = new Map<number, { province: Province; tours: Tour[] }>();
    for (const p of provinces) {
      map.set(p.id, { province: p, tours: [] });
    }
    for (const t of tours) {
      const pid = t.provinceId ?? 0;
      const entry = map.get(pid);
      if (entry) {
        entry.tours.push(t);
      } else if (pid > 0) {
        const prov = provinces.find((p) => p.id === pid);
        if (prov) {
          map.set(pid, { province: prov, tours: [t] });
        }
      }
    }
    return Array.from(map.values())
      .filter((x) => x.tours.length > 0)
      .sort((a, b) => a.province.name.localeCompare(b.province.name));
  }, [provinces, tours]);

  const selectedProvinceTours = useMemo(() => {
    if (!provinceId) return [];
    const entry = provinceWithTours.find((x) => x.province.id === provinceId);
    return entry?.tours ?? [];
  }, [provinceId, provinceWithTours]);

  const handleProvinceChange = (val: string) => {
    const id = val === '' ? '' : Number(val);
    setProvinceId(id);
    setTourId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimName = name.trim();
    const trimEmail = email.trim();
    const trimPhone = phone.trim();
    if (!trimName) {
      setError('Vui lòng nhập họ tên.');
      return;
    }
    if (!trimEmail) {
      setError('Vui lòng nhập email.');
      return;
    }
    if (!trimPhone) {
      setError('Vui lòng nhập số điện thoại.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimEmail)) {
      setError('Email không hợp lệ.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: trimName,
        email: trimEmail,
        phone: trimPhone,
        message: message.trim() || undefined,
        source: 'WEBSITE' as const,
      };
      if (tourId && typeof tourId === 'number' && tourId > 0) {
        (payload as { tourId?: number }).tourId = tourId;
      }
      await submitLead(payload);
      setSuccess(true);
      setName('');
      setEmail('');
      setPhone('');
      setProvinceId('');
      setTourId('');
      setMessage('');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <section className="section-container lead-form">
        <div className="lead-form__container">
          <h2 className="section-title">ĐĂNG KÝ NHẬN TƯ VẤN</h2>
          <p className="section-subtitle">
            Để lại thông tin để đội ngũ Cội Việt tư vấn tour phù hợp cho bạn
          </p>
          <div className="lead-form__success">
            <p>Cảm ơn bạn đã gửi thông tin! Chúng tôi sẽ liên hệ tư vấn sớm nhất.</p>
            <button
              type="button"
              className="lead-form__btn lead-form__btn--secondary"
              onClick={() => setSuccess(false)}
            >
              Gửi thêm yêu cầu khác
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-container lead-form">
      <div className="lead-form__container">
        <h2 className="section-title">ĐĂNG KÝ NHẬN TƯ VẤN</h2>
        <p className="section-subtitle">
          Để lại thông tin để đội ngũ Cội Việt tư vấn tour phù hợp cho bạn
        </p>

        <form className="lead-form__form" onSubmit={handleSubmit}>
          <div className="lead-form__grid">
            <div className="lead-form__field">
              <label htmlFor="lead-name" className="lead-form__label">
                Họ và tên <span className="lead-form__required">*</span>
              </label>
              <input
                id="lead-name"
                type="text"
                className="lead-form__input"
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="lead-form__field">
              <label htmlFor="lead-email" className="lead-form__label">
                Email <span className="lead-form__required">*</span>
              </label>
              <input
                id="lead-email"
                type="email"
                className="lead-form__input"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="lead-form__field">
              <label htmlFor="lead-phone" className="lead-form__label">
                Số điện thoại <span className="lead-form__required">*</span>
              </label>
              <input
                id="lead-phone"
                type="tel"
                className="lead-form__input"
                placeholder="0900 123 456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="lead-form__tour-section">
            <div className="lead-form__tour-header">
              <MapPin size={18} className="lead-form__icon" />
              <span>Bạn quan tâm tour nào? (tùy chọn — để trống nếu muốn được tư vấn chung)</span>
            </div>
            <div className="lead-form__grid lead-form__grid--2">
              <div className="lead-form__field">
                <label htmlFor="lead-province" className="lead-form__label">
                  Tỉnh / Thành phố
                </label>
                <select
                  id="lead-province"
                  className="lead-form__select"
                  value={provinceId === '' ? '' : String(provinceId)}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  disabled={loadingData}
                >
                  <option value="">-- Chọn tỉnh --</option>
                  {provinceWithTours.map(({ province }) => (
                    <option key={province.id} value={province.id}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="lead-form__field">
                <label htmlFor="lead-tour" className="lead-form__label">
                  Tour
                </label>
                <select
                  id="lead-tour"
                  className="lead-form__select"
                  value={tourId === '' ? '' : String(tourId)}
                  onChange={(e) => setTourId(e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={!provinceId || selectedProvinceTours.length === 0}
                >
                  <option value="">-- Chọn tour (tùy chọn) --</option>
                  {selectedProvinceTours.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} {t.price > 0 ? `— ${t.price.toLocaleString('vi-VN')}₫` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="lead-form__field">
            <label htmlFor="lead-message" className="lead-form__label">
              Tin nhắn (tùy chọn)
            </label>
            <textarea
              id="lead-message"
              className="lead-form__textarea"
              rows={3}
              placeholder="Ghi chú, câu hỏi hoặc yêu cầu đặc biệt..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {error && <p className="lead-form__error">{error}</p>}

          <button
            type="submit"
            className="lead-form__btn lead-form__btn--primary"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="lead-form__spinner" />
                Đang gửi...
              </>
            ) : (
              <>
                <Send size={18} />
                Gửi yêu cầu tư vấn
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
