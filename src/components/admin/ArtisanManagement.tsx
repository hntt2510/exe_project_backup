import { useState, useEffect } from "react";
import {
  App,
  Card,
  Row,
  Col,
  Avatar,
  Tag,
  Button,
  Space,
  Select,
  Input,
  Modal,
  Form,
  Alert,
  Table,
  Popconfirm,
  Empty,
  DatePicker,
} from "antd";
import dayjs from "dayjs";
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  EnvironmentOutlined,
  TrophyOutlined,
  UserOutlined,
  HomeOutlined,
  SearchOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import PersonDetailCard from "./PersonDetailCard";
import ArtisanSummaryCards from "./ArtisanSummaryCards";
import {
  getAdminArtisans,
  createArtisan,
  updateArtisan,
  deleteArtisan,
  getAdminUsers,
  getAdminArtisanById,
  getAdminArtisanDetail,
  updateUserStatus,
  updateUserRole,
  updateUserRoleAndStatus,
  type UpdateArtisanRequest,
  type CreateArtisanRequest,
  type AdminArtisanDetail,
} from "../../services/adminApi";
import {
  getArtisans,
  getProvinces,
  getApiErrorMessage,
} from "../../services/api";

/** Chỉ chứa các field có trong API response /api/artisans/public */
interface Artisan {
  id: string;
  name: string;
  specialty: string;
  location: string;
  provinceId?: number;
  status: "ACTIVE" | "INACTIVE";
  profileImageUrl?: string;
  bio?: string;
  workshopAddress?: string;
  totalTours?: number;
  averageRating?: number;
  createdAt?: string;
  userId?: number; // ID của user account để khóa tài khoản
  userStatus?: "ACTIVE" | "INACTIVE"; // Status của user account
  userRole?: "CUSTOMER" | "STAFF" | "ARTISAN"; // Role user từ backend
}

export default function ArtisanManagement() {
  const { message } = App.useApp();
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  const [filter, setFilter] = useState<{
    location: string;
    status: string;
    search: string;
  }>({
    location: "all",
    status: "all",
    search: "",
  });
  const [searchInput, setSearchInput] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState<AdminArtisanDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedArtisan, setSelectedArtisan] = useState<Artisan | null>(null);
  const [provinces, setProvinces] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [userOptions, setUserOptions] = useState<
    { id: number; fullName: string; email: string }[]
  >([]);

  const isFallbackMode = !!fallbackNotice;

  useEffect(() => {
    getProvinces().then((list) =>
      setProvinces(list.map((p) => ({ id: p.id, name: p.name }))),
    );
  }, []);

  const mapApiToArtisan = (item: unknown): Artisan => {
    const a = item as Record<string, unknown>;
    const province = a.province as { id?: number; name?: string } | undefined;
    const user = a.user as
      | { id?: number; avatarUrl?: string; status?: string; role?: string }
      | undefined;
    const provinceName = province?.name ?? "";
    const provinceId = province?.id;
    const isActive = a.isActive as boolean | undefined;
    const status = isActive === false ? "INACTIVE" : "ACTIVE";
    const profileImageUrl =
      (a.profileImageUrl as string) ?? (user?.avatarUrl as string) ?? "";
    return {
      id: String(a.id),
      name: (a.fullName as string) ?? "",
      specialty: (a.specialization as string) ?? "",
      location: provinceName,
      provinceId,
      status: status as "ACTIVE" | "INACTIVE",
      profileImageUrl,
      bio: (a.bio as string) ?? "",
      workshopAddress: (a.workshopAddress as string) ?? "",
      totalTours: (a.totalTours as number) ?? 0,
      averageRating: (a.averageRating as number) ?? 0,
      createdAt: (a.createdAt as string) ?? "",
      userId: user?.id,
      userStatus: user?.status as "ACTIVE" | "INACTIVE" | undefined,
      userRole: ["CUSTOMER", "STAFF", "ARTISAN"].includes(user?.role as string)
        ? (user.role as "CUSTOMER" | "STAFF" | "ARTISAN")
        : "ARTISAN",
    };
  };

  const fetchArtisans = async () => {
    try {
      setLoading(true);
      setError(null);
      setFallbackNotice(null);

      try {
        const { data } = await getAdminArtisans({ limit: 500 });
        const rawList = (data || []) as unknown[];
        setArtisans(rawList.map(mapApiToArtisan));
      } catch (adminErr: unknown) {
        try {
          const raw = await getArtisans();
          const apiArtisans = Array.isArray(raw) ? raw : [];
          setArtisans(apiArtisans.map(mapApiToArtisan));
          // Không set fallbackNotice → isFallbackMode = false → vẫn sửa/xóa được khi đã đăng nhập
        } catch (publicErr) {
          console.error("Fallback public API also failed:", publicErr);
          throw adminErr;
        }
      }
    } catch (err) {
      console.error("Error fetching artisans:", err);
      setError("Không thể tải dữ liệu nghệ nhân. Vui lòng thử lại sau.");
      message.error("Không thể tải dữ liệu nghệ nhân");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtisans();
  }, []);

  const provinceOptions = [
    ...provinces.map((p) => p.name),
    ...Array.from(new Set(artisans.map((a) => a.location).filter(Boolean))),
  ].filter(Boolean);
  const uniqueProvinces = Array.from(new Set(provinceOptions)).sort();

  const filteredArtisans = artisans.filter((artisan) => {
    if (filter.location !== "all" && artisan.location !== filter.location)
      return false;
    if (filter.status !== "all" && artisan.status !== filter.status)
      return false;
    if (filter.search?.trim()) {
      const q = filter.search.toLowerCase();
      return artisan.name?.toLowerCase().includes(q);
    }
    return true;
  });

  const hasActiveFilters =
    filter.location !== "all" ||
    filter.status !== "all" ||
    (filter.search?.trim()?.length ?? 0) > 0;

  const handleClearFilters = () => {
    setFilter({ location: "all", status: "all", search: "" });
    setSearchInput("");
  };

  const handleViewDetail = async (record: Artisan) => {
    setSelectedArtisan(record);
    setDetailModalOpen(true);
    setDetailData(null);
    setDetailLoading(true);
    try {
      const data = await getAdminArtisanDetail(Number(record.id));
      setDetailData(data);
    } catch (err) {
      console.error("Error fetching artisan detail:", err);
      message.error("Không thể tải chi tiết nghệ nhân");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenEdit = async (
    record: Artisan,
    fromDetail?: AdminArtisanDetail | null,
  ) => {
    setSelectedArtisan(record);
    setDetailModalOpen(false);
    setDetailData(null);

    let editData: Record<string, unknown> = {
      fullName: record.name,
      specialization: record.specialty,
      bio: record.bio || "",
      profileImageUrl: record.profileImageUrl || "",
      workshopAddress: record.workshopAddress || "",
      provinceId: record.provinceId,
      userStatus: record.userStatus || "ACTIVE",
      userRole: record.userRole || "ARTISAN",
    };

    if (fromDetail) {
      editData.ethnicity = fromDetail.ethnicity || "";
      editData.heroSubtitle = fromDetail.heroSubtitle || "";
      editData.panoramaImageUrl = fromDetail.panoramaImageUrl || "";
      editData.images = Array.isArray(fromDetail.images)
        ? fromDetail.images.join("\n")
        : "";
      editData.narrativeContent = fromDetail.narrativeContent?.length
        ? JSON.stringify(fromDetail.narrativeContent, null, 2)
        : "";
    }

    try {
      let artisanDetail: { user?: { id?: number; status?: string; role?: string; dateOfBirth?: string }; province?: { id?: number }; dateOfBirth?: string; ethnicity?: string; heroSubtitle?: string; panoramaImageUrl?: string; images?: string | string[]; narrativeContent?: string };
      try {
        artisanDetail = await getAdminArtisanById(parseInt(record.id));
      } catch {
        const detail = await getAdminArtisanDetail(parseInt(record.id));
        artisanDetail = { ...detail } as typeof artisanDetail;
        const byLocation = provinces.find((p) => p.name === (detail as { location?: string }).location);
        if (byLocation) editData.provinceId = byLocation.id;
      }
      editData.userStatus =
        (artisanDetail.user?.status as "ACTIVE" | "INACTIVE") ||
        editData.userStatus;
      editData.userId = artisanDetail.user?.id ?? record.userId;
      const userRole = artisanDetail.user?.role;
      editData.userRole = ["CUSTOMER", "STAFF", "ARTISAN"].includes(userRole || "")
        ? (userRole as "CUSTOMER" | "STAFF" | "ARTISAN")
        : "ARTISAN";
      editData.provinceId = (artisanDetail as { province?: { id?: number } }).province?.id ?? record.provinceId ?? editData.provinceId;

      let dateOfBirth =
        artisanDetail.dateOfBirth ||
        artisanDetail.user?.dateOfBirth ||
        "";
      if (!dateOfBirth && fromDetail?.age != null) {
        const birthYear = new Date().getFullYear() - fromDetail.age;
        dateOfBirth = `${birthYear}-01-01`;
      }
      editData.dateOfBirth = dateOfBirth ? dayjs(dateOfBirth) : undefined;

      if (!fromDetail) {
        editData.ethnicity = artisanDetail.ethnicity || "";
        editData.heroSubtitle = artisanDetail.heroSubtitle || "";
        editData.panoramaImageUrl = artisanDetail.panoramaImageUrl || "";
        editData.images =
          typeof artisanDetail.images === "string"
            ? artisanDetail.images
            : Array.isArray(artisanDetail.images)
              ? artisanDetail.images.join("\n")
              : "";
        editData.narrativeContent = artisanDetail.narrativeContent || "";
      }
    } catch (err) {
      console.error("Error fetching artisan detail:", err);
    }

    editForm.setFieldsValue(editData);
    setEditModalOpen(true);
  };

  const handleOpenCreate = async () => {
    form.resetFields();
    setIsModalOpen(true);
    if (!isFallbackMode) {
      try {
        const { data } = await getAdminUsers({ limit: 500 });
        setUserOptions(
          (data || []).map((u) => ({
            id: u.id,
            fullName: u.fullName || u.username || `User #${u.id}`,
            email: u.email || "",
          })),
        );
      } catch {
        message.warning("Không thể tải danh sách user. Vui lòng thử lại.");
      }
    }
  };

  const handleCreateArtisan = async () => {
    if (isFallbackMode) return;
    try {
      const values = await form.validateFields();
      const selectedUser = userOptions.find((u) => u.id === values.userId);
      setCreateLoading(true);

      const payload: CreateArtisanRequest = {
        user: { id: values.userId },
        fullName:
          values.fullName?.trim() || selectedUser?.fullName || "Nghệ nhân",
        specialization: values.specialization?.trim() || "",
      };

      if (values.bio?.trim()) payload.bio = values.bio.trim();
      if (values.workshopAddress?.trim())
        payload.workshopAddress = values.workshopAddress.trim();
      if (values.profileImageUrl?.trim())
        payload.profileImageUrl = values.profileImageUrl.trim();
      if (values.heroSubtitle?.trim())
        payload.heroSubtitle = values.heroSubtitle.trim();
      if (values.panoramaImageUrl?.trim())
        payload.panoramaImageUrl = values.panoramaImageUrl.trim();
      if (values.ethnicity?.trim()) payload.ethnicity = values.ethnicity.trim();
      if (values.dateOfBirth) {
        const dob = dayjs(values.dateOfBirth);
        if (dob.isAfter(dayjs(), "day")) {
          message.error("Ngày sinh phải trong quá khứ.");
          setCreateLoading(false);
          return;
        }
        if (dayjs().diff(dob, "year") < 16) {
          message.error("Nghệ nhân phải ít nhất 16 tuổi.");
          setCreateLoading(false);
          return;
        }
        payload.dateOfBirth = dob.format("YYYY-MM-DD");
      }

      if (values.images?.trim()) {
        const imgVal = values.images.trim();
        if (imgVal.startsWith("[")) {
          try {
            const parsed = JSON.parse(imgVal);
            const arr = Array.isArray(parsed) ? parsed : [];
            payload.images = arr.length > 0 ? JSON.stringify(arr) : undefined;
          } catch {
            const arr = imgVal
              .split(/[\n,]+/)
              .map((s: string) => s.trim())
              .filter(Boolean);
            payload.images = arr.length > 0 ? JSON.stringify(arr) : undefined;
          }
        } else {
          const arr = imgVal
            .split(/[\n,]+/)
            .map((s: string) => s.trim())
            .filter(Boolean);
          payload.images = arr.length > 0 ? JSON.stringify(arr) : undefined;
        }
      }

      if (values.narrativeContent?.trim()) {
        const nc = values.narrativeContent.trim();
        try {
          JSON.parse(nc);
          payload.narrativeContent = nc;
        } catch {
          message.warning("Narrative content phải là JSON hợp lệ. Đã bỏ qua.");
        }
      }

      if (values.provinceId) {
        payload.province = { id: Number(values.provinceId) };
      }

      await createArtisan(payload);
      message.success("Đã thêm nghệ nhân thành công");
      setIsModalOpen(false);
      form.resetFields();
      fetchArtisans();
    } catch (err: unknown) {
      if ((err as { errorFields?: unknown[] })?.errorFields) return;
      const msg = getApiErrorMessage(err);
      const axiosErr = err as { response?: { data?: unknown } };
      console.error("[ArtisanManagement] createArtisan error:", err);
      console.error("[ArtisanManagement] Backend response:", axiosErr.response?.data);
      message.error(msg || "Thêm nghệ nhân thất bại. Vui lòng thử lại.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteArtisan = async (record: Artisan) => {
    if (isFallbackMode) {
      message.warning("Đang dùng dữ liệu fallback, không thể xóa.");
      return;
    }
    try {
      await deleteArtisan(parseInt(record.id));
      message.success("Đã xóa nghệ nhân");
      setEditModalOpen(false);
      setSelectedArtisan(null);
      fetchArtisans();
    } catch (err) {
      message.error("Xóa nghệ nhân thất bại. Vui lòng thử lại.");
      throw err;
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedArtisan || isFallbackMode) return;
    try {
      const values = await editForm.validateFields();
      setSaving(true);

      // dateOfBirth: DatePicker trả Dayjs, chuyển sang YYYY-MM-DD
      const dateOfBirthStr = values.dateOfBirth
        ? dayjs(values.dateOfBirth).format("YYYY-MM-DD")
        : undefined;

      // Cập nhật thông tin nghệ nhân - khớp PUT /api/artisans/{id}
      const payload: UpdateArtisanRequest = {
        fullName: values.fullName?.trim(),
        specialization: values.specialization?.trim(),
        bio: values.bio?.trim() || undefined,
        workshopAddress: values.workshopAddress?.trim() || undefined,
        ethnicity: values.ethnicity?.trim() || undefined,
        dateOfBirth: dateOfBirthStr,
        heroSubtitle: values.heroSubtitle?.trim() || undefined,
        panoramaImageUrl: values.panoramaImageUrl?.trim() || undefined,
      };

      if (values.profileImageUrl?.trim()) {
        payload.profileImageUrl = values.profileImageUrl.trim();
      }

      // images: backend nhận string (JSON array) hoặc array
      if (values.images?.trim()) {
        const imgVal = values.images.trim();
        if (imgVal.startsWith("[")) {
          payload.images = imgVal;
        } else {
          const arr = imgVal
            .split(/[\n,]+/)
            .map((s: string) => s.trim())
            .filter(Boolean);
          payload.images = arr.length > 0 ? arr : undefined;
        }
      }

      // narrativeContent: string (JSON)
      if (values.narrativeContent?.trim()) {
        try {
          JSON.parse(values.narrativeContent.trim());
          payload.narrativeContent = values.narrativeContent.trim();
        } catch {
          message.warning("Narrative content phải là JSON hợp lệ. Đã bỏ qua.");
        }
      }

      // province: backend có thể nhận provinceId hoặc province: { id }
      if (values.provinceId) {
        payload.province = { id: Number(values.provinceId) };
      }

      // Đảm bảo id là number
      const artisanId =
        typeof selectedArtisan.id === "string"
          ? parseInt(selectedArtisan.id, 10)
          : selectedArtisan.id;

      // Lấy userId trước để cập nhật role/status (giống UserManagement)
      let userId = values.userId || selectedArtisan.userId;
      if (!userId) {
        try {
          const artisanDetail = await getAdminArtisanById(
            parseInt(selectedArtisan.id),
          );
          userId = artisanDetail.user?.id;
        } catch (err) {
          console.error(
            "[ArtisanManagement] Error fetching artisan detail for userId:",
            err,
          );
        }
      }

      const newUserStatus = values.userStatus as
        | "ACTIVE"
        | "INACTIVE"
        | undefined;
      const newUserRole = values.userRole as "CUSTOMER" | "STAFF" | "ARTISAN" | undefined;
      const oldUserStatus = selectedArtisan.userStatus;
      const oldUserRole = (selectedArtisan as Artisan & { userRole?: string })?.userRole;
      const oldR = oldUserRole || "ARTISAN";
      const newR = newUserRole || "ARTISAN";

      const roleChanged = Boolean(newUserRole && newR !== oldR);
      const statusChanged = newUserStatus && newUserStatus !== oldUserStatus;

      // Cập nhật role/status TRƯỚC (đúng flow như UserManagement - PUT /api/admin/users/{id}/role, status)
      if (userId && (roleChanged || statusChanged)) {
        try {
          if (roleChanged && statusChanged) {
            await updateUserRoleAndStatus(
              userId,
              newUserRole! as "CUSTOMER" | "STAFF" | "ARTISAN",
              newUserStatus!,
            );
          } else if (roleChanged) {
            await updateUserRole(userId, newUserRole! as "CUSTOMER" | "STAFF" | "ARTISAN");
          } else if (statusChanged) {
            await updateUserStatus(userId, newUserStatus!);
          }
        } catch (err) {
          console.error(
            "[ArtisanManagement] ❌ Error updating user role/status:",
            err,
          );
          message.warning(
            "Không thể cập nhật vai trò/trạng thái tài khoản. Vui lòng thử lại.",
          );
          setSaving(false);
          return;
        }
      }

      // Chỉ bỏ qua update artisan khi chuyển role sang CUSTOMER/STAFF (không còn là nghệ nhân)
      const skipArtisanUpdate = roleChanged && (newR === "CUSTOMER" || newR === "STAFF");
      if (!skipArtisanUpdate) {
        try {
          await updateArtisan(artisanId, payload);
        } catch (err) {
          console.error("[ArtisanManagement] Error updating artisan:", err);
          throw err;
        }
      }

      message.success(
        roleChanged
          ? "Đã cập nhật vai trò/trạng thái thành công"
          : "Cập nhật nghệ nhân thành công",
      );
      setEditModalOpen(false);
      setSelectedArtisan(null);
      fetchArtisans();
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      console.error("[ArtisanManagement] handleSaveEdit error:", err);
      message.error(
        getApiErrorMessage(err) || "Cập nhật thất bại. Vui lòng thử lại.",
      );
    } finally {
      setSaving(false);
    }
  };

  /** Thống kê tính từ danh sách artisans (đã loại trừ CUSTOMER/STAFF) */
  const stats = {
    total: artisans.length,
    active: artisans.filter((a) => a.status === "ACTIVE").length,
    inactive: artisans.filter((a) => a.status === "INACTIVE").length,
    avgRating:
      artisans.length > 0
        ? (
            artisans.reduce(
              (sum, a) => sum + (a.averageRating || 0),
              0,
            ) / artisans.length
          ).toFixed(1)
        : "0.0",
  };

  const columns = [
    {
      title: "Nghệ nhân",
      key: "artisan",
      width: 220,
      fixed: "left" as const,
      render: (_: unknown, record: Artisan) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar
            size={48}
            src={record.profileImageUrl}
            style={{ backgroundColor: "#8B0000", flexShrink: 0 }}
            icon={!record.profileImageUrl ? <UserOutlined /> : undefined}
          />
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#262626",
                marginBottom: 2,
              }}
            >
              {record.name}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#8B0000",
                fontWeight: 500,
              }}
            >
              {record.specialty ? `Nghệ nhân ${record.specialty}` : "Nghệ nhân"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Chuyên môn",
      key: "specialty",
      width: 180,
      render: (_: unknown, record: Artisan) => (
        <div>
          <TrophyOutlined style={{ color: "#faad14", marginRight: 6 }} />
          <span style={{ fontWeight: 500 }}>{record.specialty}</span>
        </div>
      ),
    },
    {
      title: "Địa điểm",
      key: "location",
      width: 160,
      render: (_: unknown, record: Artisan) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <EnvironmentOutlined style={{ color: "#52c41a" }} />
          <span style={{ fontWeight: 500 }}>{record.location}</span>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 130,
      render: (_: unknown, record: Artisan) => (
        <Tag
          color={record.status === "ACTIVE" ? "success" : "default"}
          style={{
            fontSize: 12,
            padding: "4px 12px",
            borderRadius: 12,
            fontWeight: 500,
          }}
        >
          {record.status === "ACTIVE" ? "✓ Hoạt động" : "○ Không hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 140,
      fixed: "right" as const,
      render: (_: unknown, record: Artisan) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewDetail(record)}
          >
            Xem chi tiết
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleOpenEdit(record)}
            disabled={isFallbackMode}
          >
            Sửa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      <Card
        style={{
          background: "#fff",
          border: "1px solid #e8e8e8",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 600,
                color: "#262626",
              }}
            >
              Quản lý Nghệ nhân
            </h2>
            <p
              style={{
                margin: "4px 0 0 0",
                color: "#8c8c8c",
                fontSize: 14,
              }}
            >
              Quản lý thông tin nghệ nhân và tour liên quan
            </p>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreate}
              disabled={isFallbackMode}
            >
              Thêm nghệ nhân
            </Button>
          </Col>
        </Row>
      </Card>

      <ArtisanSummaryCards stats={stats} />

      <Card
        style={{
          background: "#fff",
          border: "1px solid #e8e8e8",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <div style={{ marginBottom: 4, fontSize: 13, color: "#595959" }}>
              Địa điểm
            </div>
            <Select
              style={{ width: "100%" }}
              placeholder="Tất cả địa điểm"
              value={filter.location}
              onChange={(value) => setFilter({ ...filter, location: value })}
            >
              <Select.Option value="all">Tất cả địa điểm</Select.Option>
              {uniqueProvinces.map((province) => (
                <Select.Option key={province} value={province}>
                  {province}
                </Select.Option>
              ))}
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
              placeholder="Tìm theo tên nghệ nhân..."
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

        {fallbackNotice && (
          <Alert
            title={fallbackNotice}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {error && (
          <Alert
            title="Lỗi"
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
            scroll={{ x: 800 }}
            pagination={false}
          />
        ) : filteredArtisans.length === 0 ? (
          <Empty
            description={
              <span>
                {hasActiveFilters
                  ? "Không tìm thấy nghệ nhân nào phù hợp với bộ lọc."
                  : "Chưa có nghệ nhân nào."}
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
            dataSource={filteredArtisans}
            rowKey="id"
            loading={loading}
            scroll={{ x: 800 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} nghệ nhân`,
            }}
          />
        )}
      </Card>

      <Modal
        title="Thêm nghệ nhân mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={680}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ maxHeight: "70vh", overflowY: "auto" }}
        >
          <Form.Item
            label="Tài khoản (User)"
            name="userId"
            rules={[{ required: true, message: "Vui lòng chọn user" }]}
          >
            <Select
              placeholder="Chọn user để gán làm nghệ nhân"
              showSearch
              optionFilterProp="label"
              options={userOptions.map((u) => ({
                value: u.id,
                label: `${u.fullName}${u.email ? ` (${u.email})` : ""}`,
              }))}
              onChange={(userId) => {
                const u = userOptions.find((x) => x.id === userId);
                if (u?.fullName) form.setFieldValue("fullName", u.fullName);
              }}
            />
          </Form.Item>
          <Form.Item
            label="Họ tên"
            name="fullName"
            rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
          >
            <Input placeholder="Họ tên nghệ nhân" />
          </Form.Item>
          <Form.Item
            label="Chuyên môn"
            name="specialization"
            rules={[{ required: true, message: "Vui lòng nhập chuyên môn" }]}
          >
            <Input placeholder="VD: Gốm, Đan lát, Dệt thổ cẩm..." />
          </Form.Item>
          <Form.Item label="Phụ đề hero" name="heroSubtitle">
            <Input placeholder="VD: Nghệ Nhân Chỉnh Chiêng Bậc Thầy" />
          </Form.Item>
          <Form.Item label="Giới thiệu" name="bio">
            <Input.TextArea rows={4} placeholder="Mô tả ngắn về nghệ nhân" />
          </Form.Item>
          <Form.Item label="Ảnh đại diện (URL)" name="profileImageUrl">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item
            label="Hình ảnh (URL)"
            name="images"
            extra="Mỗi URL cách nhau bởi dấu phẩy hoặc xuống dòng"
          >
            <Input.TextArea rows={2} placeholder="https://... , https://..." />
          </Form.Item>
          <Form.Item label="Ảnh panorama (URL)" name="panoramaImageUrl">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item label="Dân tộc" name="ethnicity">
            <Input placeholder="VD: Ba Na, Jrai" />
          </Form.Item>
          <Form.Item label="Ngày sinh" name="dateOfBirth">
            <DatePicker
              format="DD/MM/YYYY"
              placeholder="Chọn ngày sinh"
              style={{ width: "100%" }}
              allowClear
            />
          </Form.Item>
          <Form.Item
            label="Narrative content (JSON)"
            name="narrativeContent"
            extra='Mảng JSON: [{"title":"...","content":"...","imageUrl":"..."}]'
          >
            <Input.TextArea
              rows={4}
              placeholder='[{"title":"...","content":"...","imageUrl":"..."}]'
            />
          </Form.Item>
          <Form.Item label="Tỉnh thành" name="provinceId">
            <Select placeholder="Chọn tỉnh thành" allowClear>
              {provinces.map((p) => (
                <Select.Option key={p.id} value={p.id}>
                  {p.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Địa chỉ xưởng" name="workshopAddress">
            <Input placeholder="Địa chỉ cụ thể" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                onClick={handleCreateArtisan}
                loading={createLoading}
              >
                Tạo
              </Button>
              <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Chi tiết nghệ nhân"
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          setSelectedArtisan(null);
          setDetailData(null);
        }}
        footer={[
          <Button
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              if (selectedArtisan) handleOpenEdit(selectedArtisan, detailData);
            }}
            disabled={isFallbackMode}
          >
            Chỉnh sửa
          </Button>,
          <Button
            key="close"
            onClick={() => {
              setDetailModalOpen(false);
              setSelectedArtisan(null);
              setDetailData(null);
            }}
          >
            Đóng
          </Button>,
        ]}
        width={800}
      >
        {detailLoading ? (
          <div style={{ textAlign: "center", padding: 48 }}>Đang tải...</div>
        ) : detailData || selectedArtisan ? (
          <PersonDetailCard
            avatarUrl={
              detailData?.profileImageUrl ?? selectedArtisan?.profileImageUrl
            }
            name={detailData?.fullName ?? selectedArtisan?.name ?? ""}
            subtitle={
              detailData?.heroSubtitle
                ? detailData.heroSubtitle
                : detailData?.specialization
                  ? `Nghệ nhân ${detailData.specialization}`
                  : selectedArtisan?.specialty
                    ? `Nghệ nhân ${selectedArtisan.specialty}`
                    : "Nghệ nhân"
            }
            status={selectedArtisan?.status}
            infoSections={[
              {
                rows: [
                  {
                    label: "Chuyên môn",
                    value:
                      detailData?.specialization ??
                      selectedArtisan?.specialty ??
                      "",
                    icon: <TrophyOutlined />,
                  },
                  {
                    label: "Địa điểm",
                    value:
                      detailData?.location ?? selectedArtisan?.location ?? "",
                    icon: <EnvironmentOutlined />,
                  },
                  {
                    label: "Dân tộc",
                    value: detailData?.ethnicity || "—",
                    icon: <UserOutlined />,
                  },
                  {
                    label: "Tuổi",
                    value:
                      detailData?.age != null ? String(detailData.age) : "—",
                    icon: <UserOutlined />,
                  },
                  {
                    label: "Địa chỉ xưởng",
                    value: selectedArtisan?.workshopAddress || "Chưa có",
                    icon: <HomeOutlined />,
                  },
                  {
                    label: "Đánh giá",
                    value: `${(selectedArtisan?.averageRating ?? 0).toFixed(1)}/5 · ${detailData?.relatedTours?.length ?? selectedArtisan?.totalTours ?? 0} tour`,
                    icon: <TrophyOutlined />,
                  },
                ],
              },
              {
                title: "Giới thiệu",
                rows: [
                  {
                    label: "",
                    value: detailData?.bio ?? selectedArtisan?.bio ?? "Chưa có",
                  },
                ],
              },
              ...(detailData?.relatedTours && detailData.relatedTours.length > 0
                ? [
                    {
                      title: "Tour liên quan",
                      rows: detailData.relatedTours.slice(0, 5).map((t) => ({
                        label: t.title,
                        value: `${t.location} · ${t.price.toLocaleString("vi-VN")}đ`,
                        icon: <TrophyOutlined />,
                      })),
                    },
                  ]
                : []),
              ...(detailData?.relatedCultureItems &&
              detailData.relatedCultureItems.length > 0
                ? [
                    {
                      title: "Văn hoá liên quan",
                      rows: detailData.relatedCultureItems
                        .slice(0, 3)
                        .map((c) => ({
                          label: c.title,
                          value: c.description || "—",
                        })),
                    },
                  ]
                : []),
            ]}
            extraContent={
              detailData ? (
                <div style={{ marginTop: 24 }}>
                  {detailData.panoramaImageUrl && (
                    <Card
                      size="small"
                      style={{
                        marginBottom: 20,
                        borderRadius: 12,
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={detailData.panoramaImageUrl}
                        alt="Panorama"
                        style={{
                          width: "100%",
                          maxHeight: 240,
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </Card>
                  )}
                  {detailData.images && detailData.images.length > 0 && (
                    <Card
                      size="small"
                      style={{ marginBottom: 20, borderRadius: 12 }}
                      styles={{ body: { padding: 16 } }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#8c8c8c",
                          marginBottom: 12,
                          textTransform: "uppercase",
                        }}
                      >
                        Hình ảnh
                      </div>
                      <Row gutter={[8, 8]}>
                        {detailData.images.slice(0, 6).map((url, i) => (
                          <Col xs={12} sm={8} key={i}>
                            <img
                              src={url}
                              alt={`Ảnh ${i + 1}`}
                              style={{
                                width: "100%",
                                aspectRatio: 1,
                                objectFit: "cover",
                                borderRadius: 8,
                              }}
                            />
                          </Col>
                        ))}
                      </Row>
                    </Card>
                  )}
                  {detailData.narrativeContent &&
                    detailData.narrativeContent.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        {detailData.narrativeContent.map((item, idx) => (
                          <Card
                            key={idx}
                            size="small"
                            style={{ marginBottom: 12, borderRadius: 12 }}
                            styles={{ body: { padding: 20 } }}
                          >
                            {item.title && (
                              <div
                                style={{
                                  fontSize: 16,
                                  fontWeight: 600,
                                  color: "#1a1a1a",
                                  marginBottom: 8,
                                }}
                              >
                                {item.title}
                              </div>
                            )}
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                style={{
                                  width: "100%",
                                  maxHeight: 200,
                                  objectFit: "cover",
                                  borderRadius: 8,
                                  marginBottom: 12,
                                }}
                              />
                            )}
                            <div
                              style={{
                                fontSize: 15,
                                color: "#262626",
                                lineHeight: 1.7,
                              }}
                            >
                              {item.content}
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                </div>
              ) : null
            }
          />
        ) : null}
      </Modal>

      <Modal
        title="Chỉnh sửa nghệ nhân"
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          setSelectedArtisan(null);
        }}
        footer={
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Space>
              <Popconfirm
                title="Xóa nghệ nhân"
                description="Bạn có chắc muốn xóa nghệ nhân này? Hành động này không thể hoàn tác."
                onConfirm={() =>
                  selectedArtisan && handleDeleteArtisan(selectedArtisan)
                }
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                disabled={isFallbackMode}
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
                  setSelectedArtisan(null);
                }}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                onClick={handleSaveEdit}
                loading={saving}
                disabled={isFallbackMode}
              >
                Lưu
              </Button>
            </Space>
          </div>
        }
        width={680}
      >
        <Form
          form={editForm}
          layout="vertical"
          style={{ marginTop: 16, maxHeight: "70vh", overflowY: "auto" }}
        >
          <Form.Item name="userId" hidden>
            <Input type="hidden" />
          </Form.Item>
          <Form.Item
            label="Họ tên"
            name="fullName"
            rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
          >
            <Input placeholder="Họ tên nghệ nhân" />
          </Form.Item>
          <Form.Item
            label="Chuyên môn"
            name="specialization"
            rules={[{ required: true, message: "Vui lòng nhập chuyên môn" }]}
          >
            <Input placeholder="VD: Gốm, Đan lát..." />
          </Form.Item>
          <Form.Item label="Phụ đề hero" name="heroSubtitle">
            <Input placeholder="VD: Nghệ Nhân Chỉnh Chiêng Bậc Thầy" />
          </Form.Item>
          <Form.Item label="Giới thiệu" name="bio">
            <Input.TextArea rows={4} placeholder="Mô tả ngắn về nghệ nhân" />
          </Form.Item>
          <Form.Item label="Ảnh đại diện (URL)" name="profileImageUrl">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item
            label="Hình ảnh (URL)"
            name="images"
            extra="Mỗi URL cách nhau bởi dấu phẩy hoặc xuống dòng"
          >
            <Input.TextArea rows={2} placeholder="https://... , https://..." />
          </Form.Item>
          <Form.Item label="Ảnh panorama (URL)" name="panoramaImageUrl">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item label="Dân tộc" name="ethnicity">
            <Input placeholder="VD: Ba Na, Jrai" />
          </Form.Item>
          <Form.Item
            label="Ngày sinh"
            name="dateOfBirth"
            extra="Chọn ngày tháng năm sinh của nghệ nhân"
          >
            <DatePicker
              format="DD/MM/YYYY"
              placeholder="Chọn ngày sinh"
              style={{ width: "100%" }}
              allowClear
            />
          </Form.Item>
          <Form.Item
            label="Narrative content (JSON)"
            name="narrativeContent"
            extra='Mảng JSON: [{"title":"...","content":"...","imageUrl":"..."}]'
          >
            <Input.TextArea
              rows={6}
              placeholder='[{"title":"...","content":"...","imageUrl":"..."}]'
            />
          </Form.Item>
          <Form.Item label="Tỉnh thành" name="provinceId">
            <Select placeholder="Chọn tỉnh thành" allowClear>
              {provinces.map((p) => (
                <Select.Option key={p.id} value={p.id}>
                  {p.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Địa chỉ xưởng" name="workshopAddress">
            <Input placeholder="Địa chỉ cụ thể" />
          </Form.Item>
          <Form.Item
            label="Trạng thái tài khoản"
            name="userStatus"
            tooltip="Chỉ áp dụng nếu nghệ nhân có tài khoản user"
          >
            <Select placeholder="Chọn trạng thái">
              <Select.Option value="ACTIVE">Hoạt động</Select.Option>
              <Select.Option value="INACTIVE">Không hoạt động</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Vai trò tài khoản"
            name="userRole"
            tooltip="Vai trò từ backend: ARTISAN (mặc định), CUSTOMER, STAFF. Không thể chọn ADMIN."
          >
            <Select placeholder="Chọn vai trò">
              <Select.Option value="ARTISAN">Nghệ nhân</Select.Option>
              <Select.Option value="CUSTOMER">Khách hàng</Select.Option>
              <Select.Option value="STAFF">Nhân viên</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
