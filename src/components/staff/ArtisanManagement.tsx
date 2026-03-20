import { useState, useEffect } from "react";
import {
  App,
  Card,
  Row,
  Col,
  Avatar,
  Tag,
  Button,
  Space,
  Select,
  Input,
  Modal,
  Alert,
  Table,
  Empty,
  Spin,
} from "antd";
import {
  EyeOutlined,
  EnvironmentOutlined,
  TrophyOutlined,
  UserOutlined,
  CalendarOutlined,
  HomeOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import PersonDetailCard from "../admin/PersonDetailCard";
import ArtisanSummaryCards from "../admin/ArtisanSummaryCards";
import {
  getAdminArtisans,
  getAdminArtisanDetail,
  getTourSchedules,
  type AdminTourSchedule,
  type AdminArtisanDetail,
} from "../../services/adminApi";
import { getProvinces } from "../../services/api";
import dayjs from "dayjs";

/** Khớp Admin - field từ API /api/artisans/public */
interface Artisan {
  id: string;
  name: string;
  specialty: string;
  location: string;
  provinceId?: number;
  status: "ACTIVE" | "INACTIVE";
  profileImageUrl?: string;
  bio?: string;
  workshopAddress?: string;
  totalTours?: number;
  averageRating?: number;
  createdAt?: string;
}

export default function ArtisanManagement() {
  const { message } = App.useApp();
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<{
    location: string;
    status: string;
    search: string;
  }>({
    location: "all",
    status: "all",
    search: "",
  });
  const [searchInput, setSearchInput] = useState("");

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedArtisan, setSelectedArtisan] = useState<Artisan | null>(null);
  const [detailData, setDetailData] = useState<AdminArtisanDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [artisanSchedules, setArtisanSchedules] = useState<AdminTourSchedule[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [provinces, setProvinces] = useState<{ id: number; name: string }[]>([]);

  const mapApiToArtisan = (item: unknown): Artisan => {
    const a = item as Record<string, unknown>;
    const province = a.province as { id?: number; name?: string } | undefined;
    const user = a.user as { id?: number; avatarUrl?: string; status?: string } | undefined;
    const provinceName = province?.name ?? (a.provinceName as string) ?? "";
    const provinceId = province?.id ?? (a.provinceId as number);
    const isActive = a.isActive as boolean | undefined;
    const status = isActive === false ? "INACTIVE" : "ACTIVE";
    return {
      id: String(a.id),
      name: (a.fullName as string) ?? (a.name as string) ?? "",
      specialty: (a.specialization as string) ?? (a.specialty as string) ?? "",
      location: provinceName,
      provinceId,
      status: status as "ACTIVE" | "INACTIVE",
      profileImageUrl: (a.profileImageUrl as string) ?? (user?.avatarUrl as string) ?? "",
      bio: a.bio as string,
      workshopAddress: a.workshopAddress as string,
      totalTours: (a.totalTours as number) ?? 0,
      averageRating: (a.averageRating as number) ?? 0,
      createdAt: (a.createdAt as string) ?? "",
    };
  };

  const fetchArtisans = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await getAdminArtisans({ limit: 500 });
      const rawList = (data || []) as unknown[];
      setArtisans(rawList.map(mapApiToArtisan));
    } catch (err) {
      console.error("Error fetching artisans:", err);
      setError("Không thể tải dữ liệu nghệ nhân. Vui lòng thử lại sau.");
      message.error("Không thể tải dữ liệu nghệ nhân");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtisans();
  }, []);

  useEffect(() => {
    getProvinces().then((list) =>
      setProvinces(list.map((p) => ({ id: p.id, name: p.name }))),
    );
  }, []);

  const provinceOptions = [
    ...provinces.map((p) => p.name),
    ...Array.from(new Set(artisans.map((a) => a.location).filter(Boolean))),
  ].filter(Boolean);
  const uniqueProvinces = Array.from(new Set(provinceOptions)).sort();

  const filteredArtisans = artisans.filter((artisan) => {
    if (filter.location !== "all" && artisan.location !== filter.location)
      return false;
    if (filter.status !== "all" && artisan.status !== filter.status)
      return false;
    if (filter.search?.trim()) {
      const q = filter.search.toLowerCase();
      return artisan.name?.toLowerCase().includes(q);
    }
    return true;
  });

  const handleViewDetail = async (record: Artisan) => {
    setSelectedArtisan(record);
    setDetailModalOpen(true);
    setDetailData(null);
    setArtisanSchedules([]);
    const artisanId = Number(record.id);
    if (isNaN(artisanId)) return;
    setDetailLoading(true);
    setScheduleLoading(true);
    try {
      const [detailRes, schedulesRes] = await Promise.all([
        getAdminArtisanDetail(artisanId),
        getTourSchedules({ limit: 500 }),
      ]);
      setDetailData(detailRes);
      const forArtisan = (schedulesRes.data ?? []).filter((s) => {
        const aid = s.tour?.artisan?.id ?? (s.tour as { artisanId?: number })?.artisanId;
        return aid === artisanId;
      });
      forArtisan.sort((a, b) =>
        dayjs(a.tourDate).valueOf() - dayjs(b.tourDate).valueOf()
      );
      setArtisanSchedules(forArtisan);
    } catch (err) {
      console.error("Error fetching artisan detail:", err);
      message.error("Không thể tải chi tiết nghệ nhân");
    } finally {
      setDetailLoading(false);
      setScheduleLoading(false);
    }
  };

  const formatStartTime = (
    st?: { hour?: number; minute?: number } | string
  ): string => {
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
  };

  const scheduleStatusLabel: Record<string, string> = {
    SCHEDULED: "Đã lên lịch",
    CANCELLED: "Đã hủy",
    COMPLETED: "Hoàn thành",
    FULL: "Đã đầy",
  };

  const stats = {
    total: artisans.length,
    active: artisans.filter((a) => a.status === "ACTIVE").length,
    inactive: artisans.filter((a) => a.status === "INACTIVE").length,
    avgRating:
      artisans.length > 0
        ? (
            artisans.reduce((sum, a) => sum + (a.averageRating || 0), 0) /
            artisans.length
          ).toFixed(1)
        : "0.0",
  };

  const columns = [
    {
      title: "Nghệ nhân",
      key: "artisan",
      width: 250,
      fixed: "left" as const,
      render: (_: unknown, record: Artisan) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar
            size={50}
            src={record.profileImageUrl}
            style={{ backgroundColor: "#8B0000", flexShrink: 0 }}
            icon={!record.profileImageUrl ? <UserOutlined /> : undefined}
          />
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#262626", marginBottom: 4 }}>
              {record.name}
            </div>
            <div style={{ fontSize: 12, color: "#8B0000", fontWeight: 500 }}>
              {record.specialty ? `Nghệ nhân ${record.specialty}` : "Nghệ nhân"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Chuyên môn",
      key: "specialty",
      width: 200,
      render: (_: unknown, record: Artisan) => (
        <div>
          <TrophyOutlined style={{ color: "#faad14", marginRight: 6 }} />
          <span style={{ fontWeight: 500 }}>{record.specialty}</span>
        </div>
      ),
    },
    {
      title: "Địa điểm",
      key: "location",
      width: 150,
      render: (_: unknown, record: Artisan) => (
        <div>
          <EnvironmentOutlined style={{ color: "#52c41a", marginRight: 6 }} />
          {record.location}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 130,
      render: (_: unknown, record: Artisan) => (
        <Tag color={record.status === "ACTIVE" ? "success" : "default"}>
          {record.status === "ACTIVE" ? "Hoạt động" : "Không hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      fixed: "right" as const,
      render: (_: unknown, record: Artisan) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleViewDetail(record)}
        >
          Xem
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
              Quản lý Nghệ nhân
            </h2>
            <p style={{ margin: "4px 0 0 0", color: "#8c8c8c", fontSize: 14 }}>
              Xem thông tin nghệ nhân (chỉ xem, không có quyền chỉnh sửa)
            </p>
          </Col>
        </Row>
        <Alert
          message="Lưu ý"
          description="Staff chỉ có quyền xem thông tin nghệ nhân. Không có quyền thêm, sửa hoặc xóa."
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Card>

      <ArtisanSummaryCards stats={stats} />

      <Card
        style={{
          background: "#fff",
          border: "1px solid #e8e8e8",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <div style={{ marginBottom: 4, fontSize: 13, color: "#595959" }}>Địa điểm</div>
            <Select
              style={{ width: "100%" }}
              placeholder="Tất cả địa điểm"
              value={filter.location}
              onChange={(value) => setFilter({ ...filter, location: value })}
            >
              <Select.Option value="all">Tất cả địa điểm</Select.Option>
              {uniqueProvinces.map((province) => (
                <Select.Option key={province} value={province}>
                  {province}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ marginBottom: 4, fontSize: 13, color: "#595959" }}>Trạng thái</div>
            <Select
              style={{ width: "100%" }}
              placeholder="Tất cả trạng thái"
              value={filter.status}
              onChange={(value) => setFilter({ ...filter, status: value })}
            >
              <Select.Option value="all">Tất cả trạng thái</Select.Option>
              <Select.Option value="ACTIVE">Hoạt động</Select.Option>
              <Select.Option value="INACTIVE">Không hoạt động</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div style={{ marginBottom: 4, fontSize: 13, color: "#595959" }}>Tìm kiếm</div>
            <Input
              placeholder="Tìm theo tên nghệ nhân..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onPressEnter={() => setFilter({ ...filter, search: searchInput })}
              allowClear
              onClear={() => setFilter({ ...filter, search: "" })}
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

        {error && (
          <Alert
            message="Lỗi"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {loading ? (
          <Table
            columns={columns}
            dataSource={[]}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={false}
          />
        ) : filteredArtisans.length === 0 ? (
          <Empty
            description="Chưa có nghệ nhân nào."
            style={{ padding: "48px 0" }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredArtisans}
            rowKey="id"
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} nghệ nhân`,
            }}
          />
        )}
      </Card>

      {/* Modal Chi tiết */}
      <Modal
        title="Chi tiết nghệ nhân"
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          setSelectedArtisan(null);
          setDetailData(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setDetailModalOpen(false);
              setSelectedArtisan(null);
              setDetailData(null);
            }}
          >
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {detailLoading ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <Spin tip="Đang tải chi tiết..." />
          </div>
        ) : (detailData || selectedArtisan) && (
          <>
            <PersonDetailCard
              avatarUrl={
                detailData?.profileImageUrl ?? selectedArtisan?.profileImageUrl
              }
              name={detailData?.fullName ?? selectedArtisan?.name ?? ""}
              subtitle={
                detailData?.heroSubtitle
                  ? detailData.heroSubtitle
                  : detailData?.specialization
                    ? `Nghệ nhân ${detailData.specialization}`
                    : selectedArtisan?.specialty
                      ? `Nghệ nhân ${selectedArtisan.specialty}`
                      : "Nghệ nhân"
              }
              status={selectedArtisan?.status}
              infoSections={[
                {
                  rows: [
                    {
                      label: "Chuyên môn",
                      value:
                        detailData?.specialization ??
                        selectedArtisan?.specialty ??
                        "",
                      icon: <TrophyOutlined />,
                    },
                    {
                      label: "Địa điểm",
                      value:
                        detailData?.location ?? selectedArtisan?.location ?? "",
                      icon: <EnvironmentOutlined />,
                    },
                    {
                      label: "Dân tộc",
                      value: detailData?.ethnicity || "—",
                      icon: <UserOutlined />,
                    },
                    {
                      label: "Tuổi",
                      value:
                        detailData?.age != null ? String(detailData.age) : "—",
                      icon: <UserOutlined />,
                    },
                    {
                      label: "Địa chỉ xưởng",
                      value:
                        selectedArtisan?.workshopAddress || "Chưa có",
                      icon: <HomeOutlined />,
                    },
                    {
                      label: "Đánh giá",
                      value: `${(selectedArtisan?.averageRating ?? 0).toFixed(1)}/5 · ${detailData?.relatedTours?.length ?? selectedArtisan?.totalTours ?? 0} tour`,
                      icon: <TrophyOutlined />,
                    },
                  ],
                },
                {
                  title: "Giới thiệu",
                  rows: [
                    {
                      label: "",
                      value:
                        detailData?.bio ?? selectedArtisan?.bio ?? "Chưa có",
                    },
                  ],
                },
                ...(detailData?.relatedTours && detailData.relatedTours.length > 0
                  ? [
                      {
                        title: "Tour liên quan",
                        rows: detailData.relatedTours.slice(0, 5).map((t) => ({
                          label: t.title,
                          value: `${t.location} · ${t.price.toLocaleString("vi-VN")}đ`,
                          icon: <TrophyOutlined />,
                        })),
                      },
                    ]
                  : []),
                ...(detailData?.relatedCultureItems &&
                detailData.relatedCultureItems.length > 0
                  ? [
                      {
                        title: "Văn hoá liên quan",
                        rows: detailData.relatedCultureItems
                          .slice(0, 3)
                          .map((c) => ({
                            label: c.title,
                            value: c.description || "—",
                          })),
                      },
                    ]
                  : []),
              ]}
              extraContent={
                detailData ? (
                  <div style={{ marginTop: 24 }}>
                    {detailData.panoramaImageUrl && (
                      <Card
                        size="small"
                        style={{
                          marginBottom: 20,
                          borderRadius: 12,
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={detailData.panoramaImageUrl}
                          alt="Panorama"
                          style={{
                            width: "100%",
                            maxHeight: 240,
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      </Card>
                    )}
                    {detailData.images && detailData.images.length > 0 && (
                      <Card
                        size="small"
                        style={{ marginBottom: 20, borderRadius: 12 }}
                        styles={{ body: { padding: 16 } }}
                      >
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#8c8c8c",
                            marginBottom: 12,
                            textTransform: "uppercase",
                          }}
                        >
                          Hình ảnh
                        </div>
                        <Row gutter={[8, 8]}>
                          {detailData.images.slice(0, 6).map((url, i) => (
                            <Col xs={12} sm={8} key={i}>
                              <img
                                src={url}
                                alt={`Ảnh ${i + 1}`}
                                style={{
                                  width: "100%",
                                  aspectRatio: 1,
                                  objectFit: "cover",
                                  borderRadius: 8,
                                }}
                              />
                            </Col>
                          ))}
                        </Row>
                      </Card>
                    )}
                    {detailData.narrativeContent &&
                      detailData.narrativeContent.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                          {detailData.narrativeContent.map((item, idx) => (
                            <Card
                              key={idx}
                              size="small"
                              style={{
                                marginBottom: 12,
                                borderRadius: 12,
                              }}
                              styles={{ body: { padding: 20 } }}
                            >
                              {item.title && (
                                <div
                                  style={{
                                    fontSize: 16,
                                    fontWeight: 600,
                                    color: "#1a1a1a",
                                    marginBottom: 8,
                                  }}
                                >
                                  {item.title}
                                </div>
                              )}
                              {item.imageUrl && (
                                <img
                                  src={item.imageUrl}
                                  alt={item.title}
                                  style={{
                                    width: "100%",
                                    maxHeight: 200,
                                    objectFit: "cover",
                                    borderRadius: 8,
                                    marginBottom: 8,
                                  }}
                                />
                              )}
                              <div
                                style={{
                                  fontSize: 14,
                                  color: "#595959",
                                  lineHeight: 1.6,
                                }}
                              >
                                {item.content}
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                  </div>
                ) : undefined
              }
            />
            <Card
              size="small"
              title={
                <span>
                  <CalendarOutlined style={{ marginRight: 8 }} />
                  Lịch làm việc
                </span>
              }
              style={{ marginTop: 20, borderRadius: 12, border: "1px solid #e8e8e8" }}
              styles={{ body: { padding: 16 } }}
            >
              {scheduleLoading ? (
                <div style={{ textAlign: "center", padding: 32 }}>
                  <Spin tip="Đang tải lịch làm việc..." />
                </div>
              ) : artisanSchedules.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#8c8c8c" }}>
                  Chưa có lịch làm việc
                </div>
              ) : (
                <Table
                  dataSource={artisanSchedules}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    {
                      title: "Tour",
                      key: "tour",
                      render: (_, r) => r.tour?.title ?? "-",
                    },
                    {
                      title: "Ngày",
                      dataIndex: "tourDate",
                      key: "tourDate",
                      width: 110,
                      render: (d: string) =>
                        d ? dayjs(d).format("DD/MM/YYYY") : "-",
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
                      width: 90,
                      render: (_, r) =>
                        `${r.bookedSlots ?? 0}/${r.maxSlots ?? 0}`,
                    },
                    {
                      title: "Trạng thái",
                      dataIndex: "status",
                      key: "status",
                      width: 110,
                      render: (s: string) => (
                        <Tag
                          color={
                            s === "SCHEDULED"
                              ? "blue"
                              : s === "COMPLETED"
                                ? "green"
                                : s === "CANCELLED"
                                  ? "red"
                                  : "default"
                          }
                        >
                          {scheduleStatusLabel[s] ?? s}
                        </Tag>
                      ),
                    },
                  ]}
                />
              )}
            </Card>
          </>
        )}
      </Modal>
    </Space>
  );
}
