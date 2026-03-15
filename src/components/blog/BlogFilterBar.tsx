import type { Province } from "../../types";
import "../../styles/components/blog/_blog-filter.scss";

type BlogFilterBarProps = {
  provinces: Province[];
  selectedProvinceId: string;
  onProvinceChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  onReset: () => void;
  total: number;
};

export default function BlogFilterBar({
  provinces,
  selectedProvinceId,
  onProvinceChange,
  sortBy,
  onSortChange,
  onReset,
  total,
}: BlogFilterBarProps) {
  return (
    <div className="blog-filter">
      <div className="blog-filter__row">
        <div className="blog-filter__field">
          <label className="blog-filter__label" htmlFor="blog-province">
            Tỉnh thành
          </label>
          <select
            id="blog-province"
            className="blog-filter__select"
            value={selectedProvinceId}
            onChange={(e) => onProvinceChange(e.target.value)}
          >
            <option value="all">Tất cả</option>
            {provinces.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="blog-filter__field">
          <label className="blog-filter__label" htmlFor="blog-sort">
            Sắp xếp
          </label>
          <select
            id="blog-sort"
            className="blog-filter__select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
          </select>
        </div>

        <button type="button" className="blog-filter__reset" onClick={onReset}>
          Xoá lọc
        </button>
      </div>

      <div className="blog-filter__summary">
        Đang hiển thị <strong>{total}</strong> bài viết
      </div>
    </div>
  );
}
