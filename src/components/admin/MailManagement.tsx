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
  Input,
  Select,
  DatePicker,
  Empty,
  Spin,
  Alert,
} from "antd";
import { EyeOutlined, MailOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  getAdminMails,
  getAdminMailById,
  type AdminMail,
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

export default function MailManagement() {
  const { message } = App.useApp();
  const [mails, setMails] = useState<AdminMail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState<AdminMail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 0, size: 10 });
  const [filterRecipient, setFilterRecipient] = useState("");
  const [filterTemplateType, setFilterTemplateType] = useState<string>("all");
  const [filterOpened, setFilterOpened] = useState<string>("all");
  const [filterFrom, setFilterFrom] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");

  const fetchMails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const openedParam =
        filterOpened === "all" ? undefined : filterOpened === "true";
      const { data, total: t } = await getAdminMails({
        page: pagination.page,
        size: pagination.size,
        recipient: filterRecipient || undefined,
        templateType:
          filterTemplateType !== "all" ? filterTemplateType : undefined,
        opened: openedParam,
        from: filterFrom || undefined,
        to: filterTo || undefined,
      });
      setMails(data ?? []);
      setTotal(t ?? 0);
    } catch (err) {
      console.error("Error fetching mails:", err);
      const msg = getApiErrorMessage(err);
      setError(msg || "Không thể tải danh sách email. Vui lòng thử lại sau.");
      setMails([]);
      setTotal(0);
      message.error(msg || "Không thể tải dữ liệu email");
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.size,
    filterRecipient,
    filterTemplateType,
    filterOpened,
    filterFrom,
    filterTo,
    message,
  ]);

  useEffect(() => {
    fetchMails();
  }, [fetchMails]);

  const handleViewDetail = async (record: AdminMail) => {
    setDetailModalOpen(true);
    setDetailData(record);
    setDetailLoading(true);
    try {
      const detail = await getAdminMailById(record.id);
      if (detail) setDetailData(detail);
    } catch (err) {
      console.error("Error fetching mail detail:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const columns: ColumnsType<AdminMail> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Người nhận",
      dataIndex: "recipientEmail",
      key: "recipientEmail",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Tiêu đề",
      dataIndex: "subject",
      key: "subject",
      ellipsis: true,
      render: (v: string) => v || "—",
    },
    {
      title: "Loại template",
      dataIndex: "templateType",
      key: "templateType",
      width: 160,
      render: (v: string) => v || "—",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => <Tag>{status || "—"}</Tag>,
    },
    {
      title: "Đã mở",
      dataIndex: "opened",
      key: "opened",
      width: 90,
      render: (opened: boolean | undefined, record) => {
        const isOpened =
          opened ?? (record.openedAt != null && record.openedAt !== "");
        return (
          <Tag color={isOpened ? "green" : "default"}>
            {isOpened ? "Có" : "Chưa"}
            {record.openedCount != null && record.openedCount > 0 && (
              <span style={{ marginLeft: 4 }}>({record.openedCount})</span>
            )}
          </Tag>
        );
      },
    },
    {
      title: "Gửi lúc",
      dataIndex: "sentAt",
      key: "sentAt",
      width: 140,
      render: (v) => formatDateTimeVN(v),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 90,
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

  /** 3 loại template: Nhắc lịch, Xin feedback, Xác nhận booking */
  const templateOptions = [
    { value: "all", label: "Tất cả loại" },
    { value: "PRE_DEPARTURE_REMINDER", label: "Nhắc lịch" },
    { value: "POST_TOUR_FEEDBACK", label: "Xin feedback" },
    { value: "BOOKING_CONFIRMATION", label: "Xác nhận booking" },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Card
        title={
          <>
            <MailOutlined /> Quản lý Email đã gửi
          </>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Email người nhận"
              value={filterRecipient}
              onChange={(e) => setFilterRecipient(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              style={{ width: "100%" }}
              placeholder="Loại template"
              value={filterTemplateType}
              onChange={setFilterTemplateType}
              options={templateOptions}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              style={{ width: "100%" }}
              placeholder="Đã mở"
              value={filterOpened}
              onChange={setFilterOpened}
              options={[
                { value: "all", label: "Tất cả" },
                { value: "true", label: "Đã mở" },
                { value: "false", label: "Chưa mở" },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <DatePicker
              style={{ width: "100%" }}
              placeholder="Từ ngày"
              format="DD/MM/YYYY"
              onChange={(date) =>
                setFilterFrom(date ? date.format("YYYY-MM-DD") : "")
              }
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <DatePicker
              style={{ width: "100%" }}
              placeholder="Đến ngày"
              format="DD/MM/YYYY"
              onChange={(date) =>
                setFilterTo(date ? date.format("YYYY-MM-DD") : "")
              }
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button type="primary" onClick={() => fetchMails()}>
              Tìm kiếm
            </Button>
          </Col>
        </Row>

        {error && (
          <Alert
            type="error"
            title={error}
            showIcon
            style={{ marginBottom: 16 }}
            action={
              <Button size="small" onClick={() => fetchMails()}>
                Thử lại
              </Button>
            }
          />
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : mails.length === 0 ? (
          <Empty
            description="Chưa có email nào đã gửi"
            style={{ padding: "48px 0" }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={mails}
            rowKey="id"
            scroll={{ x: 900 }}
            pagination={{
              current: pagination.page + 1,
              pageSize: pagination.size,
              total,
              showSizeChanger: true,
              showTotal: (t) => `Tổng ${t} email`,
              onChange: (page, size) => {
                setPagination((p) => ({
                  page: (page ?? 1) - 1,
                  size: size ?? p.size,
                }));
              },
            }}
          />
        )}
      </Card>

      <Modal
        title="Chi tiết Email log"
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          setDetailData(null);
        }}
        footer={<Button onClick={() => setDetailModalOpen(false)}>Đóng</Button>}
        width={560}
      >
        {detailLoading ? (
          <div style={{ textAlign: "center", padding: 24 }}>
            <Spin />
          </div>
        ) : detailData ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{detailData.id}</Descriptions.Item>
            <Descriptions.Item label="Người nhận">
              {detailData.recipientEmail}
            </Descriptions.Item>
            <Descriptions.Item label="Tiêu đề">
              {detailData.subject ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Loại template">
              {detailData.templateType ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {detailData.status}
            </Descriptions.Item>
            <Descriptions.Item label="Đã mở">
              {detailData.opened ? "Có" : "Chưa"}
              {detailData.openedCount != null &&
                ` (${detailData.openedCount} lần)`}
            </Descriptions.Item>
            {detailData.relatedType && (
              <Descriptions.Item label="Liên quan">
                {detailData.relatedType}
                {detailData.relatedId != null && ` #${detailData.relatedId}`}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Gửi lúc">
              {formatDateTimeVN(detailData.sentAt)}
            </Descriptions.Item>
            {detailData.openedAt && (
              <Descriptions.Item label="Mở lúc">
                {formatDateTimeVN(detailData.openedAt)}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Tạo lúc">
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
