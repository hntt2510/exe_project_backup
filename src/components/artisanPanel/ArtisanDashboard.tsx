import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, Row, Col, Statistic, Table, Tag, Spin, Alert, Typography } from "antd";
import {
  CalendarOutlined,
  UnorderedListOutlined,
  ArrowRightOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

import { getMyArtisan, getMySchedules } from "../../services/artisanPanelApi";
import type { AdminTourSchedule } from "../../services/adminApi";

const { Title, Text } = Typography;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: "Đã lên lịch", color: "blue" },
  CANCELLED: { label: "Đã hủy", color: "red" },
  COMPLETED: { label: "Hoàn thành", color: "green" },
  FULL: { label: "Đã đầy", color: "orange" },
};

function formatStartTime(
  st?: { hour?: number; minute?: number } | string
): string {
  if (!st) return "-";
  let h: number, m: number;
  if (typeof st === "string") {
    const parts = st.split(":").map(Number);
    h = parts[0] ?? 0;
    m = parts[1] ?? 0;
  } else {
    h = st.hour ?? 0;
    m = st.minute ?? 0;
  }
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? "AM" : "PM";
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function ArtisanDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [artisan, setArtisan] = useState<{ id: number; fullName: string } | null>(null);
  const [schedules, setSchedules] = useState<AdminTourSchedule[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const myArtisan = await getMyArtisan();
        if (cancelled) return;
        if (!myArtisan) {
          setError("Không tìm thấy hồ sơ nghệ nhân. Vui lòng liên hệ Admin.");
          setArtisan(null);
          setSchedules([]);
          return;
        }
        setArtisan({ id: myArtisan.id, fullName: myArtisan.fullName });
        const mySchedules = await getMySchedules(myArtisan.id);
        if (cancelled) return;
        setSchedules(mySchedules);
      } catch (err) {
        if (cancelled) return;
        console.error("[ArtisanDashboard]", err);
        setError("Không thể tải dữ liệu.");
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
  const schedulesToday = schedules.filter(
    (s) => s.tourDate && dayjs(s.tourDate).format("YYYY-MM-DD") === today
  );
  const upcomingSchedules = schedules.filter(
    (s) => s.tourDate && dayjs(s.tourDate).isSameOrAfter(dayjs(), "day")
  );

  const recentSchedules = [...upcomingSchedules]
    .sort((a, b) => dayjs(a.tourDate).valueOf() - dayjs(b.tourDate).valueOf())
    .slice(0, 5)
    .map((s) => ({
      key: String(s.id),
      tour: s.tour?.title ?? "-",
      date: s.tourDate ? dayjs(s.tourDate).format("DD/MM/YYYY") : "-",
      time: formatStartTime(s.startTime),
      slots: `${s.bookedSlots ?? 0}/${s.maxSlots ?? 0}`,
      status: s.status ?? "SCHEDULED",
    }));

  const columns: ColumnsType<{
    key: string;
    tour: string;
    date: string;
    time: string;
    slots: string;
    status: string;
  }> = [
    { title: "Tour", dataIndex: "tour", key: "tour", ellipsis: true },
    { title: "Ngày", dataIndex: "date", key: "date", width: 100 },
    { title: "Giờ", dataIndex: "time", key: "time", width: 90 },
    { title: "Slots", dataIndex: "slots", key: "slots", width: 80 },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (s: string) => {
        const cfg = STATUS_CONFIG[s] ?? { label: s, color: "default" };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="warning"
        message={error}
        showIcon
        description="Bạn có thể cần liên hệ Admin để được gắn tài khoản với hồ sơ nghệ nhân."
      />
    );
  }

  return (
    <div>
      <header style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <SmileOutlined
            style={{ color: "#8B0000", opacity: 0.9, flexShrink: 0, fontSize: 24 }}
          />
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 700, color: "#1a1a1a" }}>
              Xin chào, {artisan?.fullName ?? "Nghệ nhân"}
            </Title>
            <Text type="secondary" style={{ fontSize: 15 }}>
              Tổng quan lịch trình — {dayjs().format("DD/MM/YYYY")}
            </Text>
          </div>
        </div>
      </header>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 16, border: "1px solid #e5e7eb" }}>
            <Statistic
              title="Lịch hôm nay"
              value={schedulesToday.length}
              prefix={<CalendarOutlined style={{ color: "#8B0000" }} />}
              valueStyle={{ fontSize: 24, color: "#8B0000" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 16, border: "1px solid #e5e7eb" }}>
            <Statistic
              title="Lịch sắp tới"
              value={upcomingSchedules.length}
              prefix={<UnorderedListOutlined style={{ color: "#8B0000" }} />}
              valueStyle={{ fontSize: 24, color: "#8B0000" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 16, border: "1px solid #e5e7eb" }}>
            <Statistic
              title="Tổng lịch"
              value={schedules.length}
              prefix={<UnorderedListOutlined style={{ color: "#8B0000" }} />}
              valueStyle={{ fontSize: 24, color: "#8B0000" }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
            Lịch sắp tới
          </Title>
        }
        extra={
          <Link to="/artisan/schedule" style={{ color: "#8B0000", fontWeight: 500 }}>
            Xem tất cả <ArrowRightOutlined style={{ fontSize: 14 }} />
          </Link>
        }
        style={{
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        }}
      >
        <Table
          columns={columns}
          dataSource={recentSchedules}
          pagination={false}
          size="small"
          locale={{ emptyText: "Chưa có lịch trình" }}
        />
      </Card>
    </div>
  );
}
