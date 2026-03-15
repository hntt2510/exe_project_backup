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
  DatePicker,
  message,
  Popconfirm,
  Tooltip,
  Alert,
  Spin,
  Typography,
} from "antd";

const { Title, Text } = Typography;
import {
  PlusOutlined,
  EditOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  DollarOutlined,
  AlertOutlined,
  TeamOutlined,
  PercentageOutlined,
  ClockCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import TourSummaryCards from "./TourSummaryCards";
import {
  getPublicTours,
  getArtisans,
  getProvinces,
  clearApiCache,
} from "../../services/api";
import {
  createTour,
  updateTour,
  type CreateTourRequest,
} from "../../services/adminApi";
import type { Artisan, Province } from "../../types";
import type { Tour as ApiTour } from "../../types";

const { RangePicker } = DatePicker;

interface Tour {
  key: string;
  id: string;
  title: string;
  location: string;
  provinceId?: number;
  price: number;
  originalPrice?: number;
  minParticipants: number;
  maxParticipants: number;
  currentParticipants: number;
  status:
    | "OPEN"
    | "NEAR_DEADLINE"
    | "FULL"
    | "NOT_ENOUGH"
    | "CANCELLED"
    | "ACTIVE"
    | "INACTIVE";
  startDate: string;
  endDate: string;
  artisan?: string;
  artisanId?: string;
  daysUntil?: number;
  discount?: number;
  totalBookings?: number;
  averageRating?: number;
  description?: string;
  preparationTips?: string;
  images?: string[];
}

const statusConfig: Record<
  string,
  { label: string; color: string; bgColor?: string }
> = {
  OPEN: { label: "Mở đăng ký", color: "#52c41a", bgColor: "#f6ffed" },
  ACTIVE: { label: "Đang hoạt động", color: "#52c41a", bgColor: "#f6ffed" },
  NEAR_DEADLINE: { label: "Gần hết hạn", color: "#faad14", bgColor: "#fffbe6" },
  FULL: { label: "Đã đầy", color: "#1890ff", bgColor: "#e6f7ff" },
  NOT_ENOUGH: { label: "Không đủ người", color: "#ff4d4f", bgColor: "#fff1f0" },
  CANCELLED: { label: "Đã hủy", color: "#8c8c8c", bgColor: "#fafafa" },
  INACTIVE: { label: "Không hoạt động", color: "#8c8c8c", bgColor: "#fafafa" },
};

export default function TourManagement() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
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
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isArtisanModalOpen, setIsArtisanModalOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [form] = Form.useForm();
  const [discountForm] = Form.useForm();
  const [artisanForm] = Form.useForm();

  const mapApiTourToTour = (apiTour: ApiTour): Tour => {
    const minParticipants = Math.floor(apiTour.maxParticipants * 0.5);
    const currentParticipants = apiTour.totalBookings || 0;
    let status: Tour["status"] = "OPEN";
    if (apiTour.status) {
      const apiStatus = apiTour.status.toUpperCase();
      if (apiStatus === "ACTIVE" || apiStatus === "OPEN")
        status = apiStatus === "ACTIVE" ? "ACTIVE" : "OPEN";
      else if (apiStatus === "INACTIVE" || apiStatus === "CANCELLED")
        status = apiStatus === "INACTIVE" ? "INACTIVE" : "CANCELLED";
      else if (["NEAR_DEADLINE", "FULL", "NOT_ENOUGH"].includes(apiStatus))
        status = apiStatus as Tour["status"];
    }
    const createdAt = dayjs(apiTour.createdAt);
    return {
      key: String(apiTour.id),
      id: String(apiTour.id),
      title: apiTour.title,
      location: apiTour.provinceName || "Tây Nguyên",
      provinceId: apiTour.provinceId,
      price: apiTour.price,
      originalPrice: undefined,
      minParticipants,
      maxParticipants: apiTour.maxParticipants,
      currentParticipants,
      status,
      startDate: createdAt.format("DD/MM/YYYY"),
      endDate: createdAt
        .add(apiTour.durationHours, "hour")
        .format("DD/MM/YYYY"),
      artisan: apiTour.artisanName,
      artisanId: apiTour.artisanId ? String(apiTour.artisanId) : undefined,
      daysUntil: createdAt.diff(dayjs(), "day"),
      totalBookings: apiTour.totalBookings,
      averageRating: apiTour.averageRating,
      description: apiTour.description,
      preparationTips: (apiTour as { preparationTips?: string }).preparationTips,
      images: apiTour.images,
    };
  };

  // Fetch tours from /api/tours/public and artisans from Admin API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      // Fetch tours and artisans separately to handle errors independently
      let publicTours: ApiTour[] = [];
      let artisansData: Artisan[] = [];
      let hasToursError = false;
      let hasArtisansError = false;

      // Fetch tours
      try {
        publicTours = await getPublicTours();
      } catch (toursErr: any) {
        console.error("Error fetching tours:", toursErr);
        hasToursError = true;
        setError("Không thể tải dữ liệu tours. Vui lòng thử lại sau.");
        message.error("Không thể tải dữ liệu tours");
      }

      // Fetch provinces and artisans
      try {
        const [provincesData, artisansFromApi] = await Promise.all([
          getProvinces(),
          getArtisans(),
        ]);
        setProvinces(provincesData ?? []);
        artisansData = artisansFromApi ?? [];
      } catch (artisansErr: any) {
        console.error("Error fetching artisans:", artisansErr);
        hasArtisansError = true;
        // Don't block tours display if artisans fail
        message.warning(
          "Không thể tải danh sách nghệ nhân. Một số chức năng có thể bị hạn chế.",
        );
      }

      // Set artisans (empty array if failed)
      setArtisans(artisansData);

      setTours(publicTours.map(mapApiTourToTour));

      // Update error message if no tours were loaded
      if (hasToursError && publicTours.length === 0) {
        setError("Không thể tải dữ liệu tours. Vui lòng thử lại sau.");
      } else if (!hasToursError && publicTours.length === 0) {
        setError("Không có dữ liệu tours để hiển thị.");
      } else if (!hasToursError) {
        setError(null); // Clear error if tours loaded successfully
      }

      setLoading(false);
    };

    fetchData();
  }, []);

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
    return Math.round((tour.currentParticipants / tour.minParticipants) * 100);
  };

  const getDaysUntil = (dateString: string) => {
    const [day, month, year] = dateString.split("/");
    const tourDate = dayjs(`${year}-${month}-${day}`);
    return tourDate.diff(dayjs(), "day");
  };

  const handleApplyDiscount = (tourId: string, discountPercent: number) => {
    setTours(
      tours.map((tour) => {
        if (tour.id === tourId) {
          const originalPrice = tour.originalPrice || tour.price;
          const newPrice = Math.round(
            originalPrice * (1 - discountPercent / 100),
          );
          return {
            ...tour,
            price: newPrice,
            originalPrice: originalPrice,
            discount: discountPercent,
          };
        }
        return tour;
      }),
    );
    message.success(`Đã áp dụng giảm giá ${discountPercent}%`);
    setIsDiscountModalOpen(false);
  };

  const handleAssignArtisan = async (tourId: string, artisanId: string) => {
    try {
      await updateTour(Number(tourId), { artisanId: Number(artisanId) });
      message.success("Đã gắn nghệ nhân vào tour");
      clearApiCache();
      const publicTours = await getPublicTours();
      setTours(publicTours.map(mapApiTourToTour));
      setIsArtisanModalOpen(false);
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Gắn nghệ nhân thất bại");
    }
  };

  const handleCancelTour = async (tourId: string) => {
    try {
      await updateTour(Number(tourId), { status: "CANCELLED" });
      message.warning("Tour đã được hủy");
      clearApiCache();
      const publicTours = await getPublicTours();
      setTours(publicTours.map(mapApiTourToTour));
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Hủy tour thất bại");
    }
  };

  const refetchTours = async () => {
    clearApiCache();
    const publicTours = await getPublicTours();
    setTours(publicTours.map(mapApiTourToTour));
  };

  const handleCreateTour = async (values: any) => {
    try {
      const startDate = values.dateRange?.[0] as Dayjs | undefined;
      const endDate = values.dateRange?.[1] as Dayjs | undefined;
      const durationHours =
        startDate && endDate ? endDate.diff(startDate, "hour") || 1 : 1;
      const imagesRaw = values.images ?? [];
      const imagesPayload =
        typeof imagesRaw === "string"
          ? imagesRaw
          : Array.isArray(imagesRaw)
            ? imagesRaw.length > 0
              ? JSON.stringify(imagesRaw)
              : ""
            : "";
      const payload: CreateTourRequest = {
        title: values.title,
        description: values.description || "",
        provinceId: values.provinceId,
        price: values.price,
        maxParticipants: values.maxParticipants,
        durationHours,
        thumbnailUrl: values.thumbnailUrl || "",
        images: imagesPayload,
        ...(values.artisan && { artisanId: Number(values.artisan) }),
        ...(values.preparationTips && { preparationTips: values.preparationTips }),
      };
      if (selectedTour) {
        await updateTour(Number(selectedTour.id), payload);
        message.success("Đã cập nhật tour");
      } else {
        await createTour(payload);
        message.success("Đã tạo tour thành công");
      }
      setIsModalOpen(false);
      setSelectedTour(null);
      form.resetFields();
      await refetchTours();
    } catch (err: any) {
      message.error(
        err?.response?.data?.message ||
          (selectedTour ? "Cập nhật thất bại" : "Tạo tour thất bại"),
      );
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
      render: (_, record) => {
        const daysLeft = getDaysUntil(record.startDate);
        return (
          <div>
            <div>
              <CalendarOutlined /> {record.startDate} - {record.endDate}
            </div>
            {daysLeft !== undefined && (
              <div
                style={{
                  fontSize: 12,
                  color:
                    daysLeft <= 3
                      ? "#ff4d4f"
                      : daysLeft <= 7
                        ? "#faad14"
                        : "#52c41a",
                  marginTop: 4,
                }}
              >
                <ClockCircleOutlined /> Còn {daysLeft} ngày
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Giá",
      key: "price",
      width: 150,
      render: (_, record) => (
        <div>
          {record.originalPrice && (
            <div
              style={{
                fontSize: 12,
                color: "#8c8c8c",
                textDecoration: "line-through",
              }}
            >
              {record.originalPrice.toLocaleString("vi-VN")}đ
            </div>
          )}
          <DollarOutlined style={{ color: "#8B0000" }} />{" "}
          <strong style={{ color: "#8B0000", fontSize: 16 }}>
            {record.price.toLocaleString("vi-VN")}đ
          </strong>
          <div style={{ fontSize: 12, color: "#8c8c8c" }}>/ người</div>
          {record.discount && (
            <Tag
              color="#ff4d4f"
              style={{
                marginTop: 4,
                backgroundColor: "#fff1f0",
                borderColor: "#ff4d4f",
                color: "#ff4d4f",
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              -{record.discount}%
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Đăng ký",
      key: "participants",
      width: 180,
      render: (_, record) => {
        const progress = getProgress(record);
        const remaining = record.minParticipants - record.currentParticipants;
        const daysLeft = getDaysUntil(record.startDate);
        const totalBookings = record.totalBookings || 0;
        return (
          <div>
            <div style={{ marginBottom: 8 }}>
              <strong>{record.currentParticipants}</strong> /{" "}
              {record.minParticipants}
              {totalBookings > 0 && (
                <div style={{ fontSize: 11, color: "#8c8c8c", marginTop: 2 }}>
                  Tổng booking: {totalBookings}
                </div>
              )}
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
              trailColor="#f0f0f0"
            />
            {remaining > 0 && (
              <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 4 }}>
                Còn {remaining} chỗ
              </div>
            )}
            {daysLeft !== undefined && daysLeft <= 7 && remaining > 0 && (
              <Alert
                message={
                  daysLeft <= 3
                    ? `⚠️ Còn ${remaining} chỗ - ${daysLeft} ngày`
                    : `🔥 Giảm giá - Còn ${remaining} chỗ`
                }
                type={daysLeft <= 3 ? "error" : "warning"}
                showIcon
                style={{ marginTop: 8, fontSize: 11 }}
              />
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
        const config = statusConfig[status];
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
        const daysLeft = getDaysUntil(record.startDate);
        const remaining = record.minParticipants - record.currentParticipants;
        return (
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <Button
              type="link"
              icon={<EditOutlined />}
              size="small"
              onClick={() => {
                setSelectedTour(record);
                form.setFieldsValue({
                  title: record.title,
                  provinceId: record.provinceId,
                  price: record.price,
                  minParticipants: record.minParticipants,
                  maxParticipants: record.maxParticipants,
                  description: record.description,
                  artisan: record.artisanId,
                  dateRange: [
                    dayjs(record.startDate, "DD/MM/YYYY"),
                    dayjs(record.endDate, "DD/MM/YYYY"),
                  ],
                });
                setIsModalOpen(true);
              }}
            >
              Sửa
            </Button>
            <Button
              type="link"
              icon={<UserOutlined />}
              size="small"
              onClick={() => {
                setSelectedTour(record);
                artisanForm.setFieldsValue({ artisan: record.artisanId });
                setIsArtisanModalOpen(true);
              }}
            >
              Gắn nghệ nhân
            </Button>
            {record.status === "NOT_ENOUGH" && remaining > 0 && (
              <>
                {daysLeft !== undefined && daysLeft > 7 && (
                  <Button
                    type="link"
                    icon={<PercentageOutlined />}
                    size="small"
                    style={{ color: "#8B0000" }}
                    onClick={() => {
                      setSelectedTour(record);
                      discountForm.setFieldsValue({ discount: 10 });
                      setIsDiscountModalOpen(true);
                    }}
                  >
                    Giảm giá
                  </Button>
                )}
                {daysLeft !== undefined && daysLeft <= 7 && (
                  <Tooltip title="Tour sắp khởi hành - Cần xử lý ngay">
                    <Button
                      type="link"
                      icon={<PercentageOutlined />}
                      size="small"
                      danger
                      onClick={() => {
                        setSelectedTour(record);
                        discountForm.setFieldsValue({ discount: 20 });
                        setIsDiscountModalOpen(true);
                      }}
                    >
                      Giảm giá gấp
                    </Button>
                  </Tooltip>
                )}
                <Popconfirm
                  title="Xác nhận hủy tour"
                  description="Bạn có chắc chắn muốn hủy tour này? Tất cả booking sẽ bị hủy."
                  onConfirm={() => handleCancelTour(record.id)}
                  okText="Xác nhận"
                  cancelText="Hủy"
                >
                  <Button
                    type="link"
                    danger
                    icon={<AlertOutlined />}
                    size="small"
                  >
                    Hủy tour
                  </Button>
                </Popconfirm>
              </>
            )}
            {record.status === "OPEN" && (
              <Popconfirm
                title="Xác nhận hủy tour"
                description="Bạn có chắc chắn muốn hủy tour này?"
                onConfirm={() => handleCancelTour(record.id)}
                okText="Xác nhận"
                cancelText="Hủy"
              >
                <Button type="link" danger size="small">
                  Hủy tour
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  const stats = {
    total: tours.length,
    open: tours.filter((t) => t.status === "OPEN").length,
    notEnough: tours.filter((t) => t.status === "NOT_ENOUGH").length,
    nearDeadline: tours.filter((t) => {
      const days = getDaysUntil(t.startDate);
      return days !== undefined && days <= 7 && days > 0;
    }).length,
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
          <Text type="secondary" style={{ fontSize: 16 }}>
            Quản lý tour và trạng thái tour
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setSelectedTour(null);
            form.resetFields();
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
        bodyStyle={{ padding: 24 }}
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
              <Select.Option value="OPEN">Mở đăng ký</Select.Option>
              <Select.Option value="NEAR_DEADLINE">Gần hết hạn</Select.Option>
              <Select.Option value="FULL">Đã đầy</Select.Option>
              <Select.Option value="NOT_ENOUGH">Không đủ người</Select.Option>
              <Select.Option value="CANCELLED">Đã hủy</Select.Option>
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
          initialValues={
            selectedTour
              ? {
                  title: selectedTour.title,
                  provinceId: selectedTour.provinceId,
                  price: selectedTour.price,
                  minParticipants: selectedTour.minParticipants,
                  maxParticipants: selectedTour.maxParticipants,
                  description: selectedTour.description,
                  preparationTips: selectedTour.preparationTips,
                  artisan: selectedTour.artisanId,
                  dateRange: [
                    dayjs(selectedTour.startDate, "DD/MM/YYYY"),
                    dayjs(selectedTour.endDate, "DD/MM/YYYY"),
                  ],
                }
              : {}
          }
          onFinish={handleCreateTour}
        >
          <Form.Item label="Tên tour" name="title" rules={[{ required: true }]}>
            <Input placeholder="Nhập tên tour" />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={2} placeholder="Mô tả tour (tùy chọn)" />
          </Form.Item>
          <Form.Item label="Lưu ý chuẩn bị" name="preparationTips">
            <Input.TextArea
              rows={2}
              placeholder="Trang phục, đồ dùng cần chuẩn bị (tùy chọn)"
            />
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
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="Nhập giá"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Số người tối thiểu"
                name="minParticipants"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={1}
                  placeholder="Min"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Số người tối đa"
                name="maxParticipants"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={1}
                  placeholder="Max"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="Thời gian"
            name="dateRange"
            rules={[{ required: true }]}
          >
            <RangePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Nghệ nhân" name="artisan">
            <Select placeholder="Chọn nghệ nhân">
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

      {/* Modal Giảm giá */}
      <Modal
        title="Áp dụng giảm giá"
        open={isDiscountModalOpen}
        onCancel={() => {
          setIsDiscountModalOpen(false);
          setSelectedTour(null);
        }}
        footer={null}
        width={500}
      >
        {selectedTour && (
          <Form
            form={discountForm}
            layout="vertical"
            onFinish={(values) =>
              handleApplyDiscount(selectedTour.id, values.discount)
            }
          >
            <Alert
              message="Thông tin tour"
              description={
                <div>
                  <div>
                    <strong>Tour:</strong> {selectedTour.title}
                  </div>
                  <div>
                    <strong>Giá hiện tại:</strong>{" "}
                    {selectedTour.price.toLocaleString("vi-VN")}đ
                  </div>
                  <div>
                    <strong>Còn thiếu:</strong>{" "}
                    {selectedTour.minParticipants -
                      selectedTour.currentParticipants}{" "}
                    người
                  </div>
                </div>
              }
              type="info"
              style={{ marginBottom: 16 }}
            />
            <Form.Item
              label="Phần trăm giảm giá"
              name="discount"
              rules={[{ required: true, min: 1, max: 50 }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={1}
                max={50}
                addonAfter="%"
                placeholder="Nhập % giảm giá"
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Áp dụng
                </Button>
                <Button onClick={() => setIsDiscountModalOpen(false)}>
                  Hủy
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Modal Gắn nghệ nhân */}
      <Modal
        title="Gắn nghệ nhân vào tour"
        open={isArtisanModalOpen}
        onCancel={() => {
          setIsArtisanModalOpen(false);
          setSelectedTour(null);
        }}
        footer={null}
        width={500}
      >
        {selectedTour && (
          <Form
            form={artisanForm}
            layout="vertical"
            onFinish={(values) =>
              handleAssignArtisan(selectedTour.id, values.artisan)
            }
          >
            <Form.Item label="Tour" name="tour">
              <Input value={selectedTour.title} disabled />
            </Form.Item>
            <Form.Item
              label="Nghệ nhân"
              name="artisan"
              rules={[{ required: true }]}
            >
              <Select placeholder="Chọn nghệ nhân">
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
                  Gắn nghệ nhân
                </Button>
                <Button onClick={() => setIsArtisanModalOpen(false)}>
                  Hủy
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}
