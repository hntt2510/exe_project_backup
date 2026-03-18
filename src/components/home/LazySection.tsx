import { useEffect, useRef, useState } from 'react';

interface LazySectionProps {
  children: React.ReactNode;
  /** rootMargin cho IntersectionObserver - load trước khi vào viewport */
  rootMargin?: string;
  /** minHeight placeholder khi chưa load */
  minHeight?: number;
}

/**
 * Chỉ render children khi section sắp vào viewport - giảm work ban đầu, mượt hơn khi scroll
 */
export default function LazySection({ children, rootMargin = '150px', minHeight = 200 }: LazySectionProps) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { rootMargin, threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} style={{ minHeight: inView ? undefined : minHeight }}>
      {inView && children}
    </div>
  );
}
