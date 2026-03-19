import { BookOpen, MapPin, Play, Landmark, Utensils, Star } from 'lucide-react';

export type TabKey = 'intro' | 'highlights' | 'videos' | 'festivals' | 'food' | 'reviews';

export interface TabItem {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
}

export const TABS: TabItem[] = [
  { key: 'intro', label: 'Giới thiệu chung', icon: <BookOpen size={16} /> },
  { key: 'highlights', label: 'Địa điểm nổi bật', icon: <MapPin size={16} /> },
  { key: 'videos', label: 'Videos/Story', icon: <Play size={16} /> },
  { key: 'festivals', label: 'Lễ hội - phong tục', icon: <Landmark size={16} /> },
  { key: 'food', label: 'Ẩm thực địa phương', icon: <Utensils size={16} /> },
  { key: 'reviews', label: 'Đánh giá', icon: <Star size={16} /> },
];

interface StickyTabsProps {
  activeTab: TabKey;
  onTabClick: (key: TabKey) => void;
}

export default function StickyTabs({ activeTab, onTabClick }: StickyTabsProps) {
  return (
    <nav className="td-tabs">
      <div className="td-tabs__container">
        {TABS.map((tab) => (
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
