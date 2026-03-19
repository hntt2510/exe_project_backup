import { BookOpen, MapPin, User, Landmark, Utensils, Star } from 'lucide-react';

export type TabKey = 'intro' | 'province' | 'artisan' | 'highlights' | 'festivals' | 'food' | 'reviews';

export interface TabItem {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
}

interface StickyTabsProps {
  activeTab: TabKey;
  onTabClick: (key: TabKey) => void;
  hasArtisan?: boolean;
}

export default function StickyTabs({ activeTab, onTabClick, hasArtisan }: StickyTabsProps) {
  const tabs: TabItem[] = [
    { key: 'intro', label: 'Giới thiệu', icon: <BookOpen size={16} /> },
    { key: 'province', label: 'Vùng đất', icon: <MapPin size={16} /> },
    ...(hasArtisan ? [{ key: 'artisan' as TabKey, label: 'Nghệ nhân', icon: <User size={16} /> }] : []),
    { key: 'highlights', label: 'Địa điểm nổi bật', icon: <MapPin size={16} /> },
    { key: 'festivals', label: 'Lễ hội & phong tục', icon: <Landmark size={16} /> },
    { key: 'food', label: 'Ẩm thực', icon: <Utensils size={16} /> },
    { key: 'reviews', label: 'Đánh giá', icon: <Star size={16} /> },
  ];

  return (
    <nav className="td-tabs">
      <div className="td-tabs__container">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`td-tabs__item ${activeTab === tab.key ? 'td-tabs__item--active' : ''}`}
            onClick={() => onTabClick(tab.key)}
            type="button"
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
