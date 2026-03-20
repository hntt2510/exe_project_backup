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
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  FileTextOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { antdTheme } from "../../config/antd-theme";
import { authLogout } from "../../services/authApi";
import { clearAuthSession } from "../../utils/authSession";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface StaffLayoutProps {
  children?: ReactNode; // Optional for backward compatibility
}

const menuItems: MenuProps["items"] = [
  {
    key: "/staff",
    icon: <DashboardOutlined />,
    label: <Link to="/staff">Dashboard</Link>,
  },
  {
    key: "/staff/bookings",
    icon: <CalendarOutlined />,
    label: <Link to="/staff/bookings">Quản lý Booking</Link>,
  },
  {
    key: "/staff/tours",
    icon: <EnvironmentOutlined />,
    label: <Link to="/staff/tours">Điều phối Tour</Link>,
  },
  {
    key: "/staff/artisans",
    icon: <TeamOutlined />,
    label: <Link to="/staff/artisans">Quản lý Nghệ nhân</Link>,
  },
  {
    key: "/staff/content",
    icon: <FileTextOutlined />,
    label: <Link to="/staff/content">Quản lý Nội dung</Link>,
  },
];

const pageTitles: Record<string, string> = {
  "/staff": "Dashboard",
  "/staff/bookings": "Quản lý Booking",
  "/staff/tours": "Điều phối Tour",
  "/staff/artisans": "Quản lý Nghệ nhân",
  "/staff/content": "Quản lý Nội dung",
};

const breadcrumbMap: Record<string, { title: string; path?: string }[]> = {
  "/staff": [{ title: "Dashboard" }],
  "/staff/bookings": [{ title: "Dashboard", path: "/staff" }, { title: "Quản lý Booking" }],
  "/staff/tours": [{ title: "Dashboard", path: "/staff" }, { title: "Điều phối Tour" }],
  "/staff/artisans": [{ title: "Dashboard", path: "/staff" }, { title: "Quản lý Nghệ nhân" }],
  "/staff/content": [{ title: "Dashboard", path: "/staff" }, { title: "Quản lý Nội dung" }],
};

function StaffLayoutContent({ children }: StaffLayoutProps) {
  // Support both children (legacy) and Outlet (React Router v6)
  const content = children || <Outlet />;
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { message } = App.useApp();

  const handleLogout = async () => {
    try {
      await authLogout(); // POST /api/auth/logout - invalidate token trên server
    } catch (err) {
      console.error("[StaffLayout] Logout API error:", err);
    } finally {
      clearAuthSession(); // Xóa accessToken, refreshToken, userInfo...
      localStorage.removeItem("rememberAccount");
      message.success("Đăng xuất thành công");
      window.location.href = "/login";
    }
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <SettingOutlined />,
      label: "Thông tin cá nhân",
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
  const pageTitle = pageTitles[currentPath] || "Dashboard";
  const breadcrumbItems = breadcrumbMap[currentPath] || [{ title: "Dashboard" }];

  return (
    <Layout className="staff-layout" style={{ minHeight: "100vh", background: "#f5f5f5" }}>
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
                <div style={{ fontWeight: "bold", fontSize: 16, color: "#262626" }}>
                  Cội Việt
                </div>
                <div style={{ fontSize: 12, color: "#8c8c8c" }}>Staff Panel</div>
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
            <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
              <Button
                type="text"
                icon={React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
                  style: { fontSize: 18 },
                })}
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
                  title: item.path ? <Link to={item.path}>{item.title}</Link> : item.title,
                }))}
                style={{ fontSize: 14 }}
              />
            </div>

            <Space size="middle" style={{ marginLeft: 24 }}>
              <Dropdown 
                menu={{ 
                  items: userMenuItems,
                  onClick: ({ key }) => {
                    if (key === "logout") {
                      handleLogout();
                    }
                  }
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
                      backgroundColor: "#1890ff",
                      flexShrink: 0,
                    }}
                  >
                    S
                  </Avatar>
                  <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.5 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#262626" }}>
                      Staff User
                    </span>
                    <span style={{ fontSize: 12, color: "#8c8c8c" }}>staff@coiviet.com</span>
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

export default function StaffLayout(props: StaffLayoutProps) {
  return (
    <ConfigProvider theme={antdTheme}>
      <App>
        <StaffLayoutContent {...props} />
      </App>
    </ConfigProvider>
  );
}
