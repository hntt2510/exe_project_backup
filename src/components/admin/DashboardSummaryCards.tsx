import { Link } from "react-router-dom";
import { CalendarCheck, Banknote, type LucideIcon } from "lucide-react";
import styles from "./SummaryCards.module.scss";

export interface DashboardSummaryStats {
  bookingsToday: number;
  totalBookings: number;
  monthlyRevenue: string;
  revenueGrowth: number;
}

interface SummaryCardConfig {
  key: string;
  title: string;
  value: string | number;
  icon: LucideIcon;
  accentClass: "indigo" | "emerald" | "rose" | "amber";
  subText: string;
  link?: string;
}

function buildCardsConfig(stats: DashboardSummaryStats): SummaryCardConfig[] {
  return [
    {
      key: "bookingsToday",
      title: "Booking hôm nay",
      value: stats.bookingsToday,
      icon: CalendarCheck,
      accentClass: "emerald",
      subText: "Cần xử lý",
      link: "/admin/bookings",
    },
    {
      key: "totalBookings",
      title: "Tổng Booking",
      value: stats.totalBookings,
      icon: CalendarCheck,
      accentClass: "indigo",
      subText: "Tất cả đơn",
      link: "/admin/bookings",
    },
    {
      key: "revenue",
      title: "Doanh thu tháng",
      value: stats.monthlyRevenue,
      icon: Banknote,
      accentClass: "rose",
      subText: `+${stats.revenueGrowth}% tháng trước`,
    },
  ];
}

export default function DashboardSummaryCards({
  stats,
}: {
  stats: DashboardSummaryStats;
}) {
  const cardsConfig = buildCardsConfig(stats);

  return (
    <div className={`${styles.summaryCards} ${styles.summaryCardsDashboard}`}>
      {cardsConfig.map((card) => {
        const IconComponent = card.icon;
        const content = (
          <>
            <div
              className={`${styles.summaryCards__iconWrap} ${styles[`summaryCards__iconWrap--${card.accentClass}`]}`}
            >
              <IconComponent
                className={styles.summaryCards__icon}
                size={22}
                strokeWidth={2}
              />
            </div>
            <div className={styles.summaryCards__content}>
              <div className={styles.summaryCards__title}>{card.title}</div>
              <div className={styles.summaryCards__value}>{card.value}</div>
              <div className={styles.summaryCards__subtext}>{card.subText}</div>
            </div>
          </>
        );

        if (card.link) {
          return (
            <Link
              key={card.key}
              to={card.link}
              className={styles.summaryCards__card}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              {content}
            </Link>
          );
        }

        return (
          <div key={card.key} className={styles.summaryCards__card}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
