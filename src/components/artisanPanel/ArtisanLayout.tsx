import React, { ReactNode, useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  App,
  ConfigProvider,
  Layout,
  Menu,
  Avatar,
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
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { antdTheme } from "../../config/antd-theme";
import { authLogout } from "../../services/authApi";
import { clearAuthSession } from "../../utils/authSession";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface ArtisanLayoutProps {
  children?: ReactNode;
}

const menuItems: MenuProps["items"] = [
  {
    key: "/artisan",
    icon: <DashboardOutlined />,
    label: <Link to="/artisan">Dashboard</Link>,
  },
  {
    key: "/artisan/schedule",
    icon: <CalendarOutlined />,
    label: <Link to="/artisan/schedule">Lịch trình của tôi</Link>,
  },
  {
    key: "/artisan/profile",
    icon: <UserOutlined />,
    label: <Link to="/artisan/profile">Hồ sơ của tôi</Link>,
  },
];

const pageTitles: Record<string, string> = {
  "/artisan": "Dashboard",
  "/artisan/schedule": "Lịch trình của tôi",
  "/artisan/profile": "Hồ sơ của tôi",
};

const breadcrumbMap: Record<string, { title: string; path?: string }[]> = {
  "/artisan": [{ title: "Dashboard" }],
  "/artisan/schedule": [
    { title: "Dashboard", path: "/artisan" },
    { title: "Lịch trình của tôi" },
  ],
  "/artisan/profile": [
    { title: "Dashboard", path: "/artisan" },
    { title: "Hồ sơ của tôi" },
  ],
};

function ArtisanLayoutContent({ children }: ArtisanLayoutProps) {
  const content = children || <Outlet />;
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { message } = App.useApp();

  const handleLogout = async () => {
    try {
      await authLogout();
    } catch (err) {
      console.error("[ArtisanLayout] Logout API error:", err);
    } finally {
      clearAuthSession();
      localStorage.removeItem("rememberAccount");
      message.success("Đăng xuất thành công");
      window.location.href = "/";
    }
  };

  const currentPath = location.pathname;
  const pageTitle = pageTitles[currentPath] || "Dashboard";
  const breadcrumbItems = breadcrumbMap[currentPath] || [{ title: "Dashboard" }];

  const userInfo = (() => {
    try {
      const s = localStorage.getItem("userInfo");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  })();

  return (
    <Layout
      className="artisan-panel-layout"
      style={{ minHeight: "100vh", background: "#f5f5f5" }}
    >
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
            <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
              <div style={{ fontWeight: "bold", fontSize: 16, color: "#262626" }}>
                Cội Việt
              </div>
              <div style={{ fontSize: 12, color: "#8c8c8c" }}>Artisan Panel</div>
            </div>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentPath]}
          items={menuItems}
          style={{ borderRight: 0, padding: "12px 8px" }}
        />
        <div style={{ padding: "8px", borderTop: "1px solid #f0f0f0" }}>
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
            onClick={() => handleLogout()}
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
              icon={React.createElement(
                collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
                { style: { fontSize: 18 } }
              )}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
              }}
            />
            <Divider orientation="vertical" style={{ height: 32, margin: 0 }} />
            <Breadcrumb
              items={breadcrumbItems.map((item) => ({
                title: item.path ? (
                  <Link to={item.path}>{item.title}</Link>
                ) : (
                  item.title
                ),
              }))}
              style={{ fontSize: 14 }}
            />
          </div>

          <Space style={{ marginLeft: 24 }}>
            <Avatar
              size={40}
              style={{ backgroundColor: "#8B0000", flexShrink: 0 }}
            >
              {userInfo?.fullName?.[0]?.toUpperCase() ?? "A"}
            </Avatar>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.5 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#262626" }}>
                {userInfo?.fullName ?? "Nghệ nhân"}
              </span>
              <span style={{ fontSize: 12, color: "#8c8c8c" }}>
                {userInfo?.email ?? ""}
              </span>
            </div>
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
          }}
        >
          {content}
        </Content>
      </Layout>
    </Layout>
  );
}

export default function ArtisanLayout(props: ArtisanLayoutProps) {
  return (
    <ConfigProvider theme={antdTheme}>
      <App>
        <ArtisanLayoutContent {...props} />
      </App>
    </ConfigProvider>
  );
}
