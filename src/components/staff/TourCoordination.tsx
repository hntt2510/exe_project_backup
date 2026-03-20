import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Select,
  Button,
  Space,
  Tag,
  Modal,
  Descriptions,
  App,
  Spin,
  Alert,
  Typography,
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import {
  getAdminTours,
  getTourSchedulesByTourId,
  getTourScheduleById,
  type AdminTour,
  type AdminTourSchedule,
} from "../../services/adminApi";
import { getApiErrorMessage } from "../../services/api";
import Breadcrumbs from "../Breadcrumbs";
import TourSummaryCards from "../admin/TourSummaryCards";

dayjs.extend(utc);

const { Title, Text } = Typography;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: "Đã lên lịch", color: "blue" },
  CANCELLED: { label: "Đã hủy", color: "red" },
  COMPLETED: { label: "Hoàn thành", color: "green" },
  FULL: { label: "Đã đầy", color: "orange" },
};

function formatVnd(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? parseFloat(value) : Number(value ?? 0);
  if (Number.isNaN(n)) return "-";
  return `${n.toLocaleString("vi-VN")} ₫`;
}

function getSchedulePrice(s: AdminTourSchedule): number {
  const v =
    s.currentPrice ?? (s as { price?: number }).price ?? s.tour?.price;
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isNaN(n) ? 0 : n;
}

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

export default function TourCoordination() {
  const { message: msg } = App.useApp();
  const [tours, setTours] = useState<AdminTour[]>([]);
  const [schedules, setSchedules] = useState<AdminTourSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTourId, setSelectedTourId] = useState<number | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<AdminTourSchedule | null>(null);

  const fetchTours = async () => {
    try {
      const { data } = await getAdminTours({ limit: 200 });
      setTours(data ?? []);
      if (data?.length && selectedTourId == null) {
        setSelectedTourId(data[0].id);
      }
    } catch (err) {
      console.error("Error fetching tours:", err);
      setError(getApiErrorMessage(err) || "Không thể tải danh sách tour");
    }
  };

  const fetchSchedules = async () => {
    if (selectedTourId == null) {
      setSchedules([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getTourSchedulesByTourId(selectedTourId);
      setSchedules(data ?? []);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      setError(getApiErrorMessage(err) || "Không thể tải lịch trình");
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [selectedTourId]);

  const openDetail = async (record: AdminTourSchedule) => {
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const data = await getTourScheduleById(record.id);
      setDetailData(data);
    } catch {
      msg.error("Không thể tải chi tiết lịch trình");
    } finally {
      setDetailLoading(false);
    }
  };

  const stats = {
    total: tours.length,
    active: tours.filter((t) => t.status === "ACTIVE").length,
    inactive: tours.filter((t) => t.status === "INACTIVE").length,
    banned: tours.filter((t) => t.status === "BANNED").length,
  };

  const columns: ColumnsType<AdminTourSchedule> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      render: (id) => (
        <Text strong style={{ color: "#8B0000" }}>
          #{id}
        </Text>
      ),
    },
    {
      title: "Tour",
      key: "tour",
      width: 220,
      render: (_, r) => (
        <div>
          <strong style={{ fontSize: 14 }}>{r.tour?.title ?? "-"}</strong>
          {r.tour?.province?.name && (
            <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 2 }}>
              {r.tour.province.name}
            </div>
          )}
          {r.tour?.artisan?.fullName && (
            <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 2 }}>
              Nghệ nhân: {r.tour.artisan.fullName}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Ngày",
      dataIndex: "tourDate",
      key: "tourDate",
      width: 110,
      render: (d) => (d ? dayjs(d).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Giờ",
      key: "startTime",
      width: 90,
      render: (_, r) => formatStartTime(r.startTime),
    },
    {
      title: "Slots",
      key: "slots",
      width: 100,
      render: (_, r) => (
        <Text>
          {r.bookedSlots ?? 0}/{r.maxSlots ?? 0}
        </Text>
      ),
    },
    {
      title: "Giá",
      key: "currentPrice",
      width: 120,
      render: (_, r) => formatVnd(getSchedulePrice(r)),
    },
    {
      title: "Giảm",
      dataIndex: "discountPercent",
      key: "discountPercent",
      width: 80,
      render: (v) => (v ? `${v}%` : "-"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => {
        const cfg = STATUS_CONFIG[status] ?? {
          label: status || "Chưa xác định",
          color: "default",
        };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => openDetail(record)}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Breadcrumbs
        items={[
          { label: "Dashboard", path: "/staff" },
          { label: "Điều phối Tour" },
        ]}
      />

      <TourSummaryCards stats={stats} />

      <div>
        <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1a1a1a" }}>
          Điều phối Tour
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Xem lịch trình tour và theo dõi slots đăng ký
        </Text>
        <Alert
          message="Lưu ý"
          description="Staff chỉ có quyền xem lịch trình tour. Không có quyền tạo, sửa hoặc xóa lịch. Vui lòng liên hệ Admin để thay đổi."
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </div>

      {error && (
        <Alert
          type="warning"
          message={error}
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Card
        style={{
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        }}
        bodyStyle={{ padding: 24 }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Select
            size="large"
            style={{ minWidth: 320 }}
            placeholder="Chọn tour để xem lịch trình"
            value={selectedTourId}
            onChange={(v) => setSelectedTourId(v)}
            options={tours.map((t) => ({ value: t.id, label: t.title }))}
            optionFilterProp="label"
            showSearch
            filterOption={(input, opt) =>
              (opt?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            notFoundContent="Không có tour nào"
            allowClear={false}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <Spin size="large" tip="Đang tải lịch trình..." />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={schedules}
            rowKey="id"
            scroll={{ x: 1000 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} lịch trình`,
            }}
            locale={{ emptyText: "Chưa có lịch trình nào" }}
          />
        )}
      </Card>

      <Modal
        title="Chi tiết lịch trình"
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          setDetailData(null);
        }}
        footer={null}
        width={560}
      >
        {detailLoading ? (
          <div style={{ textAlign: "center", padding: 32 }}>
            <Spin />
            <p style={{ marginTop: 12 }}>Đang tải...</p>
          </div>
        ) : detailData ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{detailData.id}</Descriptions.Item>
            <Descriptions.Item label="Tour">
              {detailData.tour?.title ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Tỉnh thành">
              {detailData.tour?.province?.name ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Nghệ nhân">
              {detailData.tour?.artisan?.fullName ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày">
              {detailData.tourDate
                ? dayjs(detailData.tourDate).format("DD/MM/YYYY")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Giờ khởi hành">
              {formatStartTime(detailData.startTime)}
            </Descriptions.Item>
            <Descriptions.Item label="Slots">
              {detailData.bookedSlots ?? 0} / {detailData.maxSlots ?? 0}
            </Descriptions.Item>
            <Descriptions.Item label="Giá">
              {formatVnd(getSchedulePrice(detailData))}
            </Descriptions.Item>
            <Descriptions.Item label="Giảm giá">
              {detailData.discountPercent ? `${detailData.discountPercent}%` : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={STATUS_CONFIG[detailData.status]?.color ?? "default"}>
                {STATUS_CONFIG[detailData.status]?.label ?? detailData.status}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>
    </Space>
  );
}
