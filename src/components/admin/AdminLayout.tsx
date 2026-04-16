import React, { ReactNode, useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  App,
  ConfigProvider,
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Space,
  Breadcrumb,
  Button,
  Divider,
  Typography,
} from "antd";
import type { MenuProps } from "antd";
import {
  DashboardOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  TeamOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  LogoutOutlined,
  IdcardOutlined,
  BookOutlined,
  GiftOutlined,
  MessageOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { antdTheme } from "../../config/antd-theme";
import { adminLogout } from "../../services/adminApi";
import { clearAuthSession } from "../../utils/authSession";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface AdminLayoutProps {
  children?: ReactNode; // Optional for backward compatibility
}

const menuItems: MenuProps["items"] = [
  {
    key: "/admin",
    icon: <DashboardOutlined />,
    label: <Link to="/admin" style={{ textDecoration: "none" }}>Dashboard</Link>,
  },
  {
    key: "/admin/content",
    icon: <FileTextOutlined />,
    label: <Link to="/admin/content" style={{ textDecoration: "none" }}>Quản lý Nội dung</Link>,
  },
  {
    key: "/admin/tours",
    icon: <EnvironmentOutlined />,
    label: <Link to="/admin/tours" style={{ textDecoration: "none" }}>Quản lý Tour</Link>,
  },
  {
    key: "/admin/tour-schedules",
    icon: <CalendarOutlined />,
    label: <Link to="/admin/tour-schedules" style={{ textDecoration: "none" }}>Quản lý Lịch trình</Link>,
  },
  {
    key: "/admin/bookings",
    icon: <CalendarOutlined />,
    label: <Link to="/admin/bookings" style={{ textDecoration: "none" }}>Quản lý Booking</Link>,
  },
  {
    key: "/admin/artisans",
    icon: <TeamOutlined />,
    label: <Link to="/admin/artisans" style={{ textDecoration: "none" }}>Quản lý Nghệ nhân</Link>,
  },
  {
    key: "/admin/users",
    icon: <UserOutlined />,
    label: <Link to="/admin/users" style={{ textDecoration: "none" }}>Quản lý Member</Link>,
  },
  {
    key: "/admin/staff",
    icon: <IdcardOutlined />,
    label: <Link to="/admin/staff" style={{ textDecoration: "none" }}>Quản lý Staff</Link>,
  },
  {
    key: "/admin/learn",
    icon: <BookOutlined />,
    label: <Link to="/admin/learn" style={{ textDecoration: "none" }}>Quản lý Học nhanh</Link>,
  },
  {
    key: "/admin/vouchers",
    icon: <GiftOutlined />,
    label: <Link to="/admin/vouchers" style={{ textDecoration: "none" }}>Quản lý Voucher</Link>,
  },
  {
    key: "/admin/feedback",
    icon: <MessageOutlined />,
    label: <Link to="/admin/feedback" style={{ textDecoration: "none" }}>Quản lý Feedback</Link>,
  },
  {
    key: "/admin/mails",
    icon: <MailOutlined />,
    label: <Link to="/admin/mails" style={{ textDecoration: "none" }}>Quản lý Email</Link>,
  },
  {
    key: "/admin/leads",
    icon: <UserOutlined />,
    label: <Link to="/admin/leads" style={{ textDecoration: "none" }}>Quản lý Lead</Link>,
  },
];

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/content": "Quản lý Nội dung",
  "/admin/tours": "Quản lý Tour",
  "/admin/tour-schedules": "Quản lý Lịch trình",
  "/admin/bookings": "Quản lý Booking",
  "/admin/artisans": "Quản lý Nghệ nhân",
  "/admin/users": "Quản lý Member",
  "/admin/staff": "Quản lý Staff",
  "/admin/learn": "Quản lý Học nhanh",
  "/admin/vouchers": "Quản lý Voucher",
  "/admin/feedback": "Quản lý Feedback",
  "/admin/mails": "Quản lý Email",
  "/admin/leads": "Quản lý Lead",
};

const breadcrumbMap: Record<string, { title: string; path?: string }[]> = {
  "/admin": [{ title: "Dashboard" }],
  "/admin/content": [
    { title: "Dashboard", path: "/admin" },
    { title: "Quản lý Nội dung" },
  ],
  "/admin/tours": [
    { title: "Dashboard", path: "/admin" },
    { title: "Quản lý Tour" },
  ],
  "/admin/tour-schedules": [
    { title: "Dashboard", path: "/admin" },
    { title: "Quản lý Lịch trình" },
  ],
  "/admin/bookings": [
    { title: "Dashboard", path: "/admin" },
    { title: "Quản lý Booking" },
  ],
  "/admin/artisans": [
    { title: "Dashboard", path: "/admin" },
    { title: "Quản lý Nghệ nhân" },
  ],
  "/admin/users": [
    { title: "Dashboard", path: "/admin" },
    { title: "Quản lý Member" },
  ],
  "/admin/staff": [
    { title: "Dashboard", path: "/admin" },
    { title: "Quản lý Staff" },
  ],
  "/admin/learn": [
    { title: "Dashboard", path: "/admin" },
    { title: "Quản lý Học nhanh" },
  ],
  "/admin/vouchers": [
    { title: "Dashboard", path: "/admin" },
    { title: "Quản lý Voucher" },
  ],
  "/admin/feedback": [
    { title: "Dashboard", path: "/admin" },
    { title: "Quản lý Feedback" },
  ],
  "/admin/mails": [
    { title: "Dashboard", path: "/admin" },
    { title: "Quản lý Email" },
  ],
  "/admin/leads": [
    { title: "Dashboard", path: "/admin" },
    { title: "Quản lý Lead" },
  ],
};

function AdminLayoutContent({ children }: AdminLayoutProps) {
  const content = children || <Outlet />;
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { message } = App.useApp();

  const handleLogout = async () => {
    try {
      await adminLogout();
    } catch (err) {
      console.error("[AdminLayout] Logout API error:", err);
    } finally {
      clearAuthSession();
      localStorage.removeItem("rememberAccount");
      message.success("Đăng xuất thành công");
      window.location.href = "/";
    }
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Thông tin cá nhân",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Cài đặt",
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      danger: true,
    },
  ];

  const currentPath = location.pathname;
  const breadcrumbItems = breadcrumbMap[currentPath] || [
    { title: "Dashboard" },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        collapsedWidth={80}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          background: "#fff",
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
          transition: "all 0.3s cubic-bezier(0.2, 0, 0, 1)",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            height: 64,
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 12,
            borderBottom: "1px solid #f0f0f0",
            transition: "all 0.3s cubic-bezier(0.2, 0, 0, 1)",
          }}
        >
          <img
            src="/logo.png"
            alt="Cội Việt Logo"
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              objectFit: "contain",
              flexShrink: 0,
            }}
          />
          {!collapsed && (
            <div
              style={{
                opacity: collapsed ? 0 : 1,
                transition: "opacity 0.2s ease-in-out",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              <div
                style={{ fontWeight: "bold", fontSize: 16, color: "#262626" }}
              >
                Cội Việt
              </div>
              <div style={{ fontSize: 12, color: "#8c8c8c" }}>Admin Panel</div>
            </div>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentPath]}
          items={menuItems}
          style={{
            borderRight: 0,
            padding: "12px 8px",
            transition: "all 0.3s cubic-bezier(0.2, 0, 0, 1)",
          }}
        />
        <div
          style={{
            padding: "8px",
            borderTop: "1px solid #f0f0f0",
            transition: "all 0.3s cubic-bezier(0.2, 0, 0, 1)",
          }}
        >
          <Menu
            mode="inline"
            items={[
              {
                key: "logout",
                icon: <LogoutOutlined />,
                label: collapsed ? null : "Đăng xuất",
                danger: true,
              },
            ]}
            style={{ borderRight: 0 }}
            onClick={(info) => {
              if (info.key === "logout") {
                handleLogout();
              }
            }}
          />
        </div>
      </Sider>

      <Layout
        style={{
          marginLeft: collapsed ? 80 : 260,
          transition: "all 0.3s cubic-bezier(0.2, 0, 0, 1)",
          minHeight: "100vh",
        }}
      >
        <Header
          style={{
            padding: "0 24px",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            position: "sticky",
            top: 0,
            zIndex: 999,
            height: 64,
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}
          >
            <Button
              type="text"
              icon={React.createElement(
                collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
                {
                  style: { fontSize: 18 },
                },
              )}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f5f5f5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            />

            <Divider orientation="vertical" style={{ height: 32, margin: 0 }} />

            <Breadcrumb
              items={breadcrumbItems.map((item) => ({
                title: item.path ? (
                  <Link to={item.path} style={{ textDecoration: "none" }}>{item.title}</Link>
                ) : (
                  item.title
                ),
              }))}
              style={{ fontSize: 14 }}
            />
          </div>

          <Space size="middle" style={{ marginLeft: 24 }}>
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: (info) => {
                  if (info.key === "logout") {
                    handleLogout();
                  }
                },
              }}
              placement="bottomRight"
              trigger={["click"]}
            >
              <Space
                style={{
                  cursor: "pointer",
                  padding: "8px 12px",
                  borderRadius: 8,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#fafafa";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Avatar
                  size={40}
                  style={{
                    backgroundColor: "#8B0000",
                    flexShrink: 0,
                  }}
                >
                  A
                </Avatar>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    lineHeight: 1.5,
                  }}
                >
                  <span
                    style={{ fontSize: 14, fontWeight: 500, color: "#262626" }}
                  >
                    Admin User
                  </span>
                  <span style={{ fontSize: 12, color: "#8c8c8c" }}>
                    admin@coiviet.com
                  </span>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: "24px",
            padding: 24,
            background: "#fff",
            borderRadius: 12,
            minHeight: "calc(100vh - 112px)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            transition: "all 0.3s cubic-bezier(0.2, 0, 0, 1)",
          }}
        >
          {content}
        </Content>
      </Layout>
    </Layout>
  );
}

export default function AdminLayout(props: AdminLayoutProps) {
  return (
    <ConfigProvider theme={antdTheme}>
      <App>
        <AdminLayoutContent {...props} />
      </App>
    </ConfigProvider>
  );
}
