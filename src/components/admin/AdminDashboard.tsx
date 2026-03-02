import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Progress,
  Space,
  Typography,
  Divider,
  Spin,
  Alert,
} from "antd";
import {
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  getDashboardStats,
  getAdminTours,
  getAdminBookings,
  getAdminContent,
  getAdminArtisans,
  type AdminTour,
  type AdminBooking,
} from "../../services/adminApi";
import DashboardSummaryCards from "./DashboardSummaryCards";

const { Title, Text } = Typography;

function formatRevenue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M ₫`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K ₫`;
  return `${value.toLocaleString("vi-VN")} ₫`;
}

const PIE_COLORS = [
  "#8B0000",
  "#C41E3A",
  "#DC143C",
  "#FF6347",
  "#CD5C5C",
  "#B22222",
];

interface BookingRow {
  key: string;
  id: string;
  tour: string;
  customer: string;
  date: string;
  status: string;
  amount: string;
}

interface TourStatusRow {
  key: string;
  tour: string;
  date: string;
  status: string;
  participants: string;
  progress: number;
}

const bookingColumns: ColumnsType<BookingRow> = [
  {
    title: "Mã",
    dataIndex: "id",
    key: "id",
    width: 100,
    render: (text) => (
      <Text strong style={{ color: "#8B0000" }}>
        {text}
      </Text>
    ),
  },
  {
    title: "Tour",
    dataIndex: "tour",
    key: "tour",
    render: (text) => <Text strong>{text}</Text>,
  },
  {
    title: "Khách hàng",
    dataIndex: "customer",
    key: "customer",
  },
  {
    title: "Ngày",
    dataIndex: "date",
    key: "date",
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    render: (status: string) => {
      const color =
        status === "PAID"
          ? "success"
          : status === "PENDING"
            ? "warning"
            : "default";
      return <Tag color={color}>{status}</Tag>;
    },
  },
  {
    title: "Tổng tiền",
    dataIndex: "amount",
    key: "amount",
    render: (text) => (
      <Text strong style={{ color: "#8B0000", fontSize: 14 }}>
        {text}
      </Text>
    ),
  },
];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalTours: 0,
    totalBookings: 0,
    totalUsers: 0,
    totalContent: 0,
    totalArtisans: 0,
    bookingsToday: 0,
    monthlyRevenue: 0,
    toursGrowth: 0,
    bookingsGrowth: 0,
    contentGrowth: 0,
    revenueGrowth: 0,
  });
  const [tours, setTours] = useState<AdminTour[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<
    { month: string; revenue: number; target: number }[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, toursRes, bookingsRes, contentRes, artisansRes] =
          await Promise.allSettled([
            getDashboardStats(),
            getAdminTours({ limit: 100 }),
            getAdminBookings({ limit: 100 }),
            getAdminContent({ limit: 500 }),
            getAdminArtisans({ limit: 500 }),
          ]);

        const toursData =
          toursRes.status === "fulfilled" ? toursRes.value.data : [];
        const bookingsData =
          bookingsRes.status === "fulfilled" ? bookingsRes.value.data : [];
        const contentData =
          contentRes.status === "fulfilled" ? contentRes.value.data : [];
        const contentTotal =
          contentRes.status === "fulfilled" ? contentRes.value.total : 0;
        const artisansData =
          artisansRes.status === "fulfilled" ? artisansRes.value.data : [];
        const artisansTotal =
          artisansRes.status === "fulfilled" ? artisansRes.value.total : 0;

        setTours(toursData);
        setBookings(bookingsData);

        const todayStr = dayjs().format("YYYY-MM-DD");
        const thisMonth = dayjs().format("YYYY-MM");
        const paidBookings = bookingsData.filter(
          (b) => b.paymentStatus === "PAID",
        );
        const bookingsTodayCount = bookingsData.filter((b) =>
          b.createdAt?.startsWith(todayStr),
        ).length;
        const totalRevenue = paidBookings.reduce(
          (s, b) => s + (b.finalAmount || 0),
          0,
        );
        const monthlyRevenue = paidBookings
          .filter(
            (b) =>
              b.paidAt?.startsWith(thisMonth) ||
              b.createdAt?.startsWith(thisMonth),
          )
          .reduce((s, b) => s + (b.finalAmount || 0), 0);

        if (statsRes.status === "fulfilled") {
          const s = statsRes.value;
          setStats({
            totalTours: s.totalTours ?? toursData.length,
            totalBookings: s.totalBookings ?? bookingsData.length,
            totalUsers: s.totalUsers ?? 0,
            totalContent: contentTotal || contentData.length,
            totalArtisans: artisansTotal || artisansData.length,
            bookingsToday: s.bookingsToday ?? bookingsTodayCount,
            monthlyRevenue: (s.totalRevenue ?? monthlyRevenue) / 1_000_000,
            toursGrowth: s.toursGrowth ?? 0,
            bookingsGrowth: s.bookingsGrowth ?? 0,
            contentGrowth: 0,
            revenueGrowth: s.revenueGrowth ?? 0,
          });
        } else {
          setStats({
            totalTours: toursData.length,
            totalBookings: bookingsData.length,
            totalUsers: 0,
            totalContent: contentTotal || contentData.length,
            totalArtisans: artisansTotal || artisansData.length,
            bookingsToday: bookingsTodayCount,
            monthlyRevenue: totalRevenue / 1_000_000,
            toursGrowth: 0,
            bookingsGrowth: 0,
            contentGrowth: 0,
            revenueGrowth: 0,
          });
        }

        const monthMap: Record<string, number> = {};
        paidBookings.forEach((b) => {
          const m = (b.paidAt || b.createdAt || "").slice(0, 7);
          if (m) monthMap[m] = (monthMap[m] || 0) + (b.finalAmount || 0);
        });
        const months = [
          "T1",
          "T2",
          "T3",
          "T4",
          "T5",
          "T6",
          "T7",
          "T8",
          "T9",
          "T10",
          "T11",
          "T12",
        ];
        const year = dayjs().year();
        const revData = months.map((m, i) => {
          const key = `${year}-${String(i + 1).padStart(2, "0")}`;
          return {
            month: m,
            revenue: Math.round((monthMap[key] || 0) / 1_000_000),
            target: 50,
          };
        });
        setRevenueByMonth(revData);
      } catch (err) {
        console.error("[AdminDashboard] fetch error:", err);
        setError("Không thể tải dữ liệu dashboard. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const provinceMap: Record<string, number> = {};
  tours.forEach((t) => {
    const name =
      (t as AdminTour & { province?: { name?: string } }).province?.name ||
      (t as AdminTour & { provinceName?: string }).provinceName ||
      "Không xác định";
    provinceMap[name] = (provinceMap[name] || 0) + 1;
  });
  const tourByProvinceData = Object.entries(provinceMap).map(
    ([name, value], i) => ({
      name,
      value,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }),
  );

  const recentBookings: BookingRow[] = bookings.slice(0, 5).map((b) => ({
    key: String(b.id),
    id: b.bookingCode || `#${b.id}`,
    tour: b.tourTitle || `Tour #${b.tourId}`,
    customer: b.contactName || "-",
    date: b.tourDate ? dayjs(b.tourDate).format("DD/MM/YYYY") : "-",
    status: b.paymentStatus || b.status || "PENDING",
    amount: b.finalAmount ? `${(b.finalAmount / 1_000_000).toFixed(1)}Mđ` : "-",
  }));

  const tourStatusRows: TourStatusRow[] = tours.slice(0, 5).map((t) => {
    const max = t.maxParticipants || 10;
    const min = t.minParticipants || 1;
    const progress = Math.min(100, Math.round((min / max) * 100));
    return {
      key: String(t.id),
      tour: t.title,
      date: t.startDate ? dayjs(t.startDate).format("DD/MM/YYYY") : "-",
      status: t.status || "OPEN",
      participants: `${min}/${max}`,
      progress,
    };
  });

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin size="large" tip="Đang tải dashboard..." />
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      {error && (
        <Alert
          type="warning"
          message={error}
          showIcon
          closable
          style={{ marginBottom: 24 }}
        />
      )}

      <div style={{ marginBottom: 24 }}>
        <Title
          level={2}
          style={{ margin: 0, fontWeight: 700, color: "#1a1a1a" }}
        >
          Dashboard
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Tổng quan hệ thống và thống kê
        </Text>
      </div>

      <DashboardSummaryCards
        stats={{
          bookingsToday: stats.bookingsToday,
          totalBookings: stats.totalBookings,
          monthlyRevenue: formatRevenue(stats.monthlyRevenue * 1_000_000),
          revenueGrowth: stats.revenueGrowth,
        }}
      />

      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            style={{
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            }}
            title={
              <Title
                level={5}
                style={{ margin: 0, fontWeight: 600, color: "#1a1a1a" }}
              >
                Doanh thu theo tháng
              </Title>
            }
            bodyStyle={{ padding: 24 }}
          >
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={revenueByMonth}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B0000" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B0000" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d9d9d9" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#d9d9d9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value: number | undefined) =>
                    value ? [`${value}M VNĐ`, "Doanh thu"] : ["", ""]
                  }
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu thực tế"
                  stroke="#8B0000"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Mục tiêu"
                  stroke="#d9d9d9"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            style={{
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            }}
            title={
              <Title
                level={5}
                style={{ margin: 0, fontWeight: 600, color: "#1a1a1a" }}
              >
                Phân bố Tour theo Tỉnh
              </Title>
            }
            bodyStyle={{ padding: 24 }}
          >
            {tourByProvinceData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={tourByProvinceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                      }
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {tourByProvinceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <Divider style={{ margin: "16px 0" }} />
                <Space
                  direction="vertical"
                  style={{ width: "100%" }}
                  size="small"
                >
                  {tourByProvinceData.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        borderRadius: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: item.color,
                          }}
                        />
                        <Text style={{ color: "#374151", fontWeight: 500 }}>
                          {item.name}
                        </Text>
                      </div>
                      <Text strong style={{ color: "#1a1a1a", fontSize: 15 }}>
                        {item.value}
                      </Text>
                    </div>
                  ))}
                </Space>
              </>
            ) : (
              <div
                style={{ padding: 24, textAlign: "center", color: "#6b7280" }}
              >
                Chưa có dữ liệu tour theo tỉnh
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={12}>
          <Card
            style={{
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            }}
            title={
              <Title
                level={5}
                style={{ margin: 0, fontWeight: 600, color: "#1a1a1a" }}
              >
                Booking Gần đây
              </Title>
            }
            extra={
              <Link
                to="/admin/bookings"
                style={{
                  color: "#8B0000",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Xem tất cả →
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
        </Col>

        <Col xs={24} lg={12}>
          <Card
            style={{
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            }}
            title={
              <Title
                level={5}
                style={{ margin: 0, fontWeight: 600, color: "#1a1a1a" }}
              >
                Trạng thái Tour
              </Title>
            }
            extra={
              <Link
                to="/admin/tours"
                style={{
                  color: "#8B0000",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Xem tất cả →
              </Link>
            }
            bodyStyle={{ padding: 24 }}
          >
            {tourStatusRows.length > 0 ? (
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="large"
              >
                {tourStatusRows.map((item) => (
                  <div
                    key={item.key}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <Text strong style={{ fontSize: 15, color: "#1a1a1a" }}>
                          {item.tour}
                        </Text>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#6b7280",
                            marginTop: 4,
                          }}
                        >
                          {item.date}
                        </div>
                      </div>
                      <Tag
                        color={
                          item.status === "OPEN"
                            ? "success"
                            : item.status === "NEAR_DEADLINE"
                              ? "warning"
                              : "error"
                        }
                        style={{
                          borderRadius: 6,
                          padding: "4px 12px",
                          fontWeight: 500,
                        }}
                      >
                        {item.status}
                      </Tag>
                    </div>
                    <Progress
                      percent={item.progress}
                      status={
                        item.progress >= 80
                          ? "success"
                          : item.progress >= 50
                            ? "active"
                            : "exception"
                      }
                      strokeColor={
                        item.progress >= 80
                          ? "#52c41a"
                          : item.progress >= 50
                            ? "#1890ff"
                            : "#ff4d4f"
                      }
                      style={{ marginBottom: 8 }}
                    />
                    <Text style={{ fontSize: 13, color: "#6b7280" }}>
                      {item.participants} người tham gia
                    </Text>
                  </div>
                ))}
              </Space>
            ) : (
              <div
                style={{ padding: 24, textAlign: "center", color: "#6b7280" }}
              >
                Chưa có tour
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
