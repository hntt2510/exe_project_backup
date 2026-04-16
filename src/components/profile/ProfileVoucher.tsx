import { useState, useMemo, useEffect } from 'react';
import { Pagination } from 'antd';
import { Ticket, Clock, AlertCircle, Filter, CheckCircle } from 'lucide-react';
import { isVoucherUsed, type UserVoucherWithSource, type VoucherSource } from '../../services/profileApi';
import '../../styles/components/profile/_profile-voucher.scss';

interface ProfileVoucherProps {
  vouchers: UserVoucherWithSource[];
}

function formatPrice(n: number): string {
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return n.toLocaleString('vi-VN');
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
] as const;

const TYPE_OPTIONS: { value: '' | VoucherSource; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'SYSTEM', label: 'Hệ thống' },
  { value: 'LEARN', label: 'Quiz / Lesson' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'available', label: 'Còn dùng' },
  { value: 'used', label: 'Đã sử dụng' },
] as const;

const PAGE_SIZE = 6;

export default function ProfileVoucher({ vouchers }: ProfileVoucherProps) {
  const now = new Date();
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [typeFilter, setTypeFilter] = useState<'' | VoucherSource>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'used'>('all');
  const [page, setPage] = useState(1);

  const filteredVouchers = useMemo(() => {
    let list = vouchers;
    if (typeFilter) {
      list = list.filter((v) => v.source === typeFilter);
    }
    if (statusFilter === 'available') {
      list = list.filter((v) => !isVoucherUsed(v) && new Date(v.validUntil) >= now);
    } else if (statusFilter === 'used') {
      list = list.filter((v) => isVoucherUsed(v) || new Date(v.validUntil) < now); // đã dùng hoặc hết hạn
    }
    const sorted = [...list].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.validUntil).getTime();
      const dateB = new Date(b.createdAt || b.validUntil).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });
    return sorted;
  }, [vouchers, sortBy, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredVouchers.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [sortBy, typeFilter, statusFilter]);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const pagedVouchers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredVouchers.slice(start, start + PAGE_SIZE);
  }, [filteredVouchers, page]);

  return (
    <div className="profile-voucher">
      <h3 className="profile-voucher__title">Ví voucher</h3>

      {vouchers.length === 0 ? (
        <div className="profile-voucher__empty">
          <Ticket size={40} />
          <p>Bạn chưa có voucher nào.</p>
          <p className="profile-voucher__empty-hint">
            Hoàn thành Quiz đạt 100%, tham gia Workshop hoặc đặt tour
            trong chương trình khuyến mãi đặc biệt
          </p>
        </div>
      ) : (
        <>
          <div className="profile-voucher__filters">
            <div className="profile-voucher__filter-group">
              <Filter size={16} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                className="profile-voucher__select"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as '' | VoucherSource)}
                className="profile-voucher__select"
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="profile-voucher__select"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="profile-voucher__grid">
            {pagedVouchers.map((v) => {
              const expired = new Date(v.validUntil) < now;
              const used = isVoucherUsed(v);
              const disabled = expired || used || !v.isActive;

              return (
                <div
                  key={`${v.code}-${v.source}`}
                  className={`profile-voucher__card ${disabled ? 'profile-voucher__card--used' : ''}`}
                >
                  {/* Left ticket stub */}
                  <div className="profile-voucher__card-left">
                    {v.source && (
                      <span className={`profile-voucher__badge profile-voucher__badge--${v.source.toLowerCase()}`}>
                        {v.source === 'LEARN' ? 'Quiz' : 'Hệ thống'}
                      </span>
                    )}
                    <span className="profile-voucher__amount">
                      {v.discountType === 'PERCENTAGE'
                        ? `${v.discountValue}%`
                        : formatPrice(v.discountValue)}
                    </span>
                    <span className="profile-voucher__code">{v.code}</span>
                  </div>

                  {/* Right info */}
                  <div className="profile-voucher__card-right">
                    <p className="profile-voucher__condition">
                      Áp dụng
                      {v.minPurchase > 0
                        ? ` đơn từ ${formatPrice(v.minPurchase)}`
                        : ' cho mọi đơn'}
                    </p>
                    <p className="profile-voucher__expiry">
                      {used ? (
                        <span className="profile-voucher__expired">
                          <CheckCircle size={12} /> Đã sử dụng
                        </span>
                      ) : expired ? (
                        <span className="profile-voucher__expired">
                          <AlertCircle size={12} /> Hết hạn
                        </span>
                      ) : (
                        <span>
                          <Clock size={12} /> Hạn sử dụng: {formatDate(v.validUntil)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredVouchers.length > 0 && (
            <div className="profile-voucher__pagination">
              <Pagination
                current={page}
                pageSize={PAGE_SIZE}
                total={filteredVouchers.length}
                onChange={setPage}
                showSizeChanger={false}
                hideOnSinglePage
                size="small"
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} / ${total} voucher`}
              />
            </div>
          )}

          <div className="profile-voucher__footer">
            <p className="profile-voucher__footer-title">Cách nhận thêm Voucher</p>
            <p className="profile-voucher__footer-text">
              Hoàn thành Quiz đạt 100%, tham gia Workshop hoặc đặt tour
              trong chương trình khuyến mãi đặc biệt
            </p>
          </div>
        </>
      )}
    </div>
  );
}
