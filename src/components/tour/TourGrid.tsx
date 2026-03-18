import { motion } from 'framer-motion';
import type { Tour } from '../../types';
import TourCard from './TourCard';
import '../../styles/components/tourGrid.scss';

type TourGridProps = {
  tours: Tour[];
  loading: boolean;
  error: string | null;
};

const cardVariants = {
  initial: { opacity: 0, y: 24 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.05 * i },
  }),
};

export default function TourGrid({ tours, loading, error }: TourGridProps) {
  if (loading) {
    return (
      <motion.div
        className="tour-grid tour-grid--state"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="tour-grid__message">Đang tải danh sách tour...</div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="tour-grid tour-grid--state"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="tour-grid__message tour-grid__message--error">{error}</div>
      </motion.div>
    );
  }

  if (tours.length === 0) {
    return (
      <motion.div
        className="tour-grid tour-grid--state"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="tour-grid__message">Chưa có tour phù hợp.</div>
      </motion.div>
    );
  }

  return (
    <div className="tour-grid">
      {tours.map((tour, i) => (
        <motion.div
          key={tour.id}
          variants={cardVariants}
          initial="initial"
          animate="animate"
          custom={i}
        >
          <TourCard tour={tour} />
        </motion.div>
      ))}
    </div>
  );
}
