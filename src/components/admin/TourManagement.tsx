import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Select,
  Row,
  Col,
  Progress,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Alert,
  Spin,
  Typography,
  Upload,
} from "antd";

const { Title, Text } = Typography;
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import TourSummaryCards from "./TourSummaryCards";
import { getArtisans, getProvinces, getCultureItemsByProvince, getTourCultureItems, getApiErrorMessage } from "../../services/api";
import {
  getAdminTours,
  getAdminTourById,
  createTour,
  updateTour,
  deleteTour,
  setTourCultureItems,
  getTourSchedulesByTourId,
  deleteTourSchedule,
  type CreateTourRequest,
  type AdminTour,
  type TourEntityStatus,
  normalizeTourStatus,
} from "../../services/adminApi";
import type { Artisan, Province } from "../../types";
import type { CultureItem } from "../../types";

/** Map từ AdminTour — trạng thái đọc từ API (enum Tour.status trên BE) */
interface Tour {
  key: string;
  id: string;
  title: string;
  location: string;
  provinceId?: number;
  price: number;
  maxParticipants: number;
  totalBookings: number;
  status: TourEntityStatus;
  artisan?: string;
  artisanId?: string;
  averageRating?: number;
  durationHours: number;
  createdAt: string;
  description?: string;
  preparationTips?: string;
  bestSeason?: string;
  transportation?: string;
  culturalTips?: string;
  thumbnailUrl?: string;
  images?: string[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    || "tour";
}

const statusConfig: Record<
  TourEntityStatus,
  { label: string; color: string; bgColor?: string }
> = {
  ACTIVE: { label: "Đang hoạt động", color: "#52c41a", bgColor: "#f6ffed" },
  INACTIVE: { label: "Không hoạt động", color: "#8c8c8c", bgColor: "#fafafa" },
  BANNED: { label: "Đã cấm", color: "#cf1322", bgColor: "#fff1f0" },
};

export default function TourManagement() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cultureItems, setCultureItems] = useState<CultureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<{
    status: string;
    location: string;
    search: string;
  }>({
    status: "all",
    location: "all",
    search: "",
  });
  const [searchInput, setSearchInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [form] = Form.useForm();

  const mapAdminTourToTour = (apiTour: AdminTour): Tour => {
    const status = normalizeTourStatus(apiTour.status);
    return {
      key: String(apiTour.id),
      id: String(apiTour.id),
      title: apiTour.title,
      location: apiTour.provinceName || "Chưa xác định",
      provinceId: apiTour.provinceId,
      price: apiTour.price,
      maxParticipants: apiTour.maxParticipants,
      totalBookings: apiTour.totalBookings ?? 0,
      status,
      artisan: apiTour.artisanName,
      artisanId: apiTour.artisanId ? String(apiTour.artisanId) : undefined,
      averageRating: apiTour.averageRating,
      durationHours: apiTour.durationHours || 1,
      createdAt: apiTour.createdAt || "",
      description: apiTour.description,
      preparationTips: apiTour.preparationTips,
      bestSeason: apiTour.bestSeason,
      transportation: apiTour.transportation,
      culturalTips: apiTour.culturalTips,
      thumbnailUrl: apiTour.thumbnailUrl,
      images: apiTour.images,
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      let toursData: AdminTour[] = [];
      let artisansData: Artisan[] = [];
      let hasError = false;
      try {
        const [toursRes, provincesData, artisansFromApi] = await Promise.all([
          getAdminTours({ limit: 500 }),
          getProvinces(),
          getArtisans(),
        ]);
        toursData = toursRes.data;
        setProvinces(provincesData ?? []);
        artisansData = artisansFromApi ?? [];
      } catch (err: unknown) {
        console.error("Error fetching tours:", err);
        hasError = true;
        setError("Không thể tải dữ liệu tours. Vui lòng thử lại sau.");
        message.error("Không thể tải dữ liệu tours");
      }
      setArtisans(artisansData);
      setTours(toursData.map(mapAdminTourToTour));
      if (!hasError && toursData.length === 0) setError("Không có dữ liệu tours để hiển thị.");
      else if (!hasError) setError(null);
      setLoading(false);
    };
    fetchData();
  }, []);

  const watchProvinceId = Form.useWatch("provinceId", form);
  useEffect(() => {
    if (watchProvinceId) {
      getCultureItemsByProvince(Number(watchProvinceId))
        .then(setCultureItems)
        .catch(() => setCultureItems([]));
    } else {
      setCultureItems([]);
    }
  }, [watchProvinceId]);

  const filteredTours = tours.filter((tour) => {
    if (filter.status !== "all" && tour.status !== filter.status) return false;
    if (filter.location !== "all" && tour.location !== filter.location)
      return false;
    if (filter.search?.trim()) {
      const q = filter.search.toLowerCase();
      return (
        tour.title?.toLowerCase().includes(q) ||
        tour.location?.toLowerCase().includes(q) ||
        tour.artisan?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getProgress = (tour: Tour) => {
    if (tour.maxParticipants <= 0) return 0;
    return Math.min(100, Math.round((tour.totalBookings / tour.maxParticipants) * 100));
  };

  const handleDeleteTour = (record: Tour) => {
    Modal.confirm({
      title: "Xác nhận xóa tour",
      content: `Bạn có chắc muốn xóa "${record.title}"? Tour và các lịch trình liên quan sẽ bị xóa vĩnh viễn.`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        const tourId = Number(record.id);
        const doDelete = async () => {
          await deleteTour(tourId);
          message.success("Đã xóa tour thành công");
          const { data } = await getAdminTours({ limit: 500 });
          setTours(data.map(mapAdminTourToTour));
        };
        const clearRelated = async () => {
          try {
            await setTourCultureItems(tourId, []);
          } catch {
            /* Bỏ qua */
          }
          try {
            const schedules = await getTourSchedulesByTourId(tourId);
            for (const s of schedules) {
              try {
                await deleteTourSchedule(s.id);
              } catch {
                /* Bỏ qua */
              }
            }
          } catch {
            /* Bỏ qua */
          }
        };
        try {
          await doDelete();
        } catch (err: unknown) {
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 500) {
            try {
              await clearRelated();
              await doDelete();
            } catch (retryErr: unknown) {
              message.error(
                "Không thể xóa tour. Tour có thể có booking hoặc được gắn với module học. Vui lòng hủy các booking và gỡ tour khỏi module trước."
              );
            }
          } else {
            message.error(getApiErrorMessage(err) || "Xóa tour thất bại");
          }
        }
      },
    });
  };

  const refetchTours = async () => {
    const { data } = await getAdminTours({ limit: 500 });
    setTours(data.map(mapAdminTourToTour));
  };

  const handleCreateTour = async (values: Record<string, unknown>) => {
    try {
      const provinceId = Number(values.provinceId);
      const price = Number(values.price);
      const maxParticipants = Number(values.maxParticipants);
      const durationHours = Number(values.durationHours) || 1;

      if (Number.isNaN(provinceId) || provinceId <= 0) {
        message.error("Vui lòng chọn tỉnh thành");
        return;
      }
      if (Number.isNaN(price) || price < 0) {
        message.error("Vui lòng nhập giá hợp lệ");
        return;
      }
      if (Number.isNaN(maxParticipants) || maxParticipants < 1) {
        message.error("Vui lòng nhập số người tối đa hợp lệ");
        return;
      }

      const thumbnailFileList = values.thumbnail as { originFileObj?: File }[] | undefined;
      const thumbnailFile =
        Array.isArray(thumbnailFileList) &&
        thumbnailFileList.length > 0 &&
        thumbnailFileList[0]?.originFileObj
          ? thumbnailFileList[0].originFileObj
          : undefined;

      const imagesFileList = values.images as { originFileObj?: File }[] | undefined;
      const imagesFiles: File[] = Array.isArray(imagesFileList)
        ? imagesFileList
          .map((f) => f?.originFileObj)
          .filter((f): f is File => f instanceof File)
        : [];

      const artisanVal = values.artisan;
      const artisanId = artisanVal != null && artisanVal !== "" ? Number(artisanVal) : undefined;
      if (artisanId != null && Number.isNaN(artisanId)) {
        message.error("Nghệ nhân không hợp lệ");
        return;
      }

      const cultureItemIdsRaw = values.cultureItemIds;
      const cultureItemIds: number[] = Array.isArray(cultureItemIdsRaw)
        ? cultureItemIdsRaw.map(Number).filter((n) => !Number.isNaN(n) && n > 0)
        : [];

      const title = String(values.title ?? "").trim();
      if (!title) {
        message.error("Vui lòng nhập tên tour");
        return;
      }

      const baseSlug = slugify(title);
      const slug = selectedTour
        ? `${baseSlug}-${selectedTour.id}`
        : baseSlug;
      const statusVal = (values.status as TourEntityStatus) || "ACTIVE";
      const payload: CreateTourRequest = {
        title,
        description: String(values.description ?? "").trim(),
        provinceId,
        price,
        maxParticipants,
        durationHours,
        slug,
        status: statusVal,
        ...(thumbnailFile ? { thumbnail: thumbnailFile } : {}),
        ...(imagesFiles.length > 0 ? { images: imagesFiles } : {}),
        ...(artisanId != null && artisanId > 0 ? { artisanId } : {}),
        ...(selectedTour?.artisanId && !artisanId ? { clearArtisan: true } : {}),
        ...(!selectedTour && cultureItemIds.length > 0 ? { cultureItemIds } : {}),
        ...(values.preparationTips ? { preparationTips: String(values.preparationTips).trim() } : {}),
        ...(values.bestSeason ? { bestSeason: String(values.bestSeason).trim() } : {}),
        ...(values.transportation ? { transportation: String(values.transportation).trim() } : {}),
        ...(values.culturalTips ? { culturalTips: String(values.culturalTips).trim() } : {}),
      };

      if (selectedTour) {
        await updateTour(Number(selectedTour.id), payload);
        try {
          await setTourCultureItems(Number(selectedTour.id), cultureItemIds);
        } catch (cultureErr) {
          console.warn("[TourManagement] setTourCultureItems failed:", cultureErr);
        }
        message.success("Đã cập nhật tour");
      } else {
        await createTour(payload);
        message.success("Đã tạo tour thành công");
      }
      setIsModalOpen(false);
      setSelectedTour(null);
      form.resetFields();
      await refetchTours();
    } catch (err: unknown) {
      message.error(getApiErrorMessage(err) || (selectedTour ? "Cập nhật thất bại" : "Tạo tour thất bại"));
      console.error("[TourManagement] API error:", err);
    }
  };

  const columns: ColumnsType<Tour> = [
    {
      title: "Tour",
      key: "tour",
      width: 250,
      render: (_, record) => (
        <div>
          <strong style={{ fontSize: 16 }}>{record.title}</strong>
          <div style={{ marginTop: 4, color: "#8c8c8c", fontSize: 12 }}>
            <EnvironmentOutlined /> {record.location}
          </div>
          {record.artisan && (
            <div style={{ marginTop: 4, color: "#8c8c8c", fontSize: 12 }}>
              <UserOutlined /> {record.artisan}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Thời gian",
      key: "date",
      width: 180,
      render: (_, record) => (
        <div>
          <div>
            <ClockCircleOutlined /> Thời lượng: {record.durationHours}h
          </div>
          {record.createdAt && (
            <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 4 }}>
              <CalendarOutlined /> Tạo: {dayjs(record.createdAt).format("DD/MM/YYYY")}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Giá",
      key: "price",
      width: 150,
      render: (_, record) => (
        <div>
          <DollarOutlined style={{ color: "#8B0000" }} />{" "}
          <strong style={{ color: "#8B0000", fontSize: 16 }}>
            {record.price.toLocaleString("vi-VN")}đ
          </strong>
          <div style={{ fontSize: 12, color: "#8c8c8c" }}>/ người</div>
        </div>
      ),
    },
    {
      title: "Đăng ký",
      key: "participants",
      width: 180,
      render: (_, record) => {
        const progress = getProgress(record);
        const remaining = Math.max(0, record.maxParticipants - record.totalBookings);
        return (
          <div>
            <div style={{ marginBottom: 8 }}>
              <strong>{record.totalBookings}</strong> / {record.maxParticipants}
              <div style={{ fontSize: 11, color: "#8c8c8c", marginTop: 2 }}>
                Tổng booking: {record.totalBookings}
              </div>
            </div>
            <Progress
              percent={progress}
              status={
                progress >= 100
                  ? "success"
                  : progress >= 80
                    ? "active"
                    : "exception"
              }
              size="small"
              strokeColor={
                progress >= 100
                  ? "#52c41a"
                  : progress >= 80
                    ? "#1890ff"
                    : progress >= 50
                      ? "#faad14"
                      : "#ff4d4f"
              }
              railColor="#f0f0f0"
            />
            {remaining > 0 && (
              <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 4 }}>
                Còn {remaining} chỗ
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Đánh giá",
      key: "rating",
      width: 120,
      render: (_, record) => {
        const rating = record.averageRating || 0;
        const totalBookings = record.totalBookings || 0;
        if (rating === 0 && totalBookings === 0) {
          return <span style={{ color: "#8c8c8c" }}>Chưa có</span>;
        }
        return (
          <div>
            {rating > 0 && (
              <div style={{ fontSize: 16, fontWeight: 600, color: "#faad14" }}>
                ⭐ {rating.toFixed(1)}
              </div>
            )}
            {totalBookings > 0 && (
              <div style={{ fontSize: 11, color: "#8c8c8c", marginTop: 2 }}>
                {totalBookings} booking
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status: string) => {
        const key = normalizeTourStatus(status);
        const config = statusConfig[key];
        return (
          <Tag
            color={config.color}
            style={{
              backgroundColor: config.bgColor,
              borderColor: config.color,
              color: config.color,
              fontWeight: 500,
              padding: "4px 12px",
            }}
          >
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 200,
      fixed: "right",
      render: (_, record) => {
        return (
          <Space orientation="vertical" size="small" style={{ width: "100%" }}>
            <Button
              type="link"
              icon={<EditOutlined />}
              size="small"
              onClick={async () => {
                setSelectedTour(record);
                try {
                  const [detail, tourCultureItems] = await Promise.all([
                    getAdminTourById(Number(record.id)),
                    getTourCultureItems(Number(record.id)),
                  ]);
                  const cultureIds = tourCultureItems.map((c) => c.id);
                  form.setFieldsValue({
                    title: detail.title,
                    description: detail.description,
                    provinceId: detail.provinceId,
                    price: detail.price,
                    maxParticipants: detail.maxParticipants,
                    durationHours: detail.durationHours || 1,
                    status: detail.status,
                    thumbnail: detail.thumbnailUrl
                      ? [{ uid: "-1", name: "thumb", status: "done", url: detail.thumbnailUrl }]
                      : undefined,
                    images: detail.images?.length
                      ? detail.images.map((url, i) => ({ uid: String(i), name: `img-${i}`, status: "done" as const, url }))
                      : undefined,
                    preparationTips: detail.preparationTips,
                    bestSeason: detail.bestSeason,
                    transportation: detail.transportation,
                    culturalTips: detail.culturalTips,
                    artisan: detail.artisanId,
                    cultureItemIds: cultureIds,
                  });
                  if (detail.provinceId) {
                    getCultureItemsByProvince(detail.provinceId)
                      .then(setCultureItems)
                      .catch(() => setCultureItems([]));
                  }
                } catch (err) {
                  message.error(getApiErrorMessage(err) || "Không thể tải chi tiết tour");
                  form.setFieldsValue({
                    title: record.title,
                    provinceId: record.provinceId,
                    price: record.price,
                    maxParticipants: record.maxParticipants,
                    durationHours: record.durationHours || 1,
                    status: record.status,
                    description: record.description,
                    preparationTips: record.preparationTips,
                    bestSeason: record.bestSeason,
                    transportation: record.transportation,
                    culturalTips: record.culturalTips,
                    artisan: record.artisanId,
                  });
                }
                setIsModalOpen(true);
              }}
            >
              Sửa
            </Button>
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteTour(record)}
            >
              Xóa
            </Button>
          </Space>
        );
      },
    },
  ];

  const stats = {
    total: tours.length,
    active: tours.filter((t) => t.status === "ACTIVE").length,
    inactive: tours.filter((t) => t.status === "INACTIVE").length,
    banned: tours.filter((t) => t.status === "BANNED").length,
  };

  return (
    <div style={{ width: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <Title
            level={2}
            style={{ margin: 0, fontWeight: 700, color: "#1a1a1a" }}
          >
            Quản lý Tour
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Tạo và quản lý lịch trình cho từng tour.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setSelectedTour(null);
            form.resetFields();
            form.setFieldsValue({ durationHours: 1, status: "ACTIVE" });
            setIsModalOpen(true);
          }}
          size="large"
          style={{
            height: 44,
            fontSize: 15,
            fontWeight: 500,
            boxShadow: "0 2px 4px rgba(139, 0, 0, 0.2)",
          }}
        >
          Tạo tour mới
        </Button>
      </div>

      <TourSummaryCards stats={stats} />

      {/* Bảng Tour */}
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
            Danh sách Tour
          </Title>
        }
        styles={{ body: { padding: 24 } }}
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <div style={{ marginBottom: 4, fontSize: 13, color: "#595959" }}>
              Trạng thái
            </div>
            <Select
              style={{ width: "100%" }}
              placeholder="Tất cả trạng thái"
              value={filter.status}
              onChange={(value) => setFilter({ ...filter, status: value })}
            >
              <Select.Option value="all">Tất cả</Select.Option>
              <Select.Option value="ACTIVE">Đang hoạt động</Select.Option>
              <Select.Option value="INACTIVE">Không hoạt động</Select.Option>
              <Select.Option value="BANNED">Đã cấm</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ marginBottom: 4, fontSize: 13, color: "#595959" }}>
              Tỉnh thành
            </div>
            <Select
              style={{ width: "100%" }}
              placeholder="Tất cả tỉnh thành"
              value={filter.location}
              onChange={(value) => setFilter({ ...filter, location: value })}
            >
              <Select.Option value="all">Tất cả</Select.Option>
              {provinces.map((p) => (
                <Select.Option key={p.id} value={p.name}>
                  {p.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div style={{ marginBottom: 4, fontSize: 13, color: "#595959" }}>
              Tìm kiếm
            </div>
            <Input
              placeholder="Tìm theo tên tour, địa điểm, nghệ nhân..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onPressEnter={() => setFilter({ ...filter, search: searchInput })}
              allowClear
              onClear={() => {
                setSearchInput("");
                setFilter({ ...filter, search: "" });
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button
              style={{ marginTop: 22 }}
              onClick={() => setFilter({ ...filter, search: searchInput })}
            >
              Tìm kiếm
            </Button>
          </Col>
        </Row>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>Đang tải dữ liệu...</p>
          </div>
        ) : error ? (
          <Alert
            message="Lỗi"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredTours}
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} tour`,
            }}
          />
        )}
      </Card>

      {/* Modal Tạo/Sửa Tour */}
      <Modal
        title={selectedTour ? "Sửa tour" : "Tạo tour mới"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setSelectedTour(null);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ durationHours: 1, status: "ACTIVE" }}
          onFinish={handleCreateTour}
        >
          <Form.Item label="Tên tour" name="title" rules={[{ required: true, message: "Nhập tên tour" }]}>
            <Input placeholder="Nhập tên tour" />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={3} placeholder="Mô tả tour" />
          </Form.Item>
          <Form.Item label="Lưu ý chuẩn bị" name="preparationTips">
            <Input.TextArea
              rows={2}
              placeholder="Trang phục, đồ dùng cần chuẩn bị"
            />
          </Form.Item>
          <Form.Item label="Mùa đẹp nhất" name="bestSeason">
            <Input placeholder="VD: Tháng 10 - Tháng 3 mùa khô" />
          </Form.Item>
          <Form.Item label="Phương tiện di chuyển" name="transportation">
            <Input placeholder="VD: Xe máy, xe khách từ Pleiku" />
          </Form.Item>
          <Form.Item label="Lưu ý văn hóa" name="culturalTips">
            <Input.TextArea rows={2} placeholder="Ứng xử văn hóa khi tham gia" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Tỉnh thành"
                name="provinceId"
                rules={[{ required: true, message: "Chọn tỉnh thành" }]}
              >
                <Select placeholder="Chọn tỉnh thành">
                  {provinces.map((p) => (
                    <Select.Option key={p.id} value={p.id}>
                      {p.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Giá (VNĐ)"
                name="price"
                rules={[{ required: true, message: "Nhập giá" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="Nhập giá"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Trạng thái" name="status" rules={[{ required: true, message: "Chọn trạng thái" }]}>
            <Select placeholder="Chọn trạng thái">
              <Select.Option value="ACTIVE">Đang hoạt động</Select.Option>
              <Select.Option value="INACTIVE">Không hoạt động</Select.Option>
              <Select.Option value="BANNED">Đã cấm</Select.Option>
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Thời lượng (giờ)"
                name="durationHours"
                rules={[{ required: true, message: "Nhập thời lượng" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={1}
                  placeholder="VD: 8"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Số người tối đa"
                name="maxParticipants"
                rules={[{ required: true, message: "Nhập số người" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={1}
                  placeholder="VD: 10"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="Ảnh đại diện"
            name="thumbnail"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList ?? [])}
          >
            <Upload
              listType="picture-card"
              maxCount={1}
              beforeUpload={() => false}
              accept="image/*"
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Tải ảnh</div>
              </div>
            </Upload>
          </Form.Item>
          <Form.Item
            label="Ảnh tour (nhiều ảnh)"
            name="images"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList ?? [])}
          >
            <Upload
              listType="picture-card"
              multiple
              beforeUpload={() => false}
              accept="image/*"
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Tải ảnh</div>
              </div>
            </Upload>
          </Form.Item>
          <Form.Item label="Mục văn hóa (địa điểm nổi bật)" name="cultureItemIds">
            <Select
              mode="multiple"
              placeholder="Chọn mục văn hóa gắn với tour"
              allowClear
              optionFilterProp="label"
              options={cultureItems.map((c) => ({
                value: c.id,
                label: c.title,
              }))}
            />
          </Form.Item>
          <Form.Item label="Nghệ nhân" name="artisan">
            <Select placeholder="Chọn nghệ nhân (tùy chọn)" allowClear>
              {artisans.map((artisan) => (
                <Select.Option key={artisan.id} value={artisan.id}>
                  {artisan.fullName} - {artisan.specialization}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {selectedTour ? "Cập nhật" : "Tạo"}
              </Button>
              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedTour(null);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
