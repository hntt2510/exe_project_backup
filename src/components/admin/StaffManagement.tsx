import { useState, useEffect, useCallback } from "react";
import {
  App,
  Card,
  Table,
  Button,
  Space,
  Tag,
  Select,
  Row,
  Col,
  Avatar,
  Modal,
  Form,
  Input,
  Alert,
  DatePicker,
  Popconfirm,
  Empty,
} from "antd";
import {
  PlusOutlined,
  KeyOutlined,
  MailOutlined,
  EyeOutlined,
  PhoneOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import PersonDetailCard from "./PersonDetailCard";
import type { ColumnsType } from "antd/es/table";
import {
  getAdminUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  updateUserStatus,
  updateUserRoleAndStatus,
  type AdminUser,
} from "../../services/adminApi";
import { getApiErrorMessage } from "../../services/api";
import dayjs from "dayjs";

const staffRoleConfig: Record<string, { label: string; color: string }> = {
  STAFF: { label: "Nhân viên", color: "orange" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Hoạt động", color: "green" },
  INACTIVE: { label: "Không hoạt động", color: "default" },
};

interface StaffUser {
  key: string;
  id: string;
  username: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  role: "STAFF" | "ADMIN";
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  lastLogin?: string;
}

export default function StaffManagement() {
  const { message } = App.useApp();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<{
    role: string;
    status: string;
    search: string;
  }>({
    role: "all",
    status: "all",
    search: "",
  });
  const [searchInput, setSearchInput] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { role?: string; status?: string; search?: string } = {};
      if (filter.role !== "all") params.role = filter.role;
      if (filter.status !== "all") params.status = filter.status;
      if (filter.search?.trim()) params.search = filter.search.trim();

      const response = await getAdminUsers(params);
      if (!response?.data || !Array.isArray(response.data)) {
        throw new Error("Invalid API response format");
      }

      const mapped: StaffUser[] = response.data
        .filter((u: AdminUser) => u.role === "STAFF")
        .map((u: AdminUser) => ({
          key: String(u.id),
          id: String(u.id),
          username: u.username || "",
          name: u.fullName || "",
          email: u.email || "",
          phone: u.phone,
          avatarUrl: u.avatarUrl,
          dateOfBirth: u.dateOfBirth,
          role: "STAFF" as StaffUser["role"],
          status: u.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
          createdAt: u.createdAt
            ? new Date(u.createdAt).toLocaleDateString("vi-VN")
            : "-",
          lastLogin: u.lastLogin
            ? new Date(u.lastLogin).toLocaleDateString("vi-VN")
            : undefined,
        }));
      setStaff(mapped);
    } catch (err: unknown) {
      const msg =
        (
          err as {
            response?: { data?: { message?: string } };
            message?: string;
          }
        )?.response?.data?.message ||
        (err as Error)?.message ||
        "Không thể tải dữ liệu nhân viên.";
      setError(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, [filter.role, filter.status, filter.search, message]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const hasActiveFilters =
    filter.role !== "all" ||
    filter.status !== "all" ||
    (filter.search?.trim()?.length ?? 0) > 0;

  const handleClearFilters = () => {
    setFilter({ role: "all", status: "all", search: "" });
    setSearchInput("");
  };

  const handleView = (record: StaffUser) => {
    setSelectedStaff(record);
    setDetailModalOpen(true);
  };

  const handleEdit = (record: StaffUser) => {
    setSelectedStaff(record);
    editForm.setFieldsValue({
      username: record.username,
      email: record.email,
      fullName: record.name,
      phone: record.phone,
      dateOfBirth: record.dateOfBirth ? dayjs(record.dateOfBirth) : null,
      role: record.role,
      status: record.status,
    });
    setEditModalOpen(true);
  };


  const handleDelete = async (id: string) => {
    try {
      await deleteUser(parseInt(id));
      message.success("Đã xóa nhân viên");
      fetchStaff();
    } catch (err) {
      message.error(getApiErrorMessage(err) || "Xóa nhân viên thất bại");
    }
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await createUser({
        username: values.username,
        email: values.email,
        phone: values.phone || "",
        password: values.password,
        fullName: values.fullName,
        role: "STAFF",
        dateOfBirth: values.dateOfBirth
          ? dayjs(values.dateOfBirth).format("YYYY-MM-DD")
          : undefined,
      });
      message.success("Đã thêm nhân viên thành công");
      setIsModalOpen(false);
      form.resetFields();
      fetchStaff();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error(getApiErrorMessage(err) || "Thêm nhân viên thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedStaff) return;
    try {
      const values = await editForm.validateFields();
      setSubmitting(true);
      const userId = parseInt(selectedStaff.id);

      await updateUser(userId, {
        username: values.username,
        email: values.email,
        fullName: values.fullName,
        phone: values.phone || undefined,
        dateOfBirth: values.dateOfBirth
          ? dayjs(values.dateOfBirth).format("YYYY-MM-DD")
          : undefined,
      });

      const roleChanged = values.role !== selectedStaff.role;
      const statusChanged = values.status !== selectedStaff.status;
      if (roleChanged && statusChanged) {
        await updateUserRoleAndStatus(userId, values.role, values.status);
      } else if (roleChanged) {
        await updateUserRole(userId, values.role);
      } else if (statusChanged) {
        await updateUserStatus(userId, values.status);
      }

      message.success("Cập nhật nhân viên thành công");
      setEditModalOpen(false);
      setSelectedStaff(null);
      fetchStaff();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error(getApiErrorMessage(err) || "Cập nhật thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStaff = staff.filter((s) => {
    if (filter.role !== "all" && s.role !== filter.role) return false;
    if (filter.status !== "all" && s.status !== filter.status) return false;
    if (filter.search?.trim()) {
      const q = filter.search.toLowerCase();
      return (
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.username?.toLowerCase().includes(q) ||
        s.phone?.includes(filter.search)
      );
    }
    return true;
  });

  const columns: ColumnsType<StaffUser> = [
    {
      title: "Nhân viên",
      key: "user",
      width: 280,
      fixed: "left",
      render: (_, record) => (
        <Space>
          <Avatar src={record.avatarUrl} style={{ backgroundColor: "#8B0000" }}>
            {!record.avatarUrl && (record.name?.charAt(0) || "S")}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{record.name || "N/A"}</div>
            {record.username && (
              <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                @{record.username}
              </div>
            )}
            <div style={{ fontSize: 12, color: "#8c8c8c" }}>
              <MailOutlined /> {record.email || "N/A"}
            </div>
            {record.phone && (
              <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                <PhoneOutlined /> {record.phone}
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      width: 140,
      render: (role: string) => {
        const config = staffRoleConfig[role] || {
          label: role,
          color: "default",
        };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: string) => {
        const config = statusConfig[status] || {
          label: status,
          color: "default",
        };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: "Ngày sinh",
      key: "dateOfBirth",
      width: 120,
      render: (_, record) =>
        record.dateOfBirth
          ? new Date(record.dateOfBirth).toLocaleDateString("vi-VN")
          : "-",
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
            onClick={() => handleView(record)}
          >
            Xem
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
              Quản lý Staff
            </h2>
            <p style={{ margin: "4px 0 0 0", color: "#8c8c8c", fontSize: 14 }}>
              Quản lý nhân viên và phân quyền
            </p>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
            >
              Tạo staff mới
            </Button>
          </Col>
        </Row>
      </Card>

      <Card>
        <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <div style={{ marginBottom: 4, fontSize: 13, color: "#595959" }}>
              Vai trò
            </div>
            <Select
              style={{ width: "100%" }}
              placeholder="Tất cả vai trò"
              value={filter.role}
              onChange={(value) => setFilter({ ...filter, role: value })}
            >
              <Select.Option value="all">Tất cả vai trò</Select.Option>
              <Select.Option value="STAFF">Nhân viên</Select.Option>
            </Select>
          </Col>
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
              <Select.Option value="all">Tất cả trạng thái</Select.Option>
              <Select.Option value="ACTIVE">Hoạt động</Select.Option>
              <Select.Option value="INACTIVE">Không hoạt động</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div style={{ marginBottom: 4, fontSize: 13, color: "#595959" }}>
              Tìm kiếm
            </div>
            <Input
              placeholder="Tìm theo tên, email, username..."
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
            scroll={{ x: 1100 }}
            pagination={false}
          />
        ) : filteredStaff.length === 0 ? (
          <Empty
            description={
              <span>
                {hasActiveFilters
                  ? "Không tìm thấy nhân viên nào phù hợp với bộ lọc."
                  : "Chưa có nhân viên nào."}
              </span>
            }
            style={{ padding: "48px 0" }}
          >
            {hasActiveFilters && (
              <Button type="primary" onClick={handleClearFilters}>
                Xóa bộ lọc
              </Button>
            )}
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredStaff}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1100 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} nhân viên`,
            }}
          />
        )}
      </Card>

      <Modal
        title="Chi tiết Staff"
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          setSelectedStaff(null);
        }}
        footer={[
          <Button
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setDetailModalOpen(false);
              if (selectedStaff) handleEdit(selectedStaff);
            }}
          >
            Chỉnh sửa
          </Button>,
          <Button
            key="close"
            onClick={() => {
              setDetailModalOpen(false);
              setSelectedStaff(null);
            }}
          >
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {selectedStaff && (
          <PersonDetailCard
            avatarUrl={selectedStaff.avatarUrl}
            name={selectedStaff.name}
            subtitle={
              selectedStaff.username ? `@${selectedStaff.username}` : undefined
            }
            status={selectedStaff.status}
            statusLabel={
              selectedStaff.status === "ACTIVE"
                ? "Hoạt động"
                : "Không hoạt động"
            }
            infoSections={[
              {
                rows: [
                  {
                    label: "Email",
                    value: selectedStaff.email,
                    icon: <MailOutlined />,
                  },
                  {
                    label: "Số điện thoại",
                    value: selectedStaff.phone || "Chưa có",
                    icon: <PhoneOutlined />,
                  },
                  {
                    label: "Vai trò",
                    value:
                      staffRoleConfig[selectedStaff.role]?.label ||
                      selectedStaff.role,
                  },
                  {
                    label: "Ngày sinh",
                    value: selectedStaff.dateOfBirth
                      ? new Date(selectedStaff.dateOfBirth).toLocaleDateString(
                          "vi-VN",
                        )
                      : "Chưa có",
                  },
                ],
              },
            ]}
          />
        )}
      </Modal>

      <Modal
        title="Thêm nhân viên"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Tên đăng nhập"
            name="username"
            rules={[{ required: true, message: "Vui lòng nhập username" }]}
          >
            <Input placeholder="username" />
          </Form.Item>
          <Form.Item
            label="Họ tên"
            name="fullName"
            rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
          >
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input type="email" placeholder="email@example.com" />
          </Form.Item>
          <Form.Item label="Số điện thoại" name="phone">
            <Input placeholder="0901234567" />
          </Form.Item>
          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu" },
              { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
            ]}
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>
          <Form.Item label="Ngày sinh" name="dateOfBirth">
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item label="Vai trò" name="role" initialValue="STAFF">
            <Select>
              <Select.Option value="STAFF">Nhân viên</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                onClick={handleCreate}
                loading={submitting}
              >
                Tạo
              </Button>
              <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Chỉnh sửa nhân viên"
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          setSelectedStaff(null);
        }}
        footer={
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Space>
              <Popconfirm
                title="Reset mật khẩu"
                description="Nhân viên sẽ phải đăng nhập lại bằng mật khẩu mới. Tiếp tục?"
                onConfirm={() =>
                  selectedStaff && handleResetPassword(selectedStaff)
                }
                okText="Đồng ý"
                cancelText="Hủy"
              >
                <Button icon={<KeyOutlined />}>Reset mật khẩu</Button>
              </Popconfirm>
              <Popconfirm
                title="Xóa nhân viên"
                description="Bạn có chắc muốn xóa nhân viên này? Hành động này không thể hoàn tác."
                onConfirm={() =>
                  selectedStaff && handleDeleteUser(selectedStaff.id)
                }
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />}>
                  Xóa
                </Button>
              </Popconfirm>
            </Space>
            <Space>
              <Button
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedStaff(null);
                }}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                onClick={handleSaveEdit}
                loading={submitting}
              >
                Lưu
              </Button>
            </Space>
          </div>
        }
        width={560}
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Tên đăng nhập"
            name="username"
            rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập" }]}
          >
            <Input placeholder="username" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input type="email" placeholder="email@example.com" />
          </Form.Item>
          <Form.Item
            label="Họ tên"
            name="fullName"
            rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Số điện thoại" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="Ngày sinh" name="dateOfBirth">
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item label="Vai trò" name="role" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="STAFF">Nhân viên</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Trạng thái"
            name="status"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="ACTIVE">Hoạt động</Select.Option>
              <Select.Option value="INACTIVE">Không hoạt động</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
