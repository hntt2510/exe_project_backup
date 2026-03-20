import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Typography,
  Spin,
  Alert,
} from "antd";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  CalendarCheck,
  Users,
  ClipboardList,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

import {
  getAdminBookings,
  getAdminTours,
  getAdminArtisans,
  type AdminBooking,
  type AdminTour,
} from "../../services/adminApi";
import { getApiErrorMessage } from "../../services/api";

import styles from "./StaffDashboard.module.scss";

const { Title, Text } = Typography;

const BOOKING_STATUS_VI: Record<string, string> = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  PAID: "Đã thanh toán",
  CANCELLED: "Đã hủy",
  REFUNDED: "Đã hoàn tiền",
};

const PIE_COLORS = ["#8B0000", "#059669", "#d97706", "#6b7280", "#9ca3af"];

function getGreeting(): string {
  const hour = dayjs().hour();
  if (hour < 12) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function formatRevenue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M ₫`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K ₫`;
  return `${value.toLocaleString("vi-VN")} ₫`;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  accent: "emerald" | "indigo" | "rose" | "amber";
  link?: string;
}

function StatCard({ title, value, icon, accent, link }: StatCardProps) {
  const content = (
    <div className={`${styles.statCard} ${styles[`statCard--${accent}`]}`}>
      <div className={styles.statCard__icon}>{icon}</div>
      <div className={styles.statCard__content}>
        <span className={styles.statCard__title}>{title}</span>
        <span className={styles.statCard__value}>{value}</span>
      </div>
      {link && (
        <Link to={link} className={styles.statCard__link}>
          <ArrowRight size={18} />
        </Link>
      )}
    </div>
  );

  if (link) {
    return (
      <Link to={link} className={styles.statCardWrapper}>
        {content}
      </Link>
    );
  }
  return <div className={styles.statCardWrapper}>{content}</div>;
}

export default function StaffDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [tours, setTours] = useState<AdminTour[]>([]);
  const [artisansTotal, setArtisansTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [bookingsRes, toursRes, artisansRes] = await Promise.allSettled([
          getAdminBookings({ limit: 100 }),
          getAdminTours({ limit: 100 }),
          getAdminArtisans({ limit: 500 }),
        ]);

        const bookingsData =
          bookingsRes.status === "fulfilled" ? bookingsRes.value.data : [];
        const toursData =
          toursRes.status === "fulfilled" ? toursRes.value.data : [];
        const artisansCount =
          artisansRes.status === "fulfilled" ? artisansRes.value.total : 0;

        if (cancelled) return;
        setBookings(bookingsData);
        setTours(toursData);
        setArtisansTotal(artisansCount);
      } catch (err) {
        if (cancelled) return;
        console.error("[StaffDashboard]", err);
        setError(getApiErrorMessage(err) || "Không thể tải dữ liệu.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const today = dayjs().format("YYYY-MM-DD");
  const activeBookings = bookings.filter(
    (b) =>
      b &&
      (b.paymentStatus || "") !== "CANCELLED" &&
      (b.status || "") !== "CANCELLED" &&
      (b.status || "") !== "REFUNDED"
  );
  const bookingsToday = activeBookings.filter(
    (b) =>
      (b.tourDate && dayjs(b.tourDate).format("YYYY-MM-DD") === today) ||
      (b.createdAt && b.createdAt.startsWith(today))
  );
  const paidBookings = activeBookings.filter(
    (b) => b.paymentStatus === "PAID" || b.status === "PAID"
  );
  const monthlyRevenue = paidBookings
    .filter((b) => {
      const m = (b.paidAt || b.createdAt || "").slice(0, 7);
      return m === dayjs().format("YYYY-MM");
    })
    .reduce((s, b) => s + (b.finalAmount || 0), 0);

  const statusCount: Record<string, number> = {};
  activeBookings.forEach((b) => {
    const s = b.paymentStatus || b.status || "PENDING";
    statusCount[s] = (statusCount[s] || 0) + 1;
  });
  const pieData = Object.entries(statusCount).map(([name, value], i) => ({
    name: BOOKING_STATUS_VI[name] || name,
    value,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const recentBookings = activeBookings
    .sort(
      (a, b) =>
        dayjs(b.createdAt || 0).valueOf() - dayjs(a.createdAt || 0).valueOf()
    )
    .slice(0, 5)
    .map((b) => ({
      key: String(b.id),
      id: b.bookingCode || `#${b.id}`,
      tour: b.tourTitle || `Tour #${b.tourId}`,
      customer: b.contactName || "—",
      date: b.tourDate ? dayjs(b.tourDate).format("DD/MM/YYYY") : "—",
      status: b.paymentStatus || b.status || "PENDING",
      amount: b.finalAmount ? formatRevenue(b.finalAmount) : "—",
    }));

  const columns: ColumnsType<{
    key: string;
    id: string;
    tour: string;
    customer: string;
    date: string;
    status: string;
    amount: string;
  }> = [
    {
      title: "Mã",
      dataIndex: "id",
      key: "id",
      width: 110,
      render: (text) => (
        <Text strong style={{ color: "#8B0000", fontFamily: "monospace" }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Tour",
      dataIndex: "tour",
      key: "tour",
      ellipsis: true,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Khách",
      dataIndex: "customer",
      key: "customer",
      width: 130,
    },
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      width: 100,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (s: string) => {
        const color =
          s === "PAID" || s === "CONFIRMED"
            ? "success"
            : s === "PENDING"
              ? "warning"
              : "default";
        return (
          <Tag color={color} style={{ borderRadius: 6, fontWeight: 500 }}>
            {BOOKING_STATUS_VI[s] ?? s}
          </Tag>
        );
      },
    },
    {
      title: "Tổng tiền",
      dataIndex: "amount",
      key: "amount",
      width: 100,
      render: (text) => (
        <Text strong style={{ color: "#8B0000", fontSize: 13 }}>
          {text}
        </Text>
      ),
    },
  ];

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" tip="Đang tải dashboard..." />
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {error && (
        <Alert
          type="warning"
          message={error}
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 24 }}
        />
      )}

      <header className={styles.header}>
        <div className={styles.header__greeting}>
          <Sparkles size={24} className={styles.header__icon} />
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 700, color: "#1a1a1a" }}>
              {getGreeting()}
            </Title>
            <Text type="secondary" style={{ fontSize: 15 }}>
              Tổng quan công việc hôm nay — {dayjs().format("DD/MM/YYYY")}
            </Text>
          </div>
        </div>
      </header>

      <div className={styles.stats}>
        <StatCard
          title="Booking hôm nay"
          value={bookingsToday.length}
          icon={<CalendarCheck size={24} />}
          accent="emerald"
          link="/staff/bookings"
        />
        <StatCard
          title="Tổng booking đang hoạt động"
          value={activeBookings.length}
          icon={<ClipboardList size={24} />}
          accent="indigo"
          link="/staff/bookings"
        />
        <StatCard
          title="Nghệ nhân"
          value={artisansTotal}
          icon={<Users size={24} />}
          accent="amber"
          link="/staff/artisans"
        />
        <StatCard
          title="Doanh thu tháng"
          value={formatRevenue(monthlyRevenue)}
          icon={<span style={{ fontSize: 20 }}>₫</span>}
          accent="rose"
        />
      </div>

      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            className={styles.card}
            title={
              <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
                Phân bố trạng thái booking
              </Title>
            }
            bodyStyle={{ padding: 24 }}
          >
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                    }
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value: number) => [`${value} đơn`, "Số lượng"]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyState}>
                <Text type="secondary">Chưa có dữ liệu booking</Text>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            className={styles.card}
            title={
              <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
                Tour đang hoạt động
              </Title>
            }
            extra={
              <Link
                to="/staff/tours"
                className={styles.cardLink}
              >
                Xem tất cả <ArrowRight size={14} />
              </Link>
            }
            bodyStyle={{ padding: 24 }}
          >
            {tours.slice(0, 4).length > 0 ? (
              <div className={styles.tourList}>
                {tours.slice(0, 4).map((t) => (
                  <div key={t.id} className={styles.tourItem}>
                    <div className={styles.tourItem__info}>
                      <Text strong style={{ fontSize: 14 }}>
                        {t.title}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {t.provinceName || "—"} • {t.maxParticipants ?? 0} người
                      </Text>
                    </div>
                    <Tag
                      color={t.status === "ACTIVE" ? "success" : "default"}
                      style={{ borderRadius: 6 }}
                    >
                      {t.status === "ACTIVE" ? "Hoạt động" : t.status}
                    </Tag>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Text type="secondary">Chưa có tour</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Card
        className={styles.card}
        title={
          <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
            Booking gần đây
          </Title>
        }
        extra={
          <Link to="/staff/bookings" className={styles.cardLink}>
            Xem tất cả <ArrowRight size={14} />
          </Link>
        }
        bodyStyle={{ padding: 24 }}
      >
        <Table
          columns={columns}
          dataSource={recentBookings}
          pagination={false}
          size="middle"
          locale={{ emptyText: "Chưa có booking" }}
        />
      </Card>
    </div>
  );
}
