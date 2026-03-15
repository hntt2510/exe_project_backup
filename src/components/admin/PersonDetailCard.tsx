import { Avatar, Card, Row, Col, Tag } from "antd";
import { UserOutlined } from "@ant-design/icons";

export interface DetailInfoRow {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

interface PersonDetailCardProps {
  avatarUrl?: string;
  name: string;
  subtitle?: string;
  status?: "ACTIVE" | "INACTIVE";
  statusLabel?: string;
  infoSections: {
    title?: string;
    rows: DetailInfoRow[];
  }[];
  extraContent?: React.ReactNode;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  ACTIVE: { color: "success", label: "Hoạt động" },
  INACTIVE: { color: "default", label: "Không hoạt động" },
};

export default function PersonDetailCard({
  avatarUrl,
  name,
  subtitle,
  status,
  statusLabel,
  infoSections,
  extraContent,
}: PersonDetailCardProps) {
  return (
    <div style={{ padding: "4px 0" }}>
      {/* Header: Avatar + Name */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 28,
          padding: "24px 0 32px",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Avatar
          size={160}
          src={avatarUrl}
          style={{
            backgroundColor: "#8B0000",
            flexShrink: 0,
          }}
          icon={!avatarUrl ? <UserOutlined /> : undefined}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 700,
              color: "#1a1a1a",
              lineHeight: 1.3,
            }}
          >
            {name}
          </h2>
          {subtitle && (
            <p
              style={{
                margin: "8px 0 12px 0",
                fontSize: 16,
                color: "#8B0000",
                fontWeight: 600,
              }}
            >
              {subtitle}
            </p>
          )}
          {status && (
            <Tag
              color={statusConfig[status]?.color || "default"}
              style={{
                fontSize: 14,
                padding: "6px 16px",
                borderRadius: 20,
                fontWeight: 500,
              }}
            >
              {statusLabel || statusConfig[status]?.label || status}
            </Tag>
          )}
        </div>
      </div>

      {/* Info sections */}
      <div style={{ marginTop: 28 }}>
        {infoSections.map((section, idx) => (
          <Card
            key={idx}
            size="small"
            style={{
              marginBottom: 20,
              borderRadius: 12,
              border: "1px solid #e8e8e8",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
            styles={{ body: { padding: 20 } }}
          >
            {section.title && (
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#8c8c8c",
                  marginBottom: 16,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {section.title}
              </div>
            )}
            <Row gutter={[24, 20]}>
              {section.rows.map((row, rowIdx) => (
                <Col xs={24} sm={row.label ? 12 : 24} key={rowIdx}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                    }}
                  >
                    {row.icon && (
                      <span style={{ color: "#8B0000", marginTop: 2 }}>
                        {row.icon}
                      </span>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {row.label && (
                        <div
                          style={{
                            fontSize: 13,
                            color: "#8c8c8c",
                            marginBottom: 4,
                          }}
                        >
                          {row.label}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 500,
                          color: "#262626",
                          lineHeight: 1.6,
                        }}
                      >
                        {row.value}
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        ))}
      </div>

      {extraContent}
    </div>
  );
}
