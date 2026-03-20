import { MapPin, BadgeCheck, UserX, Ban, type LucideIcon } from "lucide-react";
import styles from "./SummaryCards.module.scss";

/** Khớp TourEntityStatus (ACTIVE | INACTIVE | BANNED) */
export interface TourSummaryStats {
  total: number;
  active: number;
  inactive: number;
  banned: number;
}

export interface SummaryCardConfig {
  key: string;
  title: string;
  value: string | number;
  icon: LucideIcon;
  accentClass: "indigo" | "emerald" | "rose" | "amber";
  subText: string;
}

interface TourSummaryCardsProps {
  stats: TourSummaryStats;
}

const SUBTEXT = "Cập nhật theo dữ liệu hiện tại";

function buildCardsConfig(stats: TourSummaryStats): SummaryCardConfig[] {
  return [
    {
      key: "total",
      title: "Tổng Tour",
      value: stats.total,
      icon: MapPin,
      accentClass: "indigo",
      subText: SUBTEXT,
    },
    {
      key: "active",
      title: "Đang hoạt động",
      value: stats.active,
      icon: BadgeCheck,
      accentClass: "emerald",
      subText: SUBTEXT,
    },
    {
      key: "inactive",
      title: "Không hoạt động",
      value: stats.inactive,
      icon: UserX,
      accentClass: "amber",
      subText: SUBTEXT,
    },
    {
      key: "banned",
      title: "Đã cấm",
      value: stats.banned,
      icon: Ban,
      accentClass: "rose",
      subText: SUBTEXT,
    },
  ];
}

export default function TourSummaryCards({ stats }: TourSummaryCardsProps) {
  const cardsConfig = buildCardsConfig(stats);

  return (
    <div className={styles.summaryCards}>
      {cardsConfig.map((card) => {
        const IconComponent = card.icon;
        return (
          <div key={card.key} className={styles.summaryCards__card}>
            <div
              className={`${styles.summaryCards__iconWrap} ${styles[`summaryCards__iconWrap--${card.accentClass}`]}`}
            >
              <IconComponent className={styles.summaryCards__icon} size={22} strokeWidth={2} />
            </div>
            <div className={styles.summaryCards__content}>
              <div className={styles.summaryCards__title}>{card.title}</div>
              <div className={styles.summaryCards__value}>{card.value}</div>
              <div className={styles.summaryCards__subtext}>{card.subText}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
