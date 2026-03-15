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
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  getAdminLeads,
  getAdminLeadById,
  updateAdminLead,
  type AdminLead,
} from "../../services/adminApi";
import { getApiErrorMessage } from "../../services/api";

function formatDateTimeVN(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  try {
    return dayjs(isoString).format("DD/MM/YYYY HH:mm");
  } catch {
    return "—";
  }
}

const statusConfig: Record<string, { color: string; label: string }> = {
  NEW: { color: "blue", label: "Mới" },
  CONTACTED: { color: "cyan", label: "Đã liên hệ" },
  QUALIFIED: { color: "geekblue", label: "Đủ điều kiện" },
  CONVERTED: { color: "green", label: "Đã chốt" },
  LOST: { color: "red", label: "Thất bại" },
};

export default function LeadManagement() {
  const { message } = App.useApp();
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState<AdminLead | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editStatus, setEditStatus] = useState<string>("");
  const [editAdminNote, setEditAdminNote] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, size: 10 });
  const [total, setTotal] = useState(0);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { page?: number; size?: number; status?: string } = {
        page: pagination.page - 1,
        size: pagination.size,
      };
      if (filterStatus !== "all") params.status = filterStatus;
      const { data, total: t } = await getAdminLeads(params);
      setLeads(data ?? []);
      setTotal(t ?? 0);
    } catch (err) {
      console.error("Error fetching leads:", err);
      const msg = getApiErrorMessage(err);
      setError(msg || "Không thể tải danh sách lead. Vui lòng thử lại sau.");
      setLeads([]);
      setTotal(0);
      message.error(msg || "Không thể tải dữ liệu lead");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.size, filterStatus, message]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleViewDetail = async (record: AdminLead) => {
    setDetailModalOpen(true);
    setDetailData(record);
    setEditStatus(record.status ?? "");
    setEditAdminNote(record.adminNote ?? "");
    setDetailLoading(true);
    try {
      const detail = await getAdminLeadById(record.id);
      if (detail) {
        setDetailData(detail);
        setEditStatus(detail.status ?? "");
        setEditAdminNote(detail.adminNote ?? "");
      }
    } catch (err) {
      console.error("Error fetching lead detail:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSaveLead = async () => {
    if (!detailData) return;
    try {
      setSaving(true);
      const updated = await updateAdminLead(detailData.id, {
        status: editStatus || undefined,
        adminNote: editAdminNote || undefined,
      });
      if (updated) {
        setDetailData(updated);
        message.success("Cập nhật thành công");
        fetchLeads();
      }
    } catch (err) {
      const msg = getApiErrorMessage(err);
      message.error(msg || "Không thể cập nhật");
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<AdminLead> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 70,
      fixed: "left",
    },
    {
      title: "Khách hàng",
      key: "customer",
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.name || "—"}</div>
          <div style={{ fontSize: 12, color: "#666" }}>{record.email}</div>
          {record.phone && (
            <div style={{ fontSize: 12, color: "#888" }}>{record.phone}</div>
          )}
        </div>
      ),
    },
    {
      title: "Tour quan tâm",
      dataIndex: "tourTitle",
      key: "tourTitle",
      width: 180,
      ellipsis: true,
      render: (v) => v || "—",
    },
    {
      title: "Nguồn",
      dataIndex: "source",
      key: "source",
      width: 120,
      render: (v) => v || "—",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => {
        const c = statusConfig[status ?? ""] ?? {
          color: "default",
          label: status || "—",
        };
        return <Tag color={c.color}>{c.label}</Tag>;
      },
    },
    {
      title: "Ngày tạo",
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
      <Card title={<><UserOutlined /> Quản lý Lead (Khách hàng tiềm năng)</>}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: "100%" }}
              placeholder="Trạng thái"
              value={filterStatus}
              onChange={(v) => setFilterStatus(v)}
            >
              <Select.Option value="all">Tất cả</Select.Option>
              {Object.entries(statusConfig).map(([k, v]) => (
                <Select.Option key={k} value={k}>
                  {v.label}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button type="primary" onClick={() => fetchLeads()}>
              Làm mới
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
              <Button size="small" onClick={() => fetchLeads()}>
                Thử lại
              </Button>
            }
          />
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : leads.length === 0 ? (
          <Empty
            description="Chưa có lead nào"
            style={{ padding: "48px 0" }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={leads}
            rowKey="id"
            scroll={{ x: 900 }}
            pagination={{
              current: pagination.page,
              pageSize: pagination.size,
              total,
              showSizeChanger: true,
              showTotal: (t) => `Tổng ${t} lead`,
              onChange: (page, size) =>
                setPagination((p) => ({ ...p, page, size: size || p.size })),
            }}
          />
        )}
      </Card>

      <Modal
        title="Chi tiết Lead"
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          setDetailData(null);
        }}
        footer={
          <Space>
            <Button onClick={() => setDetailModalOpen(false)}>Đóng</Button>
            {detailData && (
              <Button type="primary" loading={saving} onClick={handleSaveLead}>
                Lưu thay đổi
              </Button>
            )}
          </Space>
        }
        width={560}
      >
        {detailLoading ? (
          <div style={{ textAlign: "center", padding: 24 }}>
            <Spin />
          </div>
        ) : detailData ? (
          <>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{detailData.id}</Descriptions.Item>
            <Descriptions.Item label={<><UserOutlined /> Họ tên</>}>
              {detailData.name || "—"}
            </Descriptions.Item>
            <Descriptions.Item label={<><MailOutlined /> Email</>}>
              {detailData.email}
            </Descriptions.Item>
            {detailData.phone && (
              <Descriptions.Item label={<><PhoneOutlined /> Số điện thoại</>}>
                {detailData.phone}
              </Descriptions.Item>
            )}
            {detailData.tourTitle && (
              <Descriptions.Item label={<><EnvironmentOutlined /> Tour quan tâm</>}>
                {detailData.tourTitle}
                {detailData.tourId && (
                  <span style={{ color: "#888", marginLeft: 8 }}>(ID: {detailData.tourId})</span>
                )}
              </Descriptions.Item>
            )}
            {detailData.message && (
              <Descriptions.Item label="Tin nhắn">
                <div style={{ whiteSpace: "pre-wrap" }}>{detailData.message}</div>
              </Descriptions.Item>
            )}
            {detailData.source && (
              <Descriptions.Item label="Nguồn">{detailData.source}</Descriptions.Item>
            )}
            <Descriptions.Item label="Trạng thái">
              <Select
                style={{ width: "100%", marginTop: 4 }}
                value={editStatus || undefined}
                onChange={setEditStatus}
                placeholder="Chọn trạng thái"
                options={Object.entries(statusConfig).map(([k, v]) => ({
                  value: k,
                  label: v.label,
                }))}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú admin">
              <Input.TextArea
                rows={3}
                value={editAdminNote}
                onChange={(e) => setEditAdminNote(e.target.value)}
                placeholder="Ghi chú nội bộ..."
                style={{ marginTop: 4 }}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {formatDateTimeVN(detailData.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Cập nhật lần cuối">
              {formatDateTimeVN(detailData.updatedAt)}
            </Descriptions.Item>
          </Descriptions>

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f0f0f0" }}>
            <strong>Cập nhật trạng thái & ghi chú</strong>
            <p style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
              Chỉnh sửa ở trên và bấm &quot;Lưu thay đổi&quot; để cập nhật.
            </p>
          </div>
          </>
        ) : (
          <Empty description="Không tìm thấy thông tin" />
        )}
      </Modal>
    </Space>
  );
}
