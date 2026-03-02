import { Download, Home, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../../../styles/components/tourBookingscss/e-ticketscss/_e-ticket-actions.scss';

interface ETicketActionsProps {
  tourId: number;
}

export default function ETicketActions({ tourId }: ETicketActionsProps) {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="e-ticket-actions">
      <button
        type="button"
        className="e-ticket-actions__btn e-ticket-actions__btn--primary"
        onClick={handlePrint}
      >
        <Download size={18} />
        Tải / In vé
      </button>

      <button
        type="button"
        className="e-ticket-actions__btn e-ticket-actions__btn--outline"
        onClick={() => navigate(`/tours/${tourId}`)}
      >
        <List size={18} />
        Xem chi tiết tour
      </button>

      <button
        type="button"
        className="e-ticket-actions__btn e-ticket-actions__btn--secondary"
        onClick={() => navigate('/')}
      >
        <Home size={18} />
        Về trang chủ
      </button>
    </div>
  );
}
