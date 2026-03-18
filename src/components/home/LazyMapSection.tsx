import { useEffect, useRef, useState } from 'react';
import MapSection from './MapSection';
import type { Province } from '../../types';

interface LazyMapSectionProps {
  provinces?: Province[];
}

/**
 * Chỉ mount MapSection khi user scroll gần đến - giảm lag khi load trang
 * (tránh tải map tiles + GeoJSON ngay từ đầu)
 */
export default function LazyMapSection({ provinces }: LazyMapSectionProps) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { rootMargin: '200px', threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: inView ? undefined : 400 }}>
      {inView && <MapSection provinces={provinces} />}
    </div>
  );
}
