import { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Avatar,
  Spin,
  Alert,
  App,
  Typography,
} from "antd";
import { UserOutlined } from "@ant-design/icons";

import {
  getMyArtisan,
  getMyArtisanForEdit,
  getMyArtisanDetail,
  updateMyArtisanProfile,
} from "../../services/artisanPanelApi";
import { getProvinces } from "../../services/api";
import { getApiErrorMessage } from "../../services/api";
import type { AdminArtisan, AdminArtisanDetail } from "../../services/adminApi";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function ArtisanProfile() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const profileImageUrl = Form.useWatch("profileImageUrl", form);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [artisanId, setArtisanId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AdminArtisanDetail | null>(null);
  const [editData, setEditData] = useState<AdminArtisan | null>(null);
  const [provinces, setProvinces] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    getProvinces().then((list) =>
      setProvinces(list.map((p) => ({ id: p.id, name: p.name }))),
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const myArtisan = await getMyArtisan();
        if (cancelled) return;
        if (!myArtisan) {
          setError("Không tìm thấy hồ sơ nghệ nhân. Vui lòng liên hệ Admin.");
          setArtisanId(null);
          setDetail(null);
          return;
        }
        setArtisanId(myArtisan.id);
        const [d, edit] = await Promise.all([
          getMyArtisanDetail(myArtisan.id),
          getMyArtisanForEdit(myArtisan.id),
        ]);
        if (cancelled) return;
        setDetail(d ?? null);
        setEditData(edit ?? null);
        const source = edit ?? d;
        if (source) {
          const provinceId = edit?.province?.id;
          form.setFieldsValue({
            fullName: source.fullName,
            specialization: source.specialization,
            bio: source.bio,
            workshopAddress: edit?.workshopAddress,
            profileImageUrl: source.profileImageUrl,
            provinceId: provinceId ?? undefined,
          });
        }
      } catch (err) {
        if (cancelled) return;
        console.error("[ArtisanProfile]", err);
        setError("Không thể tải hồ sơ.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [form]);

  const handleSubmit = async () => {
    if (artisanId == null) return;
    try {
      const values = await form.validateFields();
      setSaving(true);
      setError(null);

      await updateMyArtisanProfile(artisanId, {
        fullName: values.fullName?.trim(),
        specialization: values.specialization?.trim(),
        bio: values.bio?.trim() || undefined,
        workshopAddress: values.workshopAddress?.trim() || undefined,
        profileImageUrl: values.profileImageUrl?.trim() || undefined,
        provinceId: values.provinceId ? Number(values.provinceId) : undefined,
      });

      message.success("Đã cập nhật hồ sơ thành công");
      const [d, edit] = await Promise.all([
        getMyArtisanDetail(artisanId),
        getMyArtisanForEdit(artisanId),
      ]);
      if (d) setDetail(d);
      if (edit) setEditData(edit);
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      const msg = getApiErrorMessage(err);
      setError(msg || "Cập nhật thất bại. Vui lòng thử lại.");
      message.error(msg || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" tip="Đang tải hồ sơ..." />
      </div>
    );
  }

  if (error && !artisanId) {
    return (
      <Alert
        type="warning"
        message={error}
        showIcon
        description="Bạn có thể cần liên hệ Admin để được gắn tài khoản với hồ sơ nghệ nhân."
      />
    );
  }

  return (
    <div>
      <header style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, fontWeight: 600, color: "#1a1a1a" }}>
          Hồ sơ của tôi
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          Chỉnh sửa thông tin cá nhân và chuyên môn
        </Text>
      </header>

      <Card
        style={{
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          maxWidth: 640,
        }}
      >
        <div style={{ display: "flex", gap: 24, marginBottom: 24, flexWrap: "wrap" }}>
          <Avatar
            size={100}
            src={profileImageUrl ?? editData?.profileImageUrl ?? detail?.profileImageUrl}
            style={{ backgroundColor: "#8B0000", flexShrink: 0 }}
            icon={!profileImageUrl && !editData?.profileImageUrl && !detail?.profileImageUrl ? <UserOutlined /> : undefined}
          />
          <div style={{ flex: 1, minWidth: 200 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Ảnh đại diện (URL)
            </Text>
            <Form.Item name="profileImageUrl" noStyle>
              <Input placeholder="https://..." style={{ marginTop: 4 }} />
            </Form.Item>
          </div>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            showIcon
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setError(null)}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="fullName"
            label="Họ tên"
            rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
          >
            <Input placeholder="Họ và tên đầy đủ" />
          </Form.Item>

          <Form.Item
            name="specialization"
            label="Chuyên môn"
            rules={[{ required: true, message: "Vui lòng nhập chuyên môn" }]}
          >
            <Input placeholder="Ví dụ: Gốm sứ, Tranh Đông Hồ, Thêu..." />
          </Form.Item>

          <Form.Item name="bio" label="Giới thiệu">
            <TextArea rows={4} placeholder="Mô tả ngắn về bản thân và nghề nghiệp" />
          </Form.Item>

          <Form.Item name="workshopAddress" label="Địa chỉ xưởng">
            <Input placeholder="Địa chỉ xưởng/studio" />
          </Form.Item>

          <Form.Item name="provinceId" label="Tỉnh/Thành phố">
            <Select
              placeholder="Chọn tỉnh/thành"
              allowClear
              showSearch
              optionFilterProp="label"
              options={provinces.map((p) => ({
                value: p.id,
                label: p.name,
              }))}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              style={{ background: "#8B0000", borderColor: "#8B0000" }}
            >
              Lưu thay đổi
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
