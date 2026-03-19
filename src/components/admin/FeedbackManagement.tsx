import { useState, useEffect, useCallback } from "react";
import {
  App,
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Descriptions,
  Row,
  Col,
  Select,
  Input,
  Empty,
  Spin,
  Alert,
  Avatar,
  Image,
  Popconfirm,
} from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  MessageOutlined,
  StarOutlined,
  UserOutlined,
  EnvironmentOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  getAdminReviews,
  getAdminReviewsByTourId,
  getAdminReviewById,
  deleteAdminReview,
  getAdminTours,
  type AdminReview,
} from "../../services/adminApi";
import { getApiErrorMessage } from "../../services/api";

function formatDateTimeVN(isoString: string | null | undefined): string {
  if (!isoString) return "-";
  try {
    return dayjs(isoString).format("DD/MM/YYYY HH:mm");
  } catch {
    return "-";
  }
}

function renderStars(rating: number) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <StarOutlined
        key={i}
        style={{
          color: i <= rating ? "#faad14" : "#d9d9d9",
          marginRight: 2,
        }}
      />,
    );
  }
  return <span>{stars}</span>;
}

export default function FeedbackManagement() {
  const { message } = App.useApp();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTourId, setFilterTourId] = useState<number | null>(null);
  const [tours, setTours] = useState<{ id: number; title: string }[]>([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState<AdminReview | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } =
        filterTourId != null
          ? await getAdminReviewsByTourId(filterTourId)
          : await getAdminReviews();
      setReviews(data ?? []);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      const msg = getApiErrorMessage(err);
      setError(
        msg || "Không thể tải danh sách đánh giá. Vui lòng thử lại sau.",
      );
      setReviews([]);
      message.error(msg || "Không thể tải dữ liệu đánh giá");
    } finally {
      setLoading(false);
    }
  }, [message, filterTourId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    getAdminTours({ limit: 500 })
      .then((res) => {
        const list = (res.data ?? []).map((t) => ({
          id: t.id,
          title: t.title,
        }));
        setTours(list);
      })
      .catch(() => {});
  }, []);

  const filteredReviews = reviews.filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      return (
        r.userName?.toLowerCase().includes(q) ||
        r.tourTitle?.toLowerCase().includes(q) ||
        r.comment?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDelete = async (id: number) => {
    try {
      await deleteAdminReview(id);
      message.success("Đã xóa đánh giá");
      fetchReviews();
    } catch (err) {
      message.error(getApiErrorMessage(err) || "Xóa đánh giá thất bại");
    }
  };

  const handleViewDetail = async (record: AdminReview) => {
    setDetailModalOpen(true);
    setDetailData(record);
    setDetailLoading(true);
    try {
      const detail = await getAdminReviewById(record.id);
      if (detail) setDetailData(detail);
    } catch (err) {
      console.error("Error fetching review detail:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const statusConfig: Record<string, { color: string; label: string }> = {
    VISIBLE: { color: "green", label: "Hiển thị" },
    HIDDEN: { color: "default", label: "Ẩn" },
  };

  const columns: ColumnsType<AdminReview> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
      fixed: "left",
    },
    {
      title: "Người đánh giá",
      key: "user",
      width: 180,
      render: (_, record) => (
        <Space>
          <Avatar
            src={record.userAvatar}
            icon={!record.userAvatar && <UserOutlined />}
            style={{ backgroundColor: "#8B0000" }}
          >
            {!record.userAvatar && (record.userName?.charAt(0) || "?")}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{record.userName || "—"}</div>
            <div style={{ fontSize: 12, color: "#666" }}>
              ID: {record.userId}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Tour",
      key: "tour",
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.tourTitle || "—"}</div>
          <div style={{ fontSize: 12, color: "#666" }}>ID: {record.tourId}</div>
        </div>
      ),
    },
    {
      title: "Điểm",
      dataIndex: "rating",
      key: "rating",
      width: 120,
      render: (rating: number) => renderStars(rating ?? 0),
    },
    {
      title: "Nội dung",
      dataIndex: "comment",
      key: "comment",
      ellipsis: true,
      render: (v: string) => (
        <span title={v || ""}>
          {v ? (v.length > 60 ? v.slice(0, 60) + "…" : v) : "—"}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => {
        const c = statusConfig[status ?? ""] ?? {
          color: "default",
          label: status || "—",
        };
        return <Tag color={c.color}>{c.label}</Tag>;
      },
    },
    {
      title: "Ngày đánh giá",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (v) => formatDateTimeVN(v),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 140,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewDetail(record)}
          >
            Xem
          </Button>
          <Popconfirm
            title="Xóa đánh giá"
            description="Bạn có chắc muốn xóa đánh giá này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <Card
        title={
          <>
            <MessageOutlined /> Quản lý Đánh giá Tour (Feedback)
          </>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Tìm theo tên, tour, nội dung..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={() => fetchReviews()}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              style={{ width: "100%" }}
              placeholder="Lọc theo Tour"
              value={filterTourId ?? undefined}
              onChange={(v) => setFilterTourId(v != null ? Number(v) : null)}
              allowClear
            >
              {tours.map((t) => (
                <Select.Option key={t.id} value={t.id}>
                  {t.title}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              style={{ width: "100%" }}
              placeholder="Trạng thái"
              value={filterStatus}
              onChange={(v) => setFilterStatus(v)}
            >
              <Select.Option value="all">Tất cả</Select.Option>
              <Select.Option value="VISIBLE">Hiển thị</Select.Option>
              <Select.Option value="HIDDEN">Ẩn</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={3}>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => fetchReviews()}
            >
              Tìm kiếm
            </Button>
          </Col>
        </Row>

        {error && (
          <Alert
            type="error"
            message={error}
            showIcon
            style={{ marginBottom: 16 }}
            action={
              <Button size="small" onClick={() => fetchReviews()}>
                Thử lại
              </Button>
            }
          />
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : filteredReviews.length === 0 ? (
          <Empty
            description="Chưa có đánh giá nào"
            style={{ padding: "48px 0" }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredReviews}
            rowKey="id"
            scroll={{ x: 1000 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (t) => `Tổng ${t} đánh giá`,
            }}
          />
        )}
      </Card>

      <Modal
        title="Chi tiết Đánh giá"
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          setDetailData(null);
        }}
        footer={<Button onClick={() => setDetailModalOpen(false)}>Đóng</Button>}
        width={600}
      >
        {detailLoading ? (
          <div style={{ textAlign: "center", padding: 24 }}>
            <Spin />
          </div>
        ) : detailData ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item
              label={
                <>
                  <UserOutlined /> Người đánh giá
                </>
              }
            >
              <Space>
                <Avatar
                  src={detailData.userAvatar}
                  icon={!detailData.userAvatar && <UserOutlined />}
                  style={{ backgroundColor: "#8B0000" }}
                >
                  {!detailData.userAvatar &&
                    (detailData.userName?.charAt(0) || "?")}
                </Avatar>
                <span>
                  {detailData.userName || "—"} (ID: {detailData.userId})
                </span>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <>
                  <EnvironmentOutlined /> Tour
                </>
              }
            >
              {detailData.tourTitle || "—"} (ID: {detailData.tourId})
            </Descriptions.Item>
            <Descriptions.Item label="Booking ID">
              {detailData.bookingId}
            </Descriptions.Item>
            <Descriptions.Item label="Điểm đánh giá">
              {renderStars(detailData.rating ?? 0)} ({detailData.rating}/5)
            </Descriptions.Item>
            <Descriptions.Item label="Nội dung">
              <div style={{ whiteSpace: "pre-wrap" }}>
                {detailData.comment || "—"}
              </div>
            </Descriptions.Item>
            {detailData.images && detailData.images.length > 0 && (
              <Descriptions.Item label="Hình ảnh">
                <Image.PreviewGroup>
                  <Space wrap>
                    {detailData.images.map((url, idx) => (
                      <Image
                        key={idx}
                        src={url}
                        alt={`Ảnh ${idx + 1}`}
                        width={80}
                        height={80}
                        style={{ objectFit: "cover", borderRadius: 8 }}
                      />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Trạng thái">
              <Tag
                color={
                  statusConfig[detailData.status ?? ""]?.color ?? "default"
                }
              >
                {statusConfig[detailData.status ?? ""]?.label ??
                  detailData.status ??
                  "—"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày đánh giá">
              {formatDateTimeVN(detailData.createdAt)}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Empty description="Không tìm thấy thông tin" />
        )}
      </Modal>
    </Space>
  );
}
