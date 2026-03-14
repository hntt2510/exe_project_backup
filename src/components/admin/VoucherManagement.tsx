import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Descriptions,
  App,
  Spin,
  Alert,
  Typography,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  GiftOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import VoucherSummaryCards, {
  type VoucherSummaryStats,
} from "./VoucherSummaryCards";
import {
  getAdminVouchers,
  getAdminVoucherById,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  type AdminVoucher,
  type CreateVoucherRequest,
  type VoucherDiscountType,
} from "../../services/adminApi";
import { getApiErrorMessage } from "../../services/api";

const { Title, Text } = Typography;

const DISCOUNT_TYPE_OPTIONS: { value: VoucherDiscountType; label: string }[] = [
  { value: "PERCENTAGE", label: "Giảm theo %" },
  { value: "FIXED_AMOUNT", label: "Giảm số tiền cố định" },
];

function formatVnd(value: number): string {
  return `${value.toLocaleString("vi-VN")} ₫`;
}

function formatDiscount(v: AdminVoucher): string {
  if (String(v.discountType).toUpperCase() === "PERCENTAGE") {
    return `${v.discountValue}%`;
  }
  return formatVnd(v.discountValue);
}

export default function VoucherManagement() {
  const { message } = App.useApp();
  const [vouchers, setVouchers] = useState<AdminVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<VoucherSummaryStats>({
    total: 0,
    active: 0,
    inactive: 0,
    totalUsage: 0,
  });

  const [searchText, setSearchText] = useState("");
  const [filterActive, setFilterActive] = useState<string>("all");

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<AdminVoucher | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formEditId, setFormEditId] = useState<number | null>(null);
  const [formEditRecord, setFormEditRecord] = useState<AdminVoucher | null>(
    null,
  );
  const [form] = Form.useForm<CreateVoucherRequest & { isActive?: boolean }>();
  const [formSaving, setFormSaving] = useState(false);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { isActive?: boolean; search?: string } = {};
      if (filterActive !== "all") {
        params.isActive = filterActive === "active";
      }
      if (searchText.trim()) {
        params.search = searchText.trim();
      }
      const { data, total } = await getAdminVouchers(params);
      setVouchers(data ?? []);

      const active = (data ?? []).filter((v) => v.isActive).length;
      const inactive = (data ?? []).filter((v) => !v.isActive).length;
      const totalUsage = (data ?? []).reduce(
        (sum, v) => sum + (v.currentUsage ?? 0),
        0,
      );
      setStats({
        total: total ?? data?.length ?? 0,
        active,
        inactive,
        totalUsage,
      });
    } catch (err) {
      console.error("Error fetching vouchers:", err);
      const msg = getApiErrorMessage(err);
      setError(msg || "Không thể tải danh sách voucher. Vui lòng thử lại sau.");
      message.error(msg || "Không thể tải dữ liệu voucher");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, [filterActive]);

  const handleSearch = () => {
    fetchVouchers();
  };

  const openDetail = async (record: AdminVoucher) => {
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const data = await getAdminVoucherById(record.id);
      setDetailData(data);
    } catch {
      message.error("Không thể tải chi tiết voucher");
    } finally {
      setDetailLoading(false);
    }
  };

  const openForm = (record?: AdminVoucher) => {
    setFormEditId(record?.id ?? null);
    setFormEditRecord(record ?? null);
    setFormModalOpen(true);
    if (record) {
      form.setFieldsValue({
        code: record.code,
        discountType: record.discountType,
        discountValue: record.discountValue,
        minPurchase: record.minPurchase ?? 0,
        maxUsage: record.maxUsage,
        validFrom: dayjs(record.validFrom) as never,
        validUntil: dayjs(record.validUntil) as never,
        isActive: record.isActive,
      });
    } else {
      form.resetFields();
    }
  };

  const closeForm = () => {
    setFormModalOpen(false);
    setFormEditId(null);
    setFormEditRecord(null);
    form.resetFields();
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: CreateVoucherRequest = {
        code: values.code?.trim() ?? "",
        discountType: values.discountType,
        discountValue: values.discountValue,
        minPurchase: values.minPurchase ?? 0,
        maxUsage: values.maxUsage,
        validFrom: values.validFrom
          ? dayjs(values.validFrom).toISOString()
          : "",
        validUntil: values.validUntil
          ? dayjs(values.validUntil).toISOString()
          : "",
        isActive: values.isActive ?? true,
      };
      if (formEditId) {
        await updateVoucher(formEditId, {
          ...payload,
          isActive: values.isActive,
        });
        message.success("Cập nhật voucher thành công");
      } else {
        await createVoucher(payload);
        message.success("Tạo voucher thành công");
      }
      closeForm();
      fetchVouchers();
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error(formEditId ? "Cập nhật thất bại" : "Tạo voucher thất bại");
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteVoucher(id);
      message.success("Đã xóa voucher");
      closeForm();
      fetchVouchers();
    } catch {
      message.error("Xóa voucher thất bại");
    }
  };

  const toggleActive = async (record: AdminVoucher) => {
    try {
      await updateVoucher(record.id, { isActive: !record.isActive });
      message.success(record.isActive ? "Đã tắt voucher" : "Đã bật voucher");
      form.setFieldValue("isActive", !record.isActive);
      setFormEditRecord((prev) =>
        prev ? { ...prev, isActive: !prev.isActive } : null,
      );
      fetchVouchers();
    } catch {
      message.error("Cập nhật trạng thái thất bại");
    }
  };

  const filteredVouchers = vouchers.filter((v) => {
    if (searchText) {
      const s = searchText.toLowerCase();
      return v.code.toLowerCase().includes(s);
    }
    return true;
  });

  const columns: ColumnsType<AdminVoucher> = [
    {
      title: "Mã",
      dataIndex: "code",
      key: "code",
      width: 140,
      render: (code: string) => (
        <Text strong copyable>
          {code}
        </Text>
      ),
    },
    {
      title: "Giá trị giảm",
      key: "discountValue",
      width: 140,
      render: (_, v) => formatDiscount(v),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (active: boolean) =>
        active ? (
          <Tag color="success">Hoạt động</Tag>
        ) : (
          <Tag color="default">Đã tắt</Tag>
        ),
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openDetail(record)}
          >
            Chi tiết
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openForm(record)}
          >
            Sửa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "0 24px 24px" }}>
      <Title level={4} style={{ marginBottom: 16 }}>
        <GiftOutlined /> Quản lý Voucher
      </Title>

      <VoucherSummaryCards stats={stats} />

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="Tìm theo mã voucher"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 260 }}
            allowClear
          />
          <Select
            value={filterActive}
            onChange={setFilterActive}
            style={{ width: 140 }}
            options={[
              { value: "all", label: "Tất cả" },
              { value: "active", label: "Đang hoạt động" },
              { value: "inactive", label: "Đã tắt" },
            ]}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
          >
            Tìm kiếm
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openForm()}
          >
            Thêm voucher
          </Button>
        </Space>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
            action={
              <Button size="small" danger onClick={fetchVouchers}>
                Thử lại
              </Button>
            }
          />
        )}

        <Table
          columns={columns}
          dataSource={filteredVouchers.map((v) => ({
            ...v,
            key: String(v.id),
          }))}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (t) => `Tổng ${t} voucher`,
          }}
          scroll={{ x: 500 }}
        />
      </Card>

      {/* Modal chi tiết */}
      <Modal
        title="Chi tiết Voucher"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={520}
      >
        {detailLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin />
          </div>
        ) : detailData ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Mã">
              <Text strong copyable>
                {detailData.code}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Loại giảm">
              {String(detailData.discountType).toUpperCase() === "PERCENTAGE"
                ? "Theo %"
                : "Số tiền cố định"}
            </Descriptions.Item>
            <Descriptions.Item label="Giá trị">
              {formatDiscount(detailData)}
            </Descriptions.Item>
            <Descriptions.Item label="Đơn tối thiểu">
              {formatVnd(detailData.minPurchase ?? 0)}
            </Descriptions.Item>
            <Descriptions.Item label="Đã dùng / Tối đa">
              {detailData.currentUsage ?? 0} / {detailData.maxUsage}
            </Descriptions.Item>
            <Descriptions.Item label="Từ ngày">
              {dayjs(detailData.validFrom).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="Đến ngày">
              {dayjs(detailData.validUntil).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {detailData.isActive ? (
                <Tag color="success">Hoạt động</Tag>
              ) : (
                <Tag color="default">Đã tắt</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {dayjs(detailData.createdAt).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>

      {/* Modal form thêm/sửa */}
      <Modal
        title={formEditId ? "Chỉnh sửa Voucher" : "Thêm Voucher"}
        open={formModalOpen}
        onCancel={closeForm}
        footer={
          formEditId && formEditRecord ? (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: "Xóa voucher?",
                    content: "Voucher đã xóa không thể khôi phục.",
                    okText: "Xóa",
                    cancelText: "Hủy",
                    okType: "danger",
                    onOk: () => handleDelete(formEditRecord.id),
                  });
                }}
              >
                Xóa
              </Button>
              <Space>
                <Button onClick={closeForm}>Hủy</Button>
                <Button onClick={() => toggleActive(formEditRecord)}>
                  {formEditRecord.isActive ? "Tắt" : "Bật"}
                </Button>
                <Button
                  type="primary"
                  loading={formSaving}
                  onClick={() => {
                    setFormSaving(true);
                    handleFormSubmit();
                  }}
                >
                  Cập nhật
                </Button>
              </Space>
            </div>
          ) : (
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
            >
              <Button onClick={closeForm}>Hủy</Button>
              <Button
                type="primary"
                loading={formSaving}
                onClick={() => {
                  setFormSaving(true);
                  handleFormSubmit();
                }}
              >
                Tạo
              </Button>
            </div>
          )
        }
        width={520}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            minPurchase: 0,
            discountType: "PERCENTAGE",
            isActive: true,
          }}
        >
          <Form.Item
            name="code"
            label="Mã voucher"
            rules={[{ required: true, message: "Nhập mã voucher" }]}
          >
            <Input placeholder="VD: SUMMER2025" disabled={!!formEditId} />
          </Form.Item>
          <Form.Item
            name="discountType"
            label="Loại giảm giá"
            rules={[{ required: true }]}
          >
            <Select options={DISCOUNT_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="discountValue"
            label="Giá trị giảm"
            rules={[{ required: true, message: "Nhập giá trị" }]}
          >
            <InputNumber
              min={1}
              max={
                form.getFieldValue("discountType") === "PERCENTAGE"
                  ? 100
                  : undefined
              }
              style={{ width: "100%" }}
              placeholder={
                form.getFieldValue("discountType") === "PERCENTAGE"
                  ? "1-100"
                  : "Số tiền (VNĐ)"
              }
            />
          </Form.Item>
          <Form.Item name="minPurchase" label="Đơn tối thiểu (VNĐ)">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="maxUsage"
            label="Số lượt sử dụng tối đa"
            rules={[{ required: true, message: "Nhập số lượt" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="validFrom"
            label="Có hiệu lực từ"
            rules={[{ required: true, message: "Chọn ngày bắt đầu" }]}
          >
            <DatePicker
              showTime
              style={{ width: "100%" }}
              format="DD/MM/YYYY HH:mm"
            />
          </Form.Item>
          <Form.Item
            name="validUntil"
            label="Hết hạn lúc"
            rules={[{ required: true, message: "Chọn ngày kết thúc" }]}
          >
            <DatePicker
              showTime
              style={{ width: "100%" }}
              format="DD/MM/YYYY HH:mm"
            />
          </Form.Item>
          <Form.Item name="isActive" label="Trạng thái">
            <Select
              options={[
                { value: true, label: "Hoạt động" },
                { value: false, label: "Đã tắt" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
