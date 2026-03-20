import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Row,
  Col,
  Modal,
  Descriptions,
  Spin,
  Image,
  Alert,
  Typography,
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { getProvinces } from "../../services/api";
import {
  getAdminCultureItems,
  getAdminCultureItemById,
  type AdminCultureItem,
  type CultureCategory,
} from "../../services/adminApi";
import Breadcrumbs from "../Breadcrumbs";
import ContentSummaryCards from "../admin/ContentSummaryCards";

const { Search } = Input;
const { Title, Text } = Typography;

const categoryLabels: Record<CultureCategory, string> = {
  FESTIVAL: "Lễ hội",
  FOOD: "Ẩm thực",
  COSTUME: "Trang phục",
  INSTRUMENT: "Nhạc cụ",
  DANCE: "Múa",
  LEGEND: "Truyền thuyết",
  CRAFT: "Thủ công",
};

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Bản nháp", color: "default" },
  PUBLISHED: { label: "Đã xuất bản", color: "success" },
  ARCHIVED: { label: "Đã lưu trữ", color: "error" },
};

function formatDate(str: string | undefined): string {
  if (!str) return "-";
  try {
    const d = new Date(str);
    return d.toLocaleDateString("vi-VN");
  } catch {
    return str;
  }
}

export default function ContentManagement() {
  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState<AdminCultureItem[]>([]);
  const [provinces, setProvinces] = useState<{ id: number; name: string }[]>([]);
  const [filter, setFilter] = useState<{
    category: string;
    status: string;
    provinceId: string;
    search: string;
  }>({
    category: "all",
    status: "all",
    provinceId: "all",
    search: "",
  });

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState<AdminCultureItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [provincesRes, itemsRes] = await Promise.all([
        getProvinces(),
        getAdminCultureItems({
          provinceId:
            filter.provinceId !== "all"
              ? Number(filter.provinceId)
              : undefined,
          category:
            filter.category !== "all"
              ? (filter.category as CultureCategory)
              : undefined,
        }),
      ]);
      setProvinces(provincesRes.map((p) => ({ id: p.id, name: p.name })));
      setContents(itemsRes.data);
    } catch (err) {
      setContents([]);
    } finally {
      setLoading(false);
    }
  }, [filter.provinceId, filter.category]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const contentStats = {
    total: contents.length,
    draft: contents.filter((c) => c.status === "DRAFT").length,
    published: contents.filter((c) => c.status === "PUBLISHED").length,
    archived: contents.filter((c) => c.status === "ARCHIVED").length,
  };

  const filteredContents = contents.filter((item) => {
    if (filter.status !== "all" && item.status !== filter.status) return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      if (
        !item.title?.toLowerCase().includes(q) &&
        !item.description?.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const handleViewDetail = async (id: number) => {
    setDetailModalOpen(true);
    setDetailData(null);
    setDetailLoading(true);
    try {
      const data = await getAdminCultureItemById(id);
      setDetailData(data);
    } catch (err) {
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const columns: ColumnsType<AdminCultureItem> = [
    {
      title: "Ảnh",
      dataIndex: "thumbnailUrl",
      key: "thumbnailUrl",
      width: 70,
      render: (url) =>
        url ? (
          <Image
            src={url}
            alt=""
            width={48}
            height={48}
            style={{ objectFit: "cover", borderRadius: 8 }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              background: "#f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "#999",
              borderRadius: 8,
            }}
          >
            —
          </div>
        ),
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Loại",
      dataIndex: "category",
      key: "category",
      render: (cat: CultureCategory) => (
        <Tag color="blue">{categoryLabels[cat] ?? cat}</Tag>
      ),
    },
    {
      title: "Tỉnh",
      dataIndex: ["province", "name"],
      key: "province",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const config =
          statusConfig[status] ?? { label: status, color: "default" };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v) => formatDate(v),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleViewDetail(record.id)}
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
          { label: "Quản lý Nội dung" },
        ]}
      />

      <div>
        <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1a1a1a" }}>
          Quản lý Nội dung Văn hóa
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Xem nội dung văn hóa (lễ hội, ẩm thực, trang phục...)
        </Text>
        <Alert
          message="Lưu ý"
          description="Staff chỉ có quyền xem nội dung. Không có quyền tạo, sửa, xuất bản hoặc xóa. Vui lòng liên hệ Admin để thay đổi."
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </div>

      <ContentSummaryCards stats={contentStats} />

      <Card
        style={{
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: "100%" }}
              placeholder="Loại nội dung"
              value={filter.category}
              onChange={(value) => setFilter({ ...filter, category: value })}
            >
              <Select.Option value="all">Tất cả</Select.Option>
              {(Object.keys(categoryLabels) as CultureCategory[]).map((k) => (
                <Select.Option key={k} value={k}>
                  {categoryLabels[k]}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: "100%" }}
              placeholder="Trạng thái"
              value={filter.status}
              onChange={(value) => setFilter({ ...filter, status: value })}
            >
              <Select.Option value="all">Tất cả</Select.Option>
              <Select.Option value="DRAFT">Bản nháp</Select.Option>
              <Select.Option value="PUBLISHED">Đã xuất bản</Select.Option>
              <Select.Option value="ARCHIVED">Đã lưu trữ</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: "100%" }}
              placeholder="Tỉnh thành"
              value={filter.provinceId}
              onChange={(value) => setFilter({ ...filter, provinceId: value })}
            >
              <Select.Option value="all">Tất cả</Select.Option>
              {provinces.map((p) => (
                <Select.Option key={p.id} value={String(p.id)}>
                  {p.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Search
              placeholder="Tìm kiếm..."
              allowClear
              onSearch={(value) => setFilter({ ...filter, search: value })}
            />
          </Col>
        </Row>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredContents.map((c) => ({ ...c, key: c.id }))}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} mục`,
            }}
            locale={{ emptyText: "Chưa có nội dung" }}
          />
        </Spin>
      </Card>

      <Modal
        title="Chi tiết nội dung"
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          setDetailData(null);
        }}
        footer={null}
        width={640}
      >
        {detailLoading ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <Spin tip="Đang tải..." />
          </div>
        ) : detailData ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Tiêu đề">
              <strong>{detailData.title}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Loại">
              <Tag color="blue">
                {categoryLabels[detailData.category] ?? detailData.category}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Tỉnh thành">
              {detailData.province?.name ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag
                color={
                  statusConfig[detailData.status]?.color ?? "default"
                }
              >
                {statusConfig[detailData.status]?.label ?? detailData.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả">
              {detailData.description || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {formatDate(detailData.createdAt)}
            </Descriptions.Item>
            {detailData.thumbnailUrl && (
              <Descriptions.Item label="Ảnh đại diện">
                <Image
                  src={detailData.thumbnailUrl}
                  alt=""
                  width={200}
                  style={{ borderRadius: 8 }}
                />
              </Descriptions.Item>
            )}
            {detailData.videoUrl && (
              <Descriptions.Item label="Video">
                <a
                  href={detailData.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Xem video
                </a>
              </Descriptions.Item>
            )}
          </Descriptions>
        ) : null}
      </Modal>
    </Space>
  );
}
