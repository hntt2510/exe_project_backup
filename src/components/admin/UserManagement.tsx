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
  updateUserStatus,
  updateUserRole,
  updateUserRoleAndStatus,
  adminResetUserPassword,
  type AdminUser,
} from "../../services/adminApi";
import { getApiErrorMessage } from "../../services/api";
import dayjs from "dayjs";

interface User {
  key: string;
  id: string;
  username: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN" | "ARTISAN";
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  lastLogin?: string;
}

const roleConfig: Record<string, { label: string; color: string }> = {
  CUSTOMER: { label: "Khách hàng", color: "blue" },
  STAFF: { label: "Nhân viên", color: "orange" },
  ADMIN: { label: "Quản trị viên", color: "red" },
  ARTISAN: { label: "Nghệ nhân", color: "purple" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Hoạt động", color: "green" },
  INACTIVE: { label: "Không hoạt động", color: "default" },
};

export default function UserManagement() {
  const { message } = App.useApp();
  const [users, setUsers] = useState<User[]>([]);
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [resetPwdForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [resetPwdModalOpen, setResetPwdModalOpen] = useState(false);
  const [resetPwdSubmitting, setResetPwdSubmitting] = useState(false);

  const fetchUsers = useCallback(
    async (forceRefresh = false) => {
      try {
        setLoading(true);
        setError(null);
        const params: { role?: string; status?: string; search?: string } = {};
        if (filter.role !== "all") params.role = filter.role;
        if (filter.status !== "all") params.status = filter.status;
        if (filter.search?.trim()) params.search = filter.search.trim();

        // Force refresh bằng cách thêm timestamp vào params
        const response = await getAdminUsers(
          forceRefresh ? { ...params, _force: Date.now() } : params,
        );
        if (!response?.data || !Array.isArray(response.data)) {
          throw new Error("Invalid API response format");
        }

        const mappedUsers: User[] = response.data
          .filter((user: AdminUser) => user.role === "CUSTOMER")
          .map((user: AdminUser) => ({
            key: user.id.toString(),
            id: user.id.toString(),
            username: user.username || "",
            name: user.fullName || "",
            email: user.email || "",
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            dateOfBirth: user.dateOfBirth,
            role: (user.role || "CUSTOMER") as User["role"],
            status: user.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
            createdAt: user.createdAt
              ? new Date(user.createdAt).toLocaleDateString("vi-VN")
              : "-",
            lastLogin: user.lastLogin
              ? new Date(user.lastLogin).toLocaleDateString("vi-VN")
              : undefined,
          }));
        setUsers(mappedUsers);
      } catch (err: unknown) {
        const errMsg =
          (err as any)?.response?.data?.message ||
          (err as Error)?.message ||
          "Không thể tải dữ liệu member. Vui lòng thử lại sau.";
        setError(errMsg);
        message.error(errMsg);
      } finally {
        setLoading(false);
      }
    },
    [filter.role, filter.status, filter.search, message],
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const hasActiveFilters =
    filter.role !== "all" ||
    filter.status !== "all" ||
    (filter.search?.trim()?.length ?? 0) > 0;

  const handleClearFilters = () => {
    setFilter({ role: "all", status: "all", search: "" });
    setSearchInput("");
  };

  const handleView = (record: User) => {
    setSelectedUser(record);
    setDetailModalOpen(true);
  };

  const handleEdit = (record: User) => {
    setSelectedUser(record);
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

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteUser(parseInt(id));
      message.success("Đã xóa member");
      setEditModalOpen(false);
      setSelectedUser(null);
      fetchUsers(true); // Force refresh sau khi xóa
    } catch (err) {
      message.error(getApiErrorMessage(err) || "Xóa member thất bại");
      throw err;
    }
  };

  const handleOpenResetPassword = (record: User) => {
    setSelectedUser(record);
    resetPwdForm.resetFields();
    setResetPwdModalOpen(true);
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    try {
      const values = await resetPwdForm.validateFields();
      setResetPwdSubmitting(true);
      await adminResetUserPassword(parseInt(selectedUser.id), values.newPassword);
      message.success("Đã đổi mật khẩu thành công");
      setResetPwdModalOpen(false);
      setSelectedUser(null);
      resetPwdForm.resetFields();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error(getApiErrorMessage(err) || "Đổi mật khẩu thất bại");
    } finally {
      setResetPwdSubmitting(false);
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
        dateOfBirth: values.dateOfBirth
          ? dayjs(values.dateOfBirth).format("YYYY-MM-DD")
          : undefined,
      });
      message.success("Đã tạo member thành công");
      setIsModalOpen(false);
      form.resetFields();
      fetchUsers(true); // Force refresh sau khi tạo
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error(getApiErrorMessage(err) || "Tạo member thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    try {
      const values = await editForm.validateFields();
      setSubmitting(true);
      const userId = parseInt(selectedUser.id);

      // Cập nhật thông tin cơ bản (username, email, fullName, phone, dateOfBirth)
      await updateUser(userId, {
        username: values.username,
        email: values.email,
        fullName: values.fullName,
        phone: values.phone || undefined,
        dateOfBirth: values.dateOfBirth
          ? dayjs(values.dateOfBirth).format("YYYY-MM-DD")
          : undefined,
      });

      // Cập nhật role và status nếu có thay đổi
      const roleChanged = values.role !== selectedUser.role;
      const statusChanged = values.status !== selectedUser.status;

      if (roleChanged && statusChanged) {
        // Cả 2 đều thay đổi → gọi hàm cập nhật cả 2
        await updateUserRoleAndStatus(userId, values.role, values.status);
      } else if (roleChanged) {
        // Chỉ role thay đổi
        await updateUserRole(userId, values.role);
      } else if (statusChanged) {
        // Chỉ status thay đổi
        await updateUserStatus(userId, values.status);
      }

      message.success("Cập nhật member thành công");
      setEditModalOpen(false);
      setSelectedUser(null);
      fetchUsers(true); // Force refresh sau khi cập nhật
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error(getApiErrorMessage(err) || "Cập nhật thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: "Thành viên",
      key: "user",
      width: 280,
      fixed: "left",
      render: (_, record) => (
        <Space>
          <Avatar src={record.avatarUrl} style={{ backgroundColor: "#8B0000" }}>
            {!record.avatarUrl && (record.name?.charAt(0) || "U")}
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
        const config = roleConfig[role] || {
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
              Quản lý Member
            </h2>
            <p style={{ margin: "4px 0 0 0", color: "#8c8c8c", fontSize: 14 }}>
              Quản lý thành viên khách hàng
            </p>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
            >
              Tạo member mới
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
              <Select.Option value="CUSTOMER">Khách hàng</Select.Option>
              <Select.Option value="STAFF">Nhân viên</Select.Option>
              <Select.Option value="ADMIN">Quản trị viên</Select.Option>
              <Select.Option value="ARTISAN">Nghệ nhân</Select.Option>
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
        ) : users.length === 0 ? (
          <Empty
            description={
              <span>
                {hasActiveFilters
                  ? "Không tìm thấy member nào phù hợp với bộ lọc."
                  : "Chưa có member nào."}
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
            dataSource={users}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1100 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} member`,
            }}
          />
        )}
      </Card>

      <Modal
        title="Chi tiết Member"
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          setSelectedUser(null);
        }}
        footer={[
          <Button
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setDetailModalOpen(false);
              if (selectedUser) handleEdit(selectedUser);
            }}
          >
            Chỉnh sửa
          </Button>,
          <Button
            key="close"
            onClick={() => {
              setDetailModalOpen(false);
              setSelectedUser(null);
            }}
          >
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {selectedUser && (
          <PersonDetailCard
            avatarUrl={selectedUser.avatarUrl}
            name={selectedUser.name}
            subtitle={
              selectedUser.username ? `@${selectedUser.username}` : undefined
            }
            status={selectedUser.status}
            statusLabel={
              selectedUser.status === "ACTIVE" ? "Hoạt động" : "Không hoạt động"
            }
            infoSections={[
              {
                rows: [
                  {
                    label: "Email",
                    value: selectedUser.email,
                    icon: <MailOutlined />,
                  },
                  {
                    label: "Số điện thoại",
                    value: selectedUser.phone || "Chưa có",
                    icon: <PhoneOutlined />,
                  },
                  {
                    label: "Vai trò",
                    value:
                      roleConfig[selectedUser.role]?.label || selectedUser.role,
                  },
                  {
                    label: "Ngày sinh",
                    value: selectedUser.dateOfBirth
                      ? new Date(selectedUser.dateOfBirth).toLocaleDateString(
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
        title="Tạo member mới"
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
          <Form.Item label="Vai trò" name="role" initialValue="CUSTOMER">
            <Select>
              <Select.Option value="CUSTOMER">Khách hàng</Select.Option>
              <Select.Option value="STAFF">Nhân viên</Select.Option>
              <Select.Option value="ADMIN">Quản trị viên</Select.Option>
              <Select.Option value="ARTISAN">Nghệ nhân</Select.Option>
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
        title="Chỉnh sửa member"
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          setSelectedUser(null);
        }}
        footer={
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Space>
              <Button
                icon={<KeyOutlined />}
                onClick={() =>
                  selectedUser && handleOpenResetPassword(selectedUser)
                }
              >
                Đổi mật khẩu
              </Button>
              <Popconfirm
                title="Xóa member"
                description="Bạn có chắc muốn xóa member này? Hành động này không thể hoàn tác."
                onConfirm={() =>
                  selectedUser && handleDeleteUser(selectedUser.id)
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
                  setSelectedUser(null);
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
              <Select.Option value="CUSTOMER">Khách hàng</Select.Option>
              <Select.Option value="STAFF">Nhân viên</Select.Option>
              {selectedUser?.role !== "CUSTOMER" && (
                <Select.Option value="ADMIN">Quản trị viên</Select.Option>
              )}
              <Select.Option value="ARTISAN">Nghệ nhân</Select.Option>
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

      <Modal
        title="Đổi mật khẩu"
        open={resetPwdModalOpen}
        onCancel={() => {
          setResetPwdModalOpen(false);
          setSelectedUser(null);
          resetPwdForm.resetFields();
        }}
        onOk={handleResetPassword}
        okText="Đổi mật khẩu"
        cancelText="Hủy"
        confirmLoading={resetPwdSubmitting}
        destroyOnClose
      >
        {selectedUser && (
          <p style={{ marginBottom: 16 }}>
            Đổi mật khẩu cho{" "}
            <strong>{selectedUser.name || selectedUser.username}</strong>
          </p>
        )}
        <Form form={resetPwdForm} layout="vertical">
          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu mới" },
              { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
            ]}
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Mật khẩu không khớp"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
