import { useState, useEffect, useMemo } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Select,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Popconfirm,
  Descriptions,
  App,
  Spin,
  Alert,
  Typography,
  Segmented,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import localeData from "dayjs/plugin/localeData";
import localizedFormat from "dayjs/plugin/localizedFormat";
import minMax from "dayjs/plugin/minMax";
import utc from "dayjs/plugin/utc";
import isLeapYear from "dayjs/plugin/isLeapYear";
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./TourScheduleCalendar.css";
import {
  getAdminTours,
  getTourSchedulesByTourId,
  getTourScheduleById,
  createTourSchedule,
  updateTourSchedule,
  deleteTourSchedule,
  type AdminTourSchedule,
  type AdminTour,
} from "../../services/adminApi";
import { getApiErrorMessage, getTourById } from "../../services/api";

dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(localeData);
dayjs.extend(localizedFormat);
dayjs.extend(minMax);
dayjs.extend(utc);
dayjs.extend(isLeapYear);
dayjs.locale("vi");

/** Format datetime từ UTC sang giờ Việt Nam (UTC+7) */
function formatDateTimeVN(isoString: string | null | undefined): string {
  if (!isoString) return "-";
  
  try {
    // Nếu timestamp có Z hoặc timezone indicator → parse UTC và thêm 7 giờ
    if (isoString.includes("Z") || isoString.match(/[+-]\d{2}:\d{2}$/)) {
      return dayjs.utc(isoString).add(7, "hour").format("DD/MM/YYYY HH:mm");
    }
    
    // Nếu không có timezone indicator, giả định là UTC (backend thường trả về UTC)
    // Parse như UTC và thêm 7 giờ để chuyển sang giờ VN
    // dayjs.utc() sẽ tự động parse ISO string không có timezone như UTC
    return dayjs.utc(isoString).add(7, "hour").format("DD/MM/YYYY HH:mm");
  } catch (err) {
    console.error("Error parsing datetime:", isoString, err);
    return "-";
  }
}

const localizer = dayjsLocalizer(dayjs);

const { Title, Text } = Typography;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: "Đã lên lịch", color: "blue" },
  CANCELLED: { label: "Đã hủy", color: "red" },
  COMPLETED: { label: "Hoàn thành", color: "green" },
};

function formatVnd(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? parseFloat(value) : Number(value ?? 0);
  if (Number.isNaN(n)) return "-";
  return `${n.toLocaleString("vi-VN")} ₫`;
}

/** Lấy giá từ schedule - backend có thể trả currentPrice, price hoặc tour.price */
function getSchedulePrice(s: AdminTourSchedule): number {
  const v = s.currentPrice ?? (s as { price?: number }).price ?? s.tour?.price;
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isNaN(n) ? 0 : n;
}

/** Format startTime - hỗ trợ cả string "HH:mm:ss" và object { hour, minute } */
function formatStartTime(
  st?: { hour?: number; minute?: number } | string,
): string {
  if (!st) return "-";
  
  let h: number, m: number;
  
  // Nếu là string "HH:mm:ss" hoặc "HH:mm"
  if (typeof st === "string") {
    const parts = st.split(":").map(Number);
    h = parts[0] ?? 0;
    m = parts[1] ?? 0;
  } else {
    // Nếu là object { hour, minute }
    h = st.hour ?? 0;
    m = st.minute ?? 0;
  }
  
  // Format theo 12 giờ với AM/PM
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? "AM" : "PM";
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** Chuyển "HH:mm" thành { hour, minute, second, nano } theo API */
function parseStartTimeToApi(timeStr: string): {
  hour: number;
  minute: number;
  second: number;
  nano: number;
} {
  const parts = (timeStr || "08:00").trim().split(":");
  const hour = Math.min(23, Math.max(0, parseInt(parts[0], 10) || 8));
  const minute = Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0));
  return { hour, minute, second: 0, nano: 0 };
}

/** Chuyển AdminTourSchedule thành event cho react-big-calendar */
function scheduleToEvent(s: AdminTourSchedule): {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: AdminTourSchedule;
} {
  let h = 8, m = 0;
  
  // Xử lý startTime có thể là string "HH:mm:ss" hoặc object { hour, minute }
  if (s.startTime) {
    if (typeof s.startTime === "string") {
      const parts = s.startTime.split(":").map(Number);
      h = parts[0] ?? 8;
      m = parts[1] ?? 0;
    } else {
      h = s.startTime.hour ?? 8;
      m = s.startTime.minute ?? 0;
    }
  }
  
  const start = dayjs(s.tourDate).hour(h).minute(m).second(0).toDate();
  const end = dayjs(start).add(2, "hour").toDate(); // Mặc định 2 giờ
  const price = getSchedulePrice(s);
  const title = `${s.tour?.title ?? "Tour"} • ${formatStartTime(s.startTime)} • ${formatVnd(price)} • ${s.bookedSlots ?? 0}/${s.maxSlots ?? 0} slot`;
  return { id: s.id, title, start, end, resource: s };
}

const messages = {
  date: "Ngày",
  time: "Giờ",
  event: "Sự kiện",
  allDay: "Cả ngày",
  week: "Tuần",
  work_week: "Tuần làm việc",
  day: "Ngày",
  month: "Tháng",
  previous: "Trước",
  next: "Sau",
  today: "Hôm nay",
  agenda: "Lịch trình",
  noEventsInRange: "Không có lịch trình trong khoảng này.",
};

export default function TourScheduleManagement() {
  const { message: msg } = App.useApp();
  const [tours, setTours] = useState<AdminTour[]>([]);
  const [schedules, setSchedules] = useState<AdminTourSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTourId, setSelectedTourId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("calendar");
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<AdminTourSchedule | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formEditId, setFormEditId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [formSaving, setFormSaving] = useState(false);

  const fetchTours = async () => {
    try {
      const { data } = await getAdminTours({ limit: 200 });
      const list = data ?? [];
      setTours(list);
      if (list.length > 0 && selectedTourId == null) {
        setSelectedTourId(list[0].id);
      }
    } catch (err) {
      console.error("Error fetching tours:", err);
      setError("Không thể tải danh sách tour");
    }
  };

  const fetchSchedules = async () => {
    if (selectedTourId == null) {
      setSchedules([]);
      setLoading(false);
      setError(null);
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

  const calendarEvents = useMemo(
    () => schedules.map(scheduleToEvent),
    [schedules]
  );

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

  const openForm = (record?: AdminTourSchedule, slot?: { start: Date; end: Date }) => {
    // Đóng detail modal nếu đang mở
    if (detailModalOpen) {
      setDetailModalOpen(false);
    }
    setFormEditId(record?.id ?? null);
    setFormModalOpen(true);
    if (record) {
      // Xử lý startTime có thể là string "HH:mm:ss" hoặc object { hour, minute }
      let startTimeStr = "08:00";
      if (record.startTime) {
        if (typeof record.startTime === "string") {
          // Nếu là string "HH:mm:ss", lấy phần HH:mm
          const parts = record.startTime.split(":");
          startTimeStr = `${parts[0]?.padStart(2, "0") ?? "08"}:${parts[1]?.padStart(2, "0") ?? "00"}`;
        } else {
          // Nếu là object { hour, minute }
          startTimeStr = `${String(record.startTime.hour ?? 0).padStart(2, "0")}:${String(record.startTime.minute ?? 0).padStart(2, "0")}`;
        }
      }
      
      form.setFieldsValue({
        tourId: record.tour?.id,
        tourDate: dayjs(record.tourDate),
        startTime: startTimeStr,
        maxSlots: record.maxSlots,
        currentPrice: getSchedulePrice(record),
        discountPercent: record.discountPercent ?? 0,
        status: record.status,
      });
    } else {
      const selectedTour = tours.find((t) => t.id === selectedTourId);
      const defaultPrice = selectedTour?.price ?? 0;
      const defaultMaxSlots = selectedTour?.maxParticipants ?? 15; // Lấy từ tour hoặc mặc định 15
      form.resetFields();
      form.setFieldsValue({
        tourId: selectedTourId ?? undefined,
        tourDate: slot ? dayjs(slot.start) : dayjs(),
        startTime: slot ? dayjs(slot.start).format("HH:mm") : "08:00",
        maxSlots: defaultMaxSlots,
        currentPrice: defaultPrice,
        discountPercent: 0,
        status: "SCHEDULED",
      });
    }
  };

  const closeForm = () => {
    setFormModalOpen(false);
    setFormEditId(null);
    form.resetFields();
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const tourId =
        formEditId != null
          ? (schedules.find((s) => s.id === formEditId)?.tour?.id as number)
          : values.tourId;

      if (!tourId) {
        msg.error("Vui lòng chọn tour");
        return;
      }

      setFormSaving(true);
      const tourDate = dayjs(values.tourDate).format("YYYY-MM-DD");
      const startTime = parseStartTimeToApi(values.startTime || "08:00");
      const maxSlots = Number(values.maxSlots) || 1;
      
      // Lấy currentPrice từ form hoặc từ tour nếu không có
      let selectedTour = tours.find((t) => t.id === tourId);
      
      // Nếu không tìm thấy trong danh sách đã load, gọi API để lấy thông tin tour
      if (!selectedTour) {
        try {
          const tourDetail = await getTourById(tourId);
          selectedTour = {
            id: tourDetail.id,
            title: tourDetail.title,
            price: tourDetail.price,
            maxParticipants: tourDetail.maxParticipants,
          } as AdminTour;
        } catch (err) {
          console.error("Error fetching tour detail:", err);
          msg.error("Không thể tải thông tin tour");
          setFormSaving(false);
          return;
        }
      }
      
      let currentPrice: number;
      if (values.currentPrice != null && values.currentPrice !== "" && Number(values.currentPrice) > 0) {
        currentPrice = Number(values.currentPrice);
      } else if (selectedTour?.price && selectedTour.price > 0) {
        currentPrice = selectedTour.price;
      } else {
        msg.error("Vui lòng nhập giá hoặc chọn tour có giá");
        setFormSaving(false);
        return;
      }
      
      const discountPercent = values.discountPercent != null && values.discountPercent !== ""
        ? Number(values.discountPercent)
        : undefined;
      const status = (values.status as string) || "SCHEDULED";

      const payload: {
        tourDate: string;
        startTime: { hour: number; minute: number; second: number; nano: number };
        maxSlots: number;
        currentPrice: number;
        discountPercent?: number;
        status: string;
      } = {
        tourDate,
        startTime,
        maxSlots,
        currentPrice,
        status,
      };
      
      // Chỉ thêm discountPercent nếu có giá trị > 0
      if (discountPercent != null && discountPercent > 0) {
        payload.discountPercent = discountPercent;
      }

      let updatedSchedule: AdminTourSchedule | null = null;
      if (formEditId) {
        updatedSchedule = await updateTourSchedule(formEditId, payload);
        msg.success("Cập nhật lịch trình thành công");
      } else {
        updatedSchedule = await createTourSchedule({
          tourId,
          ...payload,
        });
        msg.success("Tạo lịch trình thành công");
      }
      closeForm();
      // Refresh schedules để cập nhật UI (bảng và calendar)
      await fetchSchedules();
      // Nếu detail modal đang mở và đang xem schedule vừa update, refresh detail data
      if (updatedSchedule && detailModalOpen && detailData?.id === updatedSchedule.id) {
        setDetailData(updatedSchedule);
      }
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      msg.error(getApiErrorMessage(err) || "Thao tác thất bại");
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTourSchedule(id);
      msg.success("Đã xóa lịch trình");
      fetchSchedules();
      setDetailModalOpen(false);
    } catch (err) {
      msg.error(getApiErrorMessage(err) || "Xóa thất bại");
    }
  };

  const handleSelectEvent = (event: { resource: AdminTourSchedule }) => {
    // Click vào event → chỉ hiện detail, không mở form edit
    openDetail(event.resource);
  };

  const handleDoubleClickEvent = (event: { resource: AdminTourSchedule }) => {
    // Double-click vào event → cũng chỉ hiện detail
    openDetail(event.resource);
  };

  const handleSelectSlot = (slot: { start: Date; end: Date }) => {
    // Click vào slot trống → mở form tạo mới
    openForm(undefined, slot);
  };

  const columns: ColumnsType<AdminTourSchedule> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      render: (id) => <Text strong style={{ color: "#8B0000" }}>#{id}</Text>,
    },
    {
      title: "Tour",
      dataIndex: ["tour", "title"],
      key: "tour",
      render: (_, r) => r.tour?.title ?? "-",
    },
    {
      title: "Ngày",
      dataIndex: "tourDate",
      key: "tourDate",
      width: 120,
      render: (d) => (d ? dayjs(d).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Giờ",
      key: "startTime",
      width: 80,
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
      width: 140,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openDetail(record)}
          >
            Xem
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openForm(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa lịch trình?"
            description="Hành động này không thể hoàn tác."
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ width: "100%" }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1a1a1a" }}>
          Quản lý Lịch trình Tour
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Tạo và quản lý lịch trình cho từng tour
        </Text>
      </div>

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
            padding: "16px 20px",
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
          }}
        >
          <Select
            size="large"
            style={{ minWidth: 320 }}
            placeholder="Chọn tour để xem lịch trình"
            value={selectedTourId}
            onChange={(v) => setSelectedTourId(v as number)}
            options={tours.map((t) => ({ value: t.id, label: t.title }))}
            optionFilterProp="label"
            showSearch
            filterOption={(input, opt) =>
              (opt?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            notFoundContent="Không có tour nào"
            allowClear={false}
          />
          <Segmented
            value={viewMode}
            onChange={(v) => setViewMode(v as "table" | "calendar")}
            size="large"
            options={[
              { value: "calendar", label: "Lịch", icon: <CalendarOutlined /> },
              { value: "table", label: "Bảng", icon: <UnorderedListOutlined /> },
            ]}
          />
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => openForm()}
          >
            Thêm lịch trình
          </Button>
        </div>

        {selectedTourId == null ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            <CalendarOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <p>
              {tours.length === 0
                ? "Đang tải danh sách tour..."
                : "Chọn tour để xem lịch trình"}
            </p>
          </div>
        ) : loading ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Spin size="large" />
          </div>
        ) : viewMode === "calendar" ? (
          <div style={{ height: 600 }}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              titleAccessor="title"
              resourceAccessor="resource"
              onSelectEvent={handleSelectEvent}
              onDoubleClickEvent={handleDoubleClickEvent}
              onSelectSlot={handleSelectSlot}
              onNavigate={(date) => setCalendarDate(date)}
              date={calendarDate}
              selectable
              messages={messages}
              views={["month", "week", "day", "agenda"]}
              defaultView="month"
              popup
              style={{ height: "100%" }}
              eventPropGetter={(event) => {
                const status = event.resource?.status;
                const color = STATUS_CONFIG[status]?.color ?? "blue";
                const colors: Record<string, string> = {
                  blue: "#1890ff",
                  green: "#52c41a",
                  red: "#ff4d4f",
                  default: "#8c8c8c",
                };
                return { style: { backgroundColor: colors[color] ?? colors.blue } };
              }}
            />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={schedules.map((s) => ({ ...s, key: String(s.id) }))}
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (t) => `Tổng ${t} lịch trình`,
            }}
            locale={{ emptyText: "Chưa có lịch trình" }}
          />
        )}
      </Card>

      <Modal
        title="Chi tiết lịch trình"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        zIndex={1000}
        maskClosable={true}
        footer={
          detailData ? (
            <Space>
              <Button onClick={() => openForm(detailData)} icon={<EditOutlined />}>
                Sửa
              </Button>
              <Popconfirm
                title="Xóa lịch trình?"
                onConfirm={() => handleDelete(detailData.id)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />}>
                  Xóa
                </Button>
              </Popconfirm>
              <Button type="primary" onClick={() => setDetailModalOpen(false)}>
                Đóng
              </Button>
            </Space>
          ) : null
        }
        width={560}
      >
        {detailLoading ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Spin />
          </div>
        ) : detailData ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{detailData.id}</Descriptions.Item>
            <Descriptions.Item label="Tour">
              {detailData.tour?.title ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày">
              {detailData.tourDate
                ? dayjs(detailData.tourDate).format("DD/MM/YYYY")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Giờ bắt đầu">
              {formatStartTime(detailData.startTime)}
            </Descriptions.Item>
            <Descriptions.Item label="Slots">
              {detailData.bookedSlots ?? 0} / {detailData.maxSlots ?? 0}
            </Descriptions.Item>
            <Descriptions.Item label="Giá hiện tại">
              {formatVnd(getSchedulePrice(detailData))}
            </Descriptions.Item>
            <Descriptions.Item label="Giảm giá">
              {detailData.discountPercent ? `${detailData.discountPercent}%` : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag
                color={
                  STATUS_CONFIG[detailData.status]?.color ?? "default"
                }
              >
                {STATUS_CONFIG[detailData.status]?.label ?? detailData.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {formatDateTimeVN(detailData.createdAt)}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>

      <Modal
        title={formEditId ? "Sửa lịch trình" : "Thêm lịch trình"}
        open={formModalOpen}
        onCancel={closeForm}
        onOk={handleFormSubmit}
        confirmLoading={formSaving}
        okText={formEditId ? "Cập nhật" : "Tạo"}
        width={480}
        zIndex={1001}
        maskClosable={true}
      >
        <Form form={form} layout="vertical">
          {!formEditId && (
            <Form.Item
              name="tourId"
              label="Tour"
              rules={[{ required: true, message: "Chọn tour" }]}
            >
              <Select
                placeholder="Chọn tour"
                options={tours.map((t) => ({ value: t.id, label: t.title }))}
              />
            </Form.Item>
          )}
          <Form.Item
            name="tourDate"
            label="Ngày"
            rules={[{ required: true, message: "Chọn ngày" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="startTime" label="Giờ bắt đầu (HH:mm, ví dụ: 08:00)">
            <Input placeholder="08:00" />
          </Form.Item>
          <Form.Item
            name="maxSlots"
            label="Số slot tối đa"
            rules={[{ required: true, message: "Nhập số slot" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="currentPrice"
            label="Giá (VNĐ)"
            rules={[{ required: true, message: "Nhập giá" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="discountPercent" label="Giảm giá (%)">
            <InputNumber min={0} max={100} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái">
            <Select
              options={[
                { value: "SCHEDULED", label: "Đã lên lịch" },
                { value: "CANCELLED", label: "Đã hủy" },
                { value: "COMPLETED", label: "Hoàn thành" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
