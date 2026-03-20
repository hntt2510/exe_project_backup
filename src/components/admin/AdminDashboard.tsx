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
  DollarOutlined,
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  ArrowRightOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import dayjs from "dayjs";

import {
  getDashboardSummary,
  getAdminTours,
  getAdminBookings,
  getAdminCultureItems,
  getAdminArtisans,
  getAdminUsers,
  getTourSchedules,
  type AdminTour,
  type AdminBooking,
  type DashboardSummary,
} from "../../services/adminApi";

const { Title, Text } = Typography;

const PRIMARY = "#8B0000";
const CHART_COLORS = ["#8B0000", "#C41E3A", "#DC143C", "#B22222", "#A52A2A"];

function formatVnd(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M ₫`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K ₫`;
  return `${value.toLocaleString("vi-VN")} ₫`;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subText?: string;
  icon: React.ReactNode;
  accentColor: string;
  link?: string;
}

function StatCard({ title, value, subText, icon, accentColor, link }: StatCardProps) {
  const content = (
    <Card
      size="small"
      style={{
        borderRadius: 16,
        border: "1px solid #f0f0f0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        transition: "all 0.2s ease",
        height: "100%",
      }}
      bodyStyle={{ padding: 20 }}
      hoverable={!!link}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: accentColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
            {title}
          </Text>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2 }}>
            {value}
          </div>
          {subText && (
            <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
              {subText}
            </Text>
          )}
        </div>
        {link && (
          <ArrowRightOutlined style={{ color: "#bfbfbf", fontSize: 14, marginTop: 4 }} />
        )}
      </div>
    </Card>
  );

  if (link) {
    return (
      <Link to={link} style={{ textDecoration: "none", color: "inherit" }}>
        {content}
      </Link>
    );
  }
  return content;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [tours, setTours] = useState<AdminTour[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [artisansTotal, setArtisansTotal] = useState(0);
  const [contentTotal, setContentTotal] = useState(0);
  const [schedulesUpcoming, setSchedulesUpcoming] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const now = dayjs();
        const fromDate = now.subtract(30, "day").format("YYYY-MM-DD");
        const toDate = now.format("YYYY-MM-DD");

        const [
          summaryRes,
          toursRes,
          bookingsRes,
          contentRes,
          artisansRes,
          usersRes,
          schedulesRes,
        ] = await Promise.allSettled([
          getDashboardSummary({ fromDate, toDate }),
          getAdminTours({ limit: 200 }),
          getAdminBookings({ limit: 100 }),
          getAdminCultureItems(),
          getAdminArtisans({ limit: 500 }),
          getAdminUsers({ limit: 500 }),
          getTourSchedules({ limit: 500 }),
        ]);

        if (cancelled) return;

        const toursData = toursRes.status === "fulfilled" ? toursRes.value.data : [];
        const bookingsData = bookingsRes.status === "fulfilled" ? bookingsRes.value.data : [];
        const contentData = contentRes.status === "fulfilled" ? contentRes.value.data : [];
        const contentTotalVal = contentRes.status === "fulfilled" ? contentRes.value.total : 0;
        const artisansData = artisansRes.status === "fulfilled" ? artisansRes.value.data : [];
        const artisansTotalVal = artisansRes.status === "fulfilled" ? artisansRes.value.total : 0;
        const usersTotalVal = usersRes.status === "fulfilled" ? usersRes.value.total : 0;
        const schedulesData = schedulesRes.status === "fulfilled" ? schedulesRes.value.data : [];

        setTours(toursData);
        setBookings(bookingsData);
        setArtisansTotal(artisansTotalVal || artisansData.length);
        setContentTotal(contentTotalVal || contentData.length);
        setUsersTotal(usersTotalVal);

        const todayStr = now.format("YYYY-MM-DD");
        const upcomingSchedules = schedulesData.filter(
          (s) => s.tourDate && dayjs(s.tourDate).isSameOrAfter(now, "day")
        );
        setSchedulesUpcoming(upcomingSchedules.length);

        if (summaryRes.status === "fulfilled") {
          setSummary(summaryRes.value);
        } else {
          setSummary(null);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("[AdminDashboard]", err);
        setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  const paidBookings = bookings.filter((b) => b.paymentStatus === "PAID");
  const thisMonth = dayjs().format("YYYY-MM");
  const monthlyRevenue = paidBookings
    .filter(
      (b) =>
        (b.paidAt || b.createdAt || "").startsWith(thisMonth)
    )
    .reduce((s, b) => s + (b.finalAmount || 0), 0);

  const totalRevenue = paidBookings.reduce((s, b) => s + (b.finalAmount || 0), 0);
  const todayStr = dayjs().format("YYYY-MM-DD");
  const bookingsToday = bookings.filter((b) =>
    (b.createdAt || "").startsWith(todayStr)
  ).length;

  const provinceMap: Record<string, number> = {};
  tours.forEach((t) => {
    const name =
      (t as AdminTour & { province?: { name?: string } }).province?.name ||
      (t as AdminTour & { provinceName?: string }).provinceName ||
      "Khác";
    provinceMap[name] = (provinceMap[name] || 0) + 1;
  });
  const pieData = Object.entries(provinceMap).map(([name, value], i) => ({
    name,
    value,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const monthMap: Record<string, number> = {};
  paidBookings.forEach((b) => {
    const m = (b.paidAt || b.createdAt || "").slice(0, 7);
    if (m) monthMap[m] = (monthMap[m] || 0) + (b.finalAmount || 0);
  });
  const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
  const year = dayjs().year();
  const revenueChartData = months.map((m, i) => {
    const key = `${year}-${String(i + 1).padStart(2, "0")}`;
    return {
      month: m,
      revenue: Math.round((monthMap[key] || 0) / 1_000_000 * 10) / 10,
      revenueVnd: monthMap[key] || 0,
    };
  });

  const recentBookings = bookings.slice(0, 6).map((b) => ({
    key: String(b.id),
    id: b.bookingCode || `#${b.id}`,
    tour: b.tourTitle || `Tour #${b.tourId}`,
    customer: b.contactName || "-",
    date: b.tourDate ? dayjs(b.tourDate).format("DD/MM/YYYY") : "-",
    status: b.paymentStatus || "PENDING",
    amount: b.finalAmount,
  }));

  const bookingColumns: ColumnsType<typeof recentBookings[0]> = [
    {
      title: "Mã",
      dataIndex: "id",
      key: "id",
      width: 100,
      render: (t) => <Text strong style={{ color: PRIMARY }}>{t}</Text>,
    },
    { title: "Tour", dataIndex: "tour", key: "tour", ellipsis: true },
    { title: "Khách", dataIndex: "customer", key: "customer", width: 120 },
    { title: "Ngày", dataIndex: "date", key: "date", width: 95 },
    {
      title: "TT",
      dataIndex: "status",
      key: "status",
      width: 90,
      render: (s: string) => (
        <Tag color={s === "PAID" ? "success" : s === "PENDING" ? "warning" : "default"}>
          {s === "PAID" ? "Đã thanh toán" : s === "PENDING" ? "Chờ" : s}
        </Tag>
      ),
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      width: 100,
      render: (v: number) => (
        <Text strong style={{ color: PRIMARY }}>
          {v ? formatVnd(v) : "-"}
        </Text>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 80, textAlign: "center" }}>
        <Spin size="large" tip="Đang tải dashboard..." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      {error && (
        <Alert
          type="warning"
          message={error}
          showIcon
          closable
          style={{ marginBottom: 24 }}
        />
      )}

      <header style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <RiseOutlined style={{ fontSize: 28, color: PRIMARY }} />
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 700, color: "#1a1a1a" }}>
              Tổng quan hệ thống
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              {summary
                ? `${dayjs(summary.fromDate).format("DD/MM/YYYY")} — ${dayjs(summary.toDate).format("DD/MM/YYYY")}`
                : `Cập nhật lúc ${dayjs().format("DD/MM/YYYY HH:mm")}`}
            </Text>
          </div>
        </div>
      </header>

      <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <StatCard
            title="Doanh thu tháng"
            value={formatVnd(summary?.payments?.revenueInRange ?? monthlyRevenue)}
            subText={summary?.payments?.revenueInRange != null ? "Từ API" : "Từ bookings"}
            icon={<DollarOutlined style={{ fontSize: 22 }} />}
            accentColor={PRIMARY}
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <StatCard
            title="Booking hôm nay"
            value={bookingsToday}
            subText={`Tổng ${summary?.bookings?.total ?? bookings.length} đơn`}
            icon={<CalendarOutlined style={{ fontSize: 22 }} />}
            accentColor="#059669"
            link="/admin/bookings"
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <StatCard
            title="Tour"
            value={summary?.tours?.active ?? tours.filter((t) => t.status === "ACTIVE").length}
            subText={`/ ${summary?.tours?.total ?? tours.length} tổng`}
            icon={<EnvironmentOutlined style={{ fontSize: 22 }} />}
            accentColor="#2563eb"
            link="/admin/tours"
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <StatCard
            title="Thành viên"
            value={summary?.users?.total ?? usersTotal}
            subText={summary?.users?.newInRange != null ? `+${summary.users.newInRange} mới` : undefined}
            icon={<UserOutlined style={{ fontSize: 22 }} />}
            accentColor="#7c3aed"
            link="/admin/users"
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <StatCard
            title="Nghệ nhân"
            value={artisansTotal}
            icon={<TeamOutlined style={{ fontSize: 22 }} />}
            accentColor="#d97706"
            link="/admin/artisans"
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <StatCard
            title="Nội dung"
            value={summary?.content
              ? (summary.content.blogPostsTotal ?? 0) + (summary.content.videosTotal ?? 0) + (summary.content.cultureItemsTotal ?? 0)
              : contentTotal}
            subText={`Lịch sắp tới: ${summary?.tourSchedules?.upcoming ?? schedulesUpcoming}`}
            icon={<FileTextOutlined style={{ fontSize: 22 }} />}
            accentColor="#0d9488"
            link="/admin/content"
          />
        </Col>
      </Row>

      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            style={{
              borderRadius: 16,
              border: "1px solid #f0f0f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Title level={5} style={{ margin: "0 0 20px 0", fontWeight: 600 }}>
              Doanh thu theo tháng (triệu ₫)
            </Title>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`${value} triệu ₫`, "Doanh thu"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={PRIMARY}
                  strokeWidth={2}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            style={{
              borderRadius: 16,
              border: "1px solid #f0f0f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Title level={5} style={{ margin: "0 0 16px 0", fontWeight: 600 }}>
              Tour theo tỉnh
            </Title>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [value, "Tour"]}
                      contentStyle={{ borderRadius: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 12 }}>
                  {pieData.map((e, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "6px 0",
                        borderBottom: i < pieData.length - 1 ? "1px solid #f0f0f0" : "none",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: e.color,
                          }}
                        />
                        <Text style={{ fontSize: 13 }}>{e.name}</Text>
                      </span>
                      <Text strong>{e.value}</Text>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
                Chưa có dữ liệu
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Card
        style={{
          borderRadius: 16,
          border: "1px solid #f0f0f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
        title={
          <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
            Booking gần đây
          </Title>
        }
        extra={
          <Link to="/admin/bookings" style={{ color: PRIMARY, fontWeight: 500 }}>
            Xem tất cả <ArrowRightOutlined />
          </Link>
        }
        bodyStyle={{ padding: 24 }}
      >
        <Table
          columns={bookingColumns}
          dataSource={recentBookings}
          pagination={false}
          size="middle"
          locale={{ emptyText: "Chưa có booking" }}
        />
      </Card>
    </div>
  );
}
