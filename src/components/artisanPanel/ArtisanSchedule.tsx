import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Tag,
  Spin,
  Alert,
  Typography,
  Select,
  Space,
} from "antd";
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

type FilterType = "all" | "upcoming" | "past";

export default function ArtisanSchedule() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [artisan, setArtisan] = useState<{ id: number } | null>(null);
  const [schedules, setSchedules] = useState<AdminTourSchedule[]>([]);
  const [filter, setFilter] = useState<FilterType>("upcoming");

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
        setArtisan({ id: myArtisan.id });
        const mySchedules = await getMySchedules(myArtisan.id);
        if (cancelled) return;
        setSchedules(mySchedules);
      } catch (err) {
        if (cancelled) return;
        console.error("[ArtisanSchedule]", err);
        setError("Không thể tải lịch trình.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const today = dayjs().startOf("day");
  const filteredSchedules = schedules.filter((s) => {
    const d = s.tourDate ? dayjs(s.tourDate) : null;
    if (!d) return filter === "all";
    if (filter === "upcoming") return d.isSameOrAfter(today);
    if (filter === "past") return d.isBefore(today);
    return true;
  });

  const columns: ColumnsType<AdminTourSchedule> = [
    {
      title: "Tour",
      key: "tour",
      width: 220,
      ellipsis: true,
      render: (_, s) => (
        <Text strong style={{ color: "#262626" }}>
          {s.tour?.title ?? "-"}
        </Text>
      ),
    },
    {
      title: "Ngày",
      dataIndex: "tourDate",
      key: "date",
      width: 110,
      render: (val: string) =>
        val ? dayjs(val).format("DD/MM/YYYY") : "-",
    },
    {
      title: "Giờ",
      key: "time",
      width: 100,
      render: (_, s) => formatStartTime(s.startTime),
    },
    {
      title: "Slots",
      key: "slots",
      width: 90,
      render: (_, s) => (
        <Text type="secondary">
          {s.bookedSlots ?? 0}/{s.maxSlots ?? 0}
        </Text>
      ),
    },
    {
      title: "Giá",
      key: "price",
      width: 110,
      render: (_, s) => {
        const p =
          s.currentPrice ?? (s as { price?: number }).price ?? s.tour?.price;
        const n = typeof p === "string" ? parseFloat(p) : Number(p ?? 0);
        return (
          <Text>
            {Number.isNaN(n) ? "-" : `${n.toLocaleString("vi-VN")} ₫`}
          </Text>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (s: string) => {
        const cfg = STATUS_CONFIG[s ?? ""] ?? { label: s ?? "-", color: "default" };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" tip="Đang tải lịch trình..." />
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
      <header style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, fontWeight: 600, color: "#1a1a1a" }}>
          Lịch trình của tôi
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          Xem tất cả lịch tour mà bạn tham gia
        </Text>
      </header>

      <Card
        style={{
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        }}
      >
        <Space style={{ marginBottom: 16 }} wrap>
          <Text type="secondary">Lọc:</Text>
          <Select
            value={filter}
            onChange={(v) => setFilter(v as FilterType)}
            style={{ width: 140 }}
            options={[
              { value: "upcoming", label: "Sắp tới" },
              { value: "past", label: "Đã qua" },
              { value: "all", label: "Tất cả" },
            ]}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={filteredSchedules}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (t) => `Tổng ${t} lịch`,
          }}
          size="middle"
          locale={{ emptyText: "Chưa có lịch trình" }}
        />
      </Card>
    </div>
  );
}
