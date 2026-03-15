import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Province, Tour } from '../../types';
import { getPublicTours } from '../../services/api';
import '../../styles/components/whereToNextSection.scss';

interface WhereToNextSectionProps {
  provinces?: Province[];
}

const normalizeSlug = (name: string): string =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '')
    .trim();

const PROVINCE_IMAGE_MAP: Record<string, string> = {
  kontum: 'kontum',
  gialai: 'gialai',
  daklak: 'daklac',
  daklac: 'daklac',
  daknong: 'dacnong',
  dacnong: 'dacnong',
  lamdong: 'lamdong',
};

function getProvinceImageUrl(province: Province): string {
  const slugPlain = normalizeSlug(province.slug || province.name || '');
  const slugHyphen = (province.slug || province.name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
  if (slugPlain && PROVINCE_IMAGE_MAP[slugPlain]) {
    return `/next/${PROVINCE_IMAGE_MAP[slugPlain]}.jpg`;
  }
  if (slugHyphen) return `/next/${slugHyphen}.jpg`;
  return province.thumbnailUrl || '';
}

function getProvinceImageFallback(province: Province): string {
  return province.thumbnailUrl || '/vite.svg';
}

export default function WhereToNextSection({ provinces = [] }: WhereToNextSectionProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tours, setTours] = useState<Tour[]>([]);

  const displayProvinces = provinces.length > 0 ? provinces : [];

  useEffect(() => {
    let mounted = true;
    getPublicTours()
      .then((data) => {
        if (mounted && data) setTours(data);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const tourCountByProvince = useMemo(() => {
    const map = new Map<number, number>();
    tours.forEach((t) => {
      if (t.provinceId) map.set(t.provinceId, (map.get(t.provinceId) ?? 0) + 1);
    });
    return map;
  }, [tours]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 320;
    const scrollAmount = direction === 'right' ? cardWidth : -cardWidth;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleCardClick = (provinceId: number) => {
    navigate(`/tours?province=${provinceId}`);
  };

  if (displayProvinces.length === 0) return null;

  return (
    <section className="where-to-next" id="where-to-next">
      <div className="where-to-next__header">
        <h2 className="where-to-next__title">Đi đâu tiếp theo?</h2>
        <Link to="/tours" className="where-to-next__see-more">
          Xem thêm
        </Link>
      </div>

      <div className="where-to-next__carousel">
        <button
          type="button"
          className="where-to-next__arrow where-to-next__arrow--prev"
          onClick={() => scroll('left')}
          aria-label="Trước"
        >
          <ChevronLeft size={24} />
        </button>

        <div ref={scrollRef} className="where-to-next__cards">
          {displayProvinces.map((province) => {
            const count = tourCountByProvince.get(province.id) ?? 0;
            const imgUrl = getProvinceImageUrl(province);
            const fallback = getProvinceImageFallback(province);

            return (
              <div
                key={province.id}
                className="where-to-next__card"
                onClick={() => handleCardClick(province.id)}
                onKeyDown={(e) => e.key === 'Enter' && handleCardClick(province.id)}
                role="button"
                tabIndex={0}
              >
                <div
                  className="where-to-next__card-image"
                  style={{ backgroundImage: `url(${imgUrl || fallback})` }}
                />
                <div className="where-to-next__card-overlay" />
                <div className="where-to-next__card-content">
                  <h3 className="where-to-next__card-name">{province.name}</h3>
                  <span className="where-to-next__card-count">
                    {count} tour
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="where-to-next__arrow where-to-next__arrow--next"
          onClick={() => scroll('right')}
          aria-label="Tiếp"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="where-to-next__footer" />
    </section>
  );
}
