import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Province, Tour } from '../types';
import { getProvinces, getPublicTours } from '../services/api';
import TourHero from '../components/tour/TourHero';
import TourFilterBar from '../components/tour/TourFilterBar';
import TourGrid from '../components/tour/TourGrid';
import TourPagination from '../components/tour/TourPagination';
import '../styles/pages/_tours.scss';

type SortOption = 'latest' | 'price-asc' | 'price-desc' | 'rating-desc';

const PAGE_SIZE = 6;

export default function Tours() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedProvinceId, setSelectedProvinceId] = useState(() => {
    const p = searchParams.get('province');
    return p ? p : 'all';
  });
  const [selectedArtisanId, setSelectedArtisanId] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([getPublicTours(), getProvinces()])
      .then(([tourData, provinceData]) => {
        if (!mounted) return;
        setTours(tourData);
        setProvinces(provinceData);
        setError(null);
      })
      .catch((err: any) => {
        if (!mounted) return;
        setError(err?.message || 'Không thể tải danh sách tour');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const artisanOptions = useMemo(() => {
    const map = new Map<number, string>();
    tours.forEach((tour) => {
      if (tour.artisanId && tour.artisanName) {
        map.set(tour.artisanId, tour.artisanName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [tours]);

  const filteredTours = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const provinceId = selectedProvinceId === 'all' ? null : Number(selectedProvinceId);
    const artisanId = selectedArtisanId === 'all' ? null : Number(selectedArtisanId);
    return tours.filter((tour) => {
      const matchesKeyword = keyword
        ? [tour.title, tour.provinceName, tour.artisanName]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(keyword)
        : true;

      const matchesProvince = provinceId ? tour.provinceId === provinceId : true;
      const matchesArtisan = artisanId ? tour.artisanId === artisanId : true;
      return matchesKeyword && matchesProvince && matchesArtisan;
    });
  }, [tours, search, selectedProvinceId, selectedArtisanId]);

  const sortedTours = useMemo(() => {
    const list = [...filteredTours];
    switch (sortBy) {
      case 'price-asc':
        return list.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price-desc':
        return list.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'rating-desc':
        return list.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      case 'latest':
      default:
        return list.sort((a, b) => {
          const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
          const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
          return bTime - aTime;
        });
    }
  }, [filteredTours, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedTours.length / PAGE_SIZE));
  const pageTours = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedTours.slice(start, start + PAGE_SIZE);
  }, [sortedTours, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedProvinceId, selectedArtisanId, sortBy]);

  return (
    <div className="tour-page">
      <TourHero />

      <section id="tour-content" className="tour-page__content">
        <div className="tour-page__container">
          <TourFilterBar
            search={search}
            onSearchChange={setSearch}
            provinces={provinces}
            selectedProvinceId={selectedProvinceId}
            onProvinceChange={setSelectedProvinceId}
            artisans={artisanOptions}
            selectedArtisanId={selectedArtisanId}
            onArtisanChange={setSelectedArtisanId}
            sortBy={sortBy}
            onSortChange={(value) => setSortBy(value as SortOption)}
            onReset={() => {
              setSearch('');
              setSelectedProvinceId('all');
              setSelectedArtisanId('all');
              setSortBy('latest');
            }}
            total={sortedTours.length}
          />

          <h2 className="tour-page__headline">TOUR NỔI BẬT</h2>

          <div className="tour-page__results">
            <TourGrid tours={pageTours} loading={loading} error={error} />

            <TourPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
