import { CalendarDays, Disc, HandHeart, Shirt, Users, Camera, Volume2 } from 'lucide-react';
import type { CultureItem } from '../../../types';

/* ── Hardcoded icon pool for festival cards ── */
const FESTIVAL_ICONS = [
  <CalendarDays size={28} />,
  <Disc size={28} />,
];

/* ── Hardcoded fallback festivals ── */
const FALLBACK_FESTIVALS: Pick<CultureItem, 'id' | 'title' | 'description'>[] = [
  {
    id: -1,
    title: 'Lễ hội cầu mùa',
    description:
      'Nghi lễ truyền thống của người Bahnar diễn ra vào đầu mùa khô, cầu mong một năm mưa thuận gió hoà, mùa màng bội thu.',
  },
  {
    id: -2,
    title: 'Không gian Cồng chiêng',
    description:
      'Di sản văn hoá phi vật thể của nhân loại, thể hiện tâm hồn và triết lý sống của người Tây Nguyên qua âm thanh cồng chiêng.',
  },
];

/* ── Hardcoded cultural tips ── */
const CULTURE_TIPS = [
  { icon: <Shirt size={18} />, text: 'Trang phục lịch sự khi tham dự nghi lễ' },
  { icon: <Users size={18} />, text: 'Tôn trọng không gian sinh hoạt chung' },
  { icon: <Camera size={18} />, text: 'Trước khi chụp ảnh người dân địa phương, hãy luôn chủ động xin phép họ' },
  { icon: <Volume2 size={18} />, text: 'Không làm ồn trong khu vực linh thiêng' },
];

interface FestivalsSectionProps {
  festivals: CultureItem[];
  sectionRef: (el: HTMLElement | null) => void;
}

export default function FestivalsSection({
  festivals,
  sectionRef,
}: FestivalsSectionProps) {
  /* Only take CRAFT items, max 2 – fall back to hardcoded data */
  const displayFestivals =
    festivals.length > 0
      ? festivals.slice(0, 2).map((f) => ({ id: f.id, title: f.title, description: f.description }))
      : FALLBACK_FESTIVALS;

  return (
    <section className="td-section td-festivals" ref={sectionRef}>
      <div className="td-section__container">
        <h2 className="td-section__title td-section__title--decorated">
          LỄ HỘI &amp; PHONG TỤC
        </h2>

        <div className="td-festivals__body">
          {/* Festival cards — max 2, left column */}
          <div className="td-festivals__cards">
            {displayFestivals.map((item, idx) => (
              <div key={item.id} className="td-festivals__card">
                <div className="td-festivals__card-icon">
                  {FESTIVAL_ICONS[idx] || FESTIVAL_ICONS[0]}
                </div>
                <div className="td-festivals__card-text">
                  <h4 className="td-festivals__card-title">{item.title}</h4>
                  <p className="td-festivals__card-desc">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Cultural behavior tips — hardcoded, right column */}
          <div className="td-festivals__tips-card">
            <h4 className="td-festivals__tips-heading">
              <HandHeart size={20} />
              Lưu ý ứng xử văn hoá
            </h4>
            <ul className="td-festivals__tips-list">
              {CULTURE_TIPS.map((tip, i) => (
                <li key={i} className="td-festivals__tip">
                  <span>{tip.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
