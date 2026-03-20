import { ArrowRight } from 'lucide-react';
import type { UserProfile } from '../../services/profileApi';
import type { LearnStats } from '../../services/profileApi';
import type { UserBooking } from '../../services/profileApi';
import type { UserVoucher } from '../../services/profileApi';
import '../../styles/components/profile/_profile-overview.scss';

interface ProfileOverviewProps {
  user: UserProfile;
  stats: LearnStats | null;
  bookings: UserBooking[];
  vouchers: UserVoucher[];
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN');
}

export default function ProfileOverview({
  user,
  stats,
  bookings,
  vouchers,
}: ProfileOverviewProps) {
  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED').length;
  const activeBookings = bookings.filter(
    (b) => b.status === 'PENDING' || b.status === 'CONFIRMED',
  ).length;

  const activeVouchers = vouchers.filter((v) => v.isActive).length;

  const infoRows = [
    { label: 'Họ và tên', value: user.fullName },
    { label: 'Ngày sinh', value: formatDate(user.dateOfBirth) },
    { label: 'Điện thoại', value: user.phone || '—' },
    { label: 'Email', value: user.email },
  ];

  return (
    <div className="profile-overview">
      {/* Personal Info */}
      <div className="profile-overview__card profile-overview__personal">
        <h3 className="profile-overview__card-title">Thông tin cá nhân</h3>
        <table className="profile-overview__table">
          <tbody>
            {infoRows.map((row) => (
              <tr key={row.label}>
                <td className="profile-overview__table-label">{row.label}</td>
                <td className="profile-overview__table-value">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Summary */}
      <div className="profile-overview__card profile-overview__summary">
        <h3 className="profile-overview__card-title profile-overview__card-title--accent">
          Tóm tắt nhanh
        </h3>

        <div className="profile-overview__stat-rows">
          <div className="profile-overview__stat-row">
            <span>Tổng tour đã đặt</span>
            <strong>{bookings.length}</strong>
          </div>
          <div className="profile-overview__stat-row">
            <span>Tour đang tới</span>
            <strong>{activeBookings}</strong>
          </div>
          <div className="profile-overview__stat-row">
            <span>Khoá học hoàn thành</span>
            <strong>{stats?.totalCoursesCompleted ?? 0}</strong>
          </div>

          {/* Progress bar */}
          <div className="profile-overview__stat-row profile-overview__stat-row--progress">
            <span>Tiến độ học</span>
            <div className="profile-overview__progress">
              <div
                className="profile-overview__progress-bar"
                style={{ width: `${stats?.overallLearningProgressPercent ?? 0}%` }}
              />
              <span className="profile-overview__progress-text">
                {stats?.overallLearningProgressPercent ?? 0}%
              </span>
            </div>
          </div>
        </div>

        <a href="#voucher" className="profile-overview__voucher-link">
          {activeVouchers} voucher khả dụng <ArrowRight size={14} />
        </a>

        {/* Mini info */}
        <div className="profile-overview__stat-rows" style={{ marginTop: '0.5rem' }}>
          <div className="profile-overview__stat-row">
            <span>Tour hoàn thành</span>
            <strong>{completedBookings}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
