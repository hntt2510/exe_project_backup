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
} from "antd";
import {
  EyeOutlined,
  SearchOutlined,
  MessageOutlined,
  MailOutlined,
  UserOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  getAdminFeedback,
  getAdminFeedbackById,
  type AdminFeedback,
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

export default function FeedbackManagement() {
  const { message } = App.useApp();
  const [feedbacks, setFeedbacks] = useState<AdminFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState<AdminFeedback | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { page?: number; limit?: number; status?: string; search?: string } = {
        limit: 100,
      };
      if (filterStatus !== "all") params.status = filterStatus;
      if (searchText.trim()) params.search = searchText.trim();
      const { data, total } = await getAdminFeedback(params);
      setFeedbacks(data ?? []);
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
      const msg = getApiErrorMessage(err);
      setError(msg || "Không thể tải danh sách feedback. Vui lòng thử lại sau.");
      setFeedbacks([]);
      message.error(msg || "Không thể tải dữ liệu feedback");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchText, message]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleViewDetail = async (record: AdminFeedback) => {
    setDetailModalOpen(true);
    setDetailData(record);
    setDetailLoading(true);
    try {
      const detail = await getAdminFeedbackById(record.id);
      if (detail) setDetailData(detail);
    } catch (err) {
      console.error("Error fetching feedback detail:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const getDisplayName = (r: AdminFeedback) => r.fullName ?? r.name ?? "—";
  const getDisplayMessage = (r: AdminFeedback) => r.content ?? r.message ?? "—";

  const columns: ColumnsType<AdminFeedback> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
      fixed: "left",
    },
    {
      title: "Người gửi",
      key: "sender",
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{getDisplayName(record)}</div>
          <div style={{ fontSize: 12, color: "#666" }}>{record.email}</div>
        </div>
      ),
    },
    {
      title: "Chủ đề",
      dataIndex: "subject",
      key: "subject",
      width: 180,
      ellipsis: true,
      render: (v) => v || "—",
    },
    {
      title: "Nội dung",
      key: "message",
      ellipsis: true,
      render: (_, record) => {
        const msg = getDisplayMessage(record);
        return (
          <span title={typeof msg === "string" ? msg : ""}>
            {typeof msg === "string" ? (msg.length > 80 ? msg.slice(0, 80) + "…" : msg) : "—"}
          </span>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => {
        const config: Record<string, { color: string; label: string }> = {
          PENDING: { color: "orange", label: "Chờ xử lý" },
          READ: { color: "blue", label: "Đã đọc" },
          RESOLVED: { color: "green", label: "Đã xử lý" },
        };
        const c = config[status ?? ""] ?? { color: "default", label: status || "—" };
        return <Tag color={c.color}>{c.label}</Tag>;
      },
    },
    {
      title: "Ngày gửi",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (v) => formatDateTimeVN(v),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      fixed: "right",
      render: (_, record) => (
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
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Card title={<><MessageOutlined /> Quản lý Feedback</>}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm theo email, tên, nội dung..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={() => fetchFeedbacks()}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: "100%" }}
              placeholder="Trạng thái"
              value={filterStatus}
              onChange={(v) => setFilterStatus(v)}
            >
              <Select.Option value="all">Tất cả</Select.Option>
              <Select.Option value="PENDING">Chờ xử lý</Select.Option>
              <Select.Option value="READ">Đã đọc</Select.Option>
              <Select.Option value="RESOLVED">Đã xử lý</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button type="primary" icon={<SearchOutlined />} onClick={() => fetchFeedbacks()}>
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
              <Button size="small" onClick={() => fetchFeedbacks()}>
                Thử lại
              </Button>
            }
          />
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : feedbacks.length === 0 ? (
          <Empty
            description="Chưa có feedback nào"
            style={{ padding: "48px 0" }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={feedbacks}
            rowKey="id"
            scroll={{ x: 900 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (t) => `Tổng ${t} feedback`,
            }}
          />
        )}
      </Card>

      <Modal
        title="Chi tiết Feedback"
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          setDetailData(null);
        }}
        footer={
          <Button onClick={() => setDetailModalOpen(false)}>Đóng</Button>
        }
        width={600}
      >
        {detailLoading ? (
          <div style={{ textAlign: "center", padding: 24 }}>
            <Spin />
          </div>
        ) : detailData ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label={<><UserOutlined /> Người gửi</>}>
              {getDisplayName(detailData)}
            </Descriptions.Item>
            <Descriptions.Item label={<><MailOutlined /> Email</>}>
              {detailData.email}
            </Descriptions.Item>
            {detailData.phone && (
              <Descriptions.Item label={<><PhoneOutlined /> Số điện thoại</>}>
                {detailData.phone}
              </Descriptions.Item>
            )}
            {detailData.subject && (
              <Descriptions.Item label="Chủ đề">{detailData.subject}</Descriptions.Item>
            )}
            <Descriptions.Item label="Nội dung">
              <div style={{ whiteSpace: "pre-wrap" }}>{getDisplayMessage(detailData)}</div>
            </Descriptions.Item>
            {detailData.status && (
              <Descriptions.Item label="Trạng thái">
                <Tag color={detailData.status === "RESOLVED" ? "green" : detailData.status === "READ" ? "blue" : "orange"}>
                  {detailData.status === "PENDING" ? "Chờ xử lý" : detailData.status === "READ" ? "Đã đọc" : "Đã xử lý"}
                </Tag>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Ngày gửi">
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
