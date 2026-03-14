import { useState, useEffect, useMemo } from "react";
import {
  Card,
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
  Popconfirm,
  Divider,
  Row,
  Col,
  Collapse,
  Empty,
  Badge,
  Tooltip,
} from "antd";
import {
  BookOutlined,
  FolderOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  RightOutlined,
  DownOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import LearnSummaryCards from "./LearnSummaryCards";
import type { CollapseProps } from "antd";
import {
  getAdminLearnCategories,
  getAdminLearnModules,
  getAdminLearnModuleById,
  getAdminLearnLessonById,
  getAdminLearnQuizById,
  createAdminLearnCategory,
  updateAdminLearnCategory,
  deleteAdminLearnCategory,
  createAdminLearnModule,
  updateAdminLearnModule,
  deleteAdminLearnModule,
  createAdminLearnLesson,
  updateAdminLearnLesson,
  deleteAdminLearnLesson,
  createAdminLearnQuiz,
  updateAdminLearnQuiz,
  deleteAdminLearnQuiz,
  type AdminLearnCategory,
  type AdminLearnModule,
  type AdminLearnLesson,
  type AdminLearnQuiz,
} from "../../services/adminApi";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

const difficultyLabels: Record<string, string> = {
  BASIC: "Cơ bản",
  INTERMEDIATE: "Trung bình",
  ADVANCED: "Nâng cao",
};

const DIFFICULTY_OPTIONS = [
  { value: "BASIC", label: "Cơ bản" },
  { value: "INTERMEDIATE", label: "Trung bình" },
  { value: "ADVANCED", label: "Nâng cao" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function LearnManagement() {
  const { message } = App.useApp();
  const [categories, setCategories] = useState<AdminLearnCategory[]>([]);
  const [modules, setModules] = useState<AdminLearnModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailType, setDetailType] = useState<"module" | "lesson" | "quiz">("module");
  const [detailData, setDetailData] = useState<
    AdminLearnModule | AdminLearnLesson | AdminLearnQuiz | null
  >(null);

  // Category form
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryEditId, setCategoryEditId] = useState<number | null>(null);
  const [categoryForm] = Form.useForm();
  const [categorySaving, setCategorySaving] = useState(false);

  // Module form
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [moduleEditId, setModuleEditId] = useState<number | null>(null);
  const [moduleForm] = Form.useForm();
  const [moduleSaving, setModuleSaving] = useState(false);

  // Lesson form
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [lessonEditId, setLessonEditId] = useState<number | null>(null);
  const [selectedModuleIdForLesson, setSelectedModuleIdForLesson] = useState<number | null>(null);
  const [lessonForm] = Form.useForm();
  const [lessonSaving, setLessonSaving] = useState(false);

  // Quiz form (create)
  const [quizCreateModalOpen, setQuizCreateModalOpen] = useState(false);
  const [quizCreateForm] = Form.useForm();
  const [selectedModuleIdForQuiz, setSelectedModuleIdForQuiz] = useState<number | null>(null);
  const [quizCreateSaving, setQuizCreateSaving] = useState(false);

  // Quiz edit (chỉnh sửa đáp án)
  const [quizEditModalOpen, setQuizEditModalOpen] = useState(false);
  const [quizEditData, setQuizEditData] = useState<AdminLearnQuiz | null>(null);
  const [quizEditSaving, setQuizEditSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const data = await getAdminLearnCategories();
      setCategories(data);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Không thể tải danh mục");
    }
  };

  const fetchModules = async () => {
    try {
      const data = await getAdminLearnModules();
      setModules(data);
    } catch (err) {
      console.error("Error fetching modules:", err);
      setError("Không thể tải module");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchCategories(), fetchModules()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Group modules by category
  const modulesByCategory = useMemo(() => {
    const grouped: Record<number, AdminLearnModule[]> = {};
    modules.forEach((module) => {
      if (!grouped[module.categoryId]) {
        grouped[module.categoryId] = [];
      }
      grouped[module.categoryId].push(module);
    });
    return grouped;
  }, [modules]);

  // Filter categories and modules based on search
  const filteredCategories = useMemo(() => {
    if (!searchText.trim()) return categories;
    const searchLower = searchText.toLowerCase();
    return categories.filter((cat) => {
      const catMatches = cat.name?.toLowerCase().includes(searchLower) || 
                        cat.slug?.toLowerCase().includes(searchLower);
      const modulesInCat = modulesByCategory[cat.id] || [];
      const moduleMatches = modulesInCat.some((m) => 
        m.title?.toLowerCase().includes(searchLower) ||
        m.slug?.toLowerCase().includes(searchLower)
      );
      return catMatches || moduleMatches;
    });
  }, [categories, modulesByCategory, searchText]);

  const openModuleDetail = async (moduleId: number) => {
    setDetailType("module");
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const data = await getAdminLearnModuleById(moduleId);
      setDetailData(data);
    } catch {
      message.error("Không thể tải chi tiết module");
    } finally {
      setDetailLoading(false);
    }
  };

  const openLessonDetail = async (lessonId: number) => {
    setDetailType("lesson");
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const data = await getAdminLearnLessonById(lessonId);
      setDetailData(data);
    } catch {
      message.error("Không thể tải chi tiết bài học");
    } finally {
      setDetailLoading(false);
    }
  };

  const openQuizDetail = async (quizId: number) => {
    setDetailType("quiz");
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const data = await getAdminLearnQuizById(quizId);
      // Debug log để kiểm tra isCorrect
      console.log("[Quiz Detail] Fetched data:", data);
      if (data.questions) {
        data.questions.forEach((q, i) => {
          console.log(`[Quiz Detail] Question ${i + 1}:`, {
            questionText: q.questionText,
            options: q.options?.map((opt) => ({
              label: opt.label,
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
            })),
          });
        });
      }
      setDetailData(data);
    } catch (err: any) {
      console.error("[openQuizDetail] Error:", err);
      message.error(err?.message || "Không thể tải chi tiết quiz");
    } finally {
      setDetailLoading(false);
    }
  };

  // ========== Category CRUD ==========
  const handleOpenCategoryForm = (record?: AdminLearnCategory) => {
    if (record) {
      setCategoryEditId(record.id);
      categoryForm.setFieldsValue({
        name: record.name,
        slug: record.slug,
        orderIndex: record.orderIndex,
      });
    } else {
      setCategoryEditId(null);
      categoryForm.resetFields();
    }
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async () => {
    try {
      const values = await categoryForm.validateFields();
      setCategorySaving(true);
      if (categoryEditId) {
        await updateAdminLearnCategory(categoryEditId, values);
        message.success("Cập nhật danh mục thành công");
      } else {
        await createAdminLearnCategory({
          ...values,
          slug: values.slug || slugify(values.name),
        });
        message.success("Tạo danh mục thành công");
      }
      setCategoryModalOpen(false);
      fetchCategories();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error("Thao tác thất bại. Vui lòng thử lại.");
    } finally {
      setCategorySaving(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await deleteAdminLearnCategory(id);
      message.success("Đã xóa danh mục");
      fetchCategories();
      fetchModules();
    } catch {
      message.error("Không thể xóa danh mục");
    }
  };

  // ========== Module CRUD ==========
  const handleOpenModuleForm = (record?: AdminLearnModule, categoryId?: number) => {
    if (record) {
      setModuleEditId(record.id);
      moduleForm.setFieldsValue({
        title: record.title,
        slug: record.slug,
        categoryId: record.categoryId,
        thumbnailUrl: record.thumbnailUrl,
        culturalEtiquetteTitle: record.culturalEtiquetteTitle,
        culturalEtiquetteText: record.culturalEtiquetteText,
      });
    } else {
      setModuleEditId(null);
      moduleForm.resetFields();
      if (categoryId) {
        moduleForm.setFieldsValue({ categoryId });
      }
    }
    setModuleModalOpen(true);
  };

  const handleSaveModule = async () => {
    try {
      const values = await moduleForm.validateFields();
      setModuleSaving(true);
      if (moduleEditId) {
        await updateAdminLearnModule(moduleEditId, values);
        message.success("Cập nhật module thành công");
      } else {
        await createAdminLearnModule({
          ...values,
          slug: values.slug || slugify(values.title),
        });
        message.success("Tạo module thành công");
      }
      setModuleModalOpen(false);
      fetchModules();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error("Thao tác thất bại. Vui lòng thử lại.");
    } finally {
      setModuleSaving(false);
    }
  };

  const handleDeleteModule = async (id: number) => {
    try {
      await deleteAdminLearnModule(id);
      message.success("Đã xóa module");
      fetchModules();
    } catch {
      message.error("Không thể xóa module");
    }
  };

  // ========== Lesson CRUD ==========
  const handleOpenLessonForm = (moduleId: number, record?: AdminLearnLesson) => {
    setSelectedModuleIdForLesson(moduleId);
    if (record) {
      setLessonEditId(record.id);
      lessonForm.setFieldsValue({
        title: record.title,
        slug: record.slug,
        moduleId: record.moduleId,
        objectiveText: record.objectiveText,
        difficulty: record.difficulty,
        estimatedMinutes: record.estimatedMinutes,
        videoUrl: record.videoUrl,
        imageUrl: record.imageUrl,
        contentJson: record.contentJson,
        orderIndex: record.orderIndex,
      });
    } else {
      setLessonEditId(null);
      lessonForm.resetFields();
      lessonForm.setFieldsValue({ moduleId });
    }
    setLessonModalOpen(true);
  };

  const handleSaveLesson = async () => {
    try {
      const values = await lessonForm.validateFields();
      setLessonSaving(true);
      if (lessonEditId) {
        await updateAdminLearnLesson(lessonEditId, values);
        message.success("Cập nhật bài học thành công");
      } else {
        await createAdminLearnLesson({
          ...values,
          slug: values.slug || slugify(values.title),
        });
        message.success("Tạo bài học thành công");
      }
      setLessonModalOpen(false);
      fetchModules();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error("Thao tác thất bại. Vui lòng thử lại.");
    } finally {
      setLessonSaving(false);
    }
  };

  const handleDeleteLesson = async (id: number) => {
    try {
      await deleteAdminLearnLesson(id);
      message.success("Đã xóa bài học");
      fetchModules();
    } catch {
      message.error("Không thể xóa bài học");
    }
  };

  // ========== Quiz Create ==========
  const handleOpenQuizCreate = (moduleId: number) => {
    setSelectedModuleIdForQuiz(moduleId);
    quizCreateForm.resetFields();
    quizCreateForm.setFieldsValue({
      moduleId,
      questions: [
        {
          questionText: "",
          hintText: "",
          orderIndex: 0,
          options: [
            { label: "A", optionText: "", isCorrect: false },
            { label: "B", optionText: "", isCorrect: false },
          ],
        },
      ],
    });
    setQuizCreateModalOpen(true);
  };

  const handleSaveQuizCreate = async () => {
    try {
      const values = await quizCreateForm.validateFields();
      setQuizCreateSaving(true);
      const questions = (values.questions ?? []).map((q: any, i: number) => ({
        questionText: q.questionText,
        hintText: q.hintText || "",
        orderIndex: i,
        options: (q.options ?? []).map((o: any) => ({
          label: o.label,
          optionText: o.optionText,
          isCorrect: !!o.isCorrect,
        })),
      }));
      await createAdminLearnQuiz({
        moduleId: values.moduleId,
        title: values.title,
        timeLimitMinutes: values.timeLimitMinutes,
        difficulty: values.difficulty,
        objective: values.objective,
        rules: values.rules ? values.rules.split("\n").filter(Boolean) : [],
        questions,
      });
      message.success("Tạo quiz thành công");
      setQuizCreateModalOpen(false);
      fetchModules();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error("Thao tác thất bại. Vui lòng thử lại.");
    } finally {
      setQuizCreateSaving(false);
    }
  };

  // ========== Quiz Edit ==========
  const handleOpenQuizEdit = async (quizId: number) => {
    setDetailModalOpen(false);
    try {
      const data = await getAdminLearnQuizById(quizId);
      console.log("[handleOpenQuizEdit] Quiz data:", data);
      if (data.questions) {
        data.questions.forEach((q, i) => {
          console.log(`[handleOpenQuizEdit] Question ${i + 1}:`, {
            questionText: q.questionText,
            options: q.options?.map((opt) => ({
              id: opt.id,
              label: opt.label,
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
            })),
          });
        });
      }
      setQuizEditData(data);
      setQuizEditModalOpen(true);
    } catch (err: any) {
      console.error("[handleOpenQuizEdit] Error:", err);
      message.error(err?.message || "Không thể tải quiz");
    }
  };

  const handleSaveQuizEdit = async (formValues: Record<string, any>) => {
    if (!quizEditData) return;
    try {
      setQuizEditSaving(true);
      const questions = (formValues.questions ?? quizEditData.questions).map((q: any, i: number) => ({
        questionText: q.questionText,
        hintText: q.hintText || "",
        orderIndex: i,
        options: (q.options ?? []).map((o: any) => ({
          id: o.id,
          label: o.label,
          optionText: o.optionText,
          isCorrect: !!o.isCorrect,
        })),
      }));
      await updateAdminLearnQuiz(quizEditData.id, {
        title: formValues.title ?? quizEditData.title,
        timeLimitMinutes: formValues.timeLimitMinutes ?? quizEditData.timeLimitMinutes,
        difficulty: formValues.difficulty ?? quizEditData.difficulty,
        objective: formValues.objective ?? quizEditData.objective,
        rules: formValues.rules ? formValues.rules.split("\n").filter(Boolean) : quizEditData.rules,
        questions,
      });
      message.success("Cập nhật quiz thành công");
      setQuizEditModalOpen(false);
      setQuizEditData(null);
      fetchModules();
    } catch {
      message.error("Cập nhật quiz thất bại");
    } finally {
      setQuizEditSaving(false);
    }
  };

  const handleDeleteQuiz = async (id: number) => {
    try {
      await deleteAdminLearnQuiz(id);
      message.success("Đã xóa quiz");
      setDetailModalOpen(false);
      setDetailData(null);
      fetchModules();
    } catch {
      message.error("Không thể xóa quiz");
    }
  };

  const stats = {
    totalCategories: categories.length,
    totalModules: modules.length,
    totalLessons: modules.reduce((sum, m) => sum + (m.lessonsCount ?? m.lessons?.length ?? 0), 0),
    totalQuizzes: modules.filter((m) => m.quizPrompt).length,
  };

  const toggleCategoryExpand = (categoryId: number) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleModuleExpand = async (moduleId: number) => {
    const isCurrentlyExpanded = expandedModules.includes(moduleId);
    
    if (!isCurrentlyExpanded) {
      // Khi expand, fetch chi tiết module để lấy lessons và quiz
      const module = modules.find((m) => m.id === moduleId);
      if (module && (!module.lessons || module.lessons.length === 0)) {
        try {
          const detail = await getAdminLearnModuleById(moduleId);
          // Cập nhật module trong state với lessons và quiz từ chi tiết
          setModules((prev) =>
            prev.map((m) =>
              m.id === moduleId
                ? {
                    ...m,
                    lessons: detail.lessons || [],
                    quizPrompt: detail.quizPrompt,
                  }
                : m
            )
          );
        } catch (err) {
          console.error("Error fetching module details:", err);
          message.error("Không thể tải chi tiết module");
        }
      }
    }
    
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const renderDetailContent = () => {
    if (detailLoading) {
      return (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
          <p style={{ marginTop: 8 }}>Đang tải...</p>
        </div>
      );
    }
    if (!detailData) return null;

    if (detailType === "module") {
      const d = detailData as AdminLearnModule;
      return (
        <Descriptions column={1} bordered>
          <Descriptions.Item label="ID">{d.id}</Descriptions.Item>
          <Descriptions.Item label="Tiêu đề">{d.title}</Descriptions.Item>
          <Descriptions.Item label="Slug">{d.slug}</Descriptions.Item>
          <Descriptions.Item label="Danh mục">{d.categoryName}</Descriptions.Item>
          <Descriptions.Item label="Số bài học">
            {d.lessonsCount ?? d.lessons?.length ?? 0}
          </Descriptions.Item>
          <Descriptions.Item label="Thời lượng">{d.durationMinutes} phút</Descriptions.Item>
          <Descriptions.Item label="Cultural Etiquette">{d.culturalEtiquetteTitle || "—"}</Descriptions.Item>
          {d.lessons && d.lessons.length > 0 && (
            <Descriptions.Item label="Bài học">
              <Space direction="vertical" size="small" style={{ width: "100%" }}>
                {d.lessons.map((l) => (
                  <Button
                    key={l.id}
                    type="link"
                    size="small"
                    onClick={() => {
                      setDetailModalOpen(false);
                      openLessonDetail(l.id);
                    }}
                  >
                    {l.orderIndex}. {l.title}
                  </Button>
                ))}
              </Space>
            </Descriptions.Item>
          )}
          {d.quizPrompt && (
            <Descriptions.Item label="Quiz">
              <Button
                type="link"
                onClick={() => {
                  setDetailModalOpen(false);
                  openQuizDetail(d.quizPrompt!.id);
                }}
              >
                {d.quizPrompt.title} ({d.quizPrompt.totalQuestions} câu)
              </Button>
            </Descriptions.Item>
          )}
        </Descriptions>
      );
    }

    if (detailType === "lesson") {
      const d = detailData as AdminLearnLesson;
      return (
        <Descriptions column={1} bordered>
          <Descriptions.Item label="ID">{d.id}</Descriptions.Item>
          <Descriptions.Item label="Tiêu đề">{d.title}</Descriptions.Item>
          <Descriptions.Item label="Slug">{d.slug}</Descriptions.Item>
          <Descriptions.Item label="Module">
            <Button
              type="link"
              onClick={() => {
                setDetailModalOpen(false);
                openModuleDetail(d.moduleId);
              }}
            >
              {d.moduleTitle}
            </Button>
          </Descriptions.Item>
          <Descriptions.Item label="Danh mục">{d.categoryName}</Descriptions.Item>
          <Descriptions.Item label="Độ khó">
            <Tag>{difficultyLabels[d.difficulty] ?? d.difficulty}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Thời lượng ước tính">{d.estimatedMinutes} phút</Descriptions.Item>
          <Descriptions.Item label="Lượt xem">{d.viewsCount ?? 0}</Descriptions.Item>
        </Descriptions>
      );
    }

    if (detailType === "quiz") {
      const d = detailData as AdminLearnQuiz;
      const module = modules.find((m) => m.id === d.moduleId);
      return (
        <>
          <Descriptions column={1} bordered>
            <Descriptions.Item label="ID">{d.id}</Descriptions.Item>
            <Descriptions.Item label="Module">
              {module && (
                <Button
                  type="link"
                  onClick={() => {
                    setDetailModalOpen(false);
                    openModuleDetail(module.id);
                  }}
                >
                  {module.title}
                </Button>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Tiêu đề">{d.title}</Descriptions.Item>
            <Descriptions.Item label="Thời gian">{d.timeLimitMinutes} phút</Descriptions.Item>
            <Descriptions.Item label="Độ khó">
              <Tag>{difficultyLabels[d.difficulty] ?? d.difficulty}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Mục tiêu">{d.objective || "—"}</Descriptions.Item>
            <Descriptions.Item label="Số câu hỏi">{d.totalQuestions}</Descriptions.Item>
          </Descriptions>
          <div style={{ marginTop: 16 }}>
            <Space>
              <Button type="primary" icon={<EditOutlined />} onClick={() => handleOpenQuizEdit(d.id)}>
                Chỉnh sửa đáp án
              </Button>
            </Space>
          </div>
          {d.questions && d.questions.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <Title level={4} style={{ marginBottom: 16 }}>
                Danh sách câu hỏi và đáp án ({d.questions.length} câu)
              </Title>
              <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 8 }}>
                {d.questions.map((q, i) => {
                  const correctOptions = q.options?.filter((opt) => opt.isCorrect) || [];
                  return (
                    <Card
                      key={q.id}
                      style={{
                        marginBottom: 16,
                        borderRadius: 8,
                        border: "1px solid #e8e8e8",
                        background: "#fff",
                      }}
                      bodyStyle={{ padding: 16 }}
                    >
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <Tag color="blue" style={{ fontSize: 13, fontWeight: 600 }}>
                            Câu {i + 1}
                          </Tag>
                          <Text strong style={{ fontSize: 15, flex: 1 }}>
                            {q.questionText}
                          </Text>
                        </div>
                        {q.hintText && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "#8c8c8c",
                              marginTop: 4,
                              padding: "6px 12px",
                              background: "#f5f5f5",
                              borderRadius: 4,
                              fontStyle: "italic",
                            }}
                          >
                            💡 Gợi ý: {q.hintText}
                          </div>
                        )}
                        {/* Hiển thị đáp án đúng ngay ở đầu câu hỏi */}
                        {correctOptions.length > 0 && (
                          <div
                            style={{
                              marginTop: 12,
                              padding: "10px 14px",
                              background: "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)",
                              borderRadius: 6,
                              border: "2px solid #52c41a",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              boxShadow: "0 2px 8px rgba(82, 196, 26, 0.2)",
                            }}
                          >
                            <CheckCircleOutlined style={{ fontSize: 18, color: "#fff" }} />
                            <Text strong style={{ fontSize: 14, color: "#fff" }}>
                              ĐÁP ÁN ĐÚNG: {correctOptions.map((opt) => opt.label).join(", ")}
                            </Text>
                          </div>
                        )}
                      </div>
                      <Divider style={{ margin: "12px 0" }} />
                      <div>
                        <Text strong style={{ fontSize: 13, color: "#595959", marginBottom: 12, display: "block" }}>
                          Các lựa chọn đáp án:
                        </Text>
                        <Space direction="vertical" size="small" style={{ width: "100%" }}>
                          {q.options?.map((opt) => (
                            <div
                              key={opt.id}
                              style={{
                                padding: "12px 14px",
                                borderRadius: 8,
                                background: opt.isCorrect 
                                  ? "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)" 
                                  : "#fafafa",
                                border: opt.isCorrect
                                  ? "3px solid #52c41a"
                                  : "2px solid #e8e8e8",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                transition: "all 0.2s",
                                boxShadow: opt.isCorrect 
                                  ? "0 2px 8px rgba(82, 196, 26, 0.15)" 
                                  : "none",
                                position: "relative",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
                                <div
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "50%",
                                    background: opt.isCorrect 
                                      ? "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)" 
                                      : "#d9d9d9",
                                    color: "#fff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 700,
                                    fontSize: 15,
                                    flexShrink: 0,
                                    boxShadow: opt.isCorrect 
                                      ? "0 2px 6px rgba(82, 196, 26, 0.3)" 
                                      : "none",
                                  }}
                                >
                                  {opt.isCorrect ? (
                                    <CheckCircleOutlined style={{ fontSize: 20 }} />
                                  ) : (
                                    opt.label
                                  )}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      color: opt.isCorrect ? "#262626" : "#595959",
                                      fontWeight: opt.isCorrect ? 600 : 400,
                                      display: "block",
                                    }}
                                  >
                                    {!opt.isCorrect && <span style={{ fontWeight: 600, marginRight: 6 }}>{opt.label}.</span>}
                                    {opt.optionText}
                                  </Text>
                                </div>
                              </div>
                              {opt.isCorrect && (
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <Tag
                                    color="success"
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 700,
                                      padding: "4px 12px",
                                      borderRadius: 12,
                                      border: "none",
                                      background: "#52c41a",
                                      color: "#fff",
                                    }}
                                  >
                                    ✓ ĐÚNG
                                  </Tag>
                                </div>
                              )}
                              {!opt.isCorrect && (
                                <CloseCircleOutlined 
                                  style={{ 
                                    fontSize: 18, 
                                    color: "#d9d9d9",
                                    marginLeft: 8,
                                  }} 
                                />
                              )}
                            </div>
                          ))}
                        </Space>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </>
      );
    }

    return null;
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <LearnSummaryCards stats={stats} />

      <div style={{ marginBottom: 8 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1a1a1a" }}>
          Quản lý Học nhanh
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Quản lý danh mục, module, bài học và quiz theo cấu trúc phân cấp
        </Text>
      </div>

      {error && (
        <Alert message="Lỗi" description={error} type="error" showIcon style={{ marginBottom: 16 }} />
      )}

      <Card
        style={{
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }} align="middle">
          <Col xs={24} sm={16} md={18}>
            <Input
              placeholder="Tìm kiếm danh mục, module, bài học..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="large"
            />
          </Col>
          <Col xs={24} sm={8} md={6} style={{ textAlign: "right" }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenCategoryForm()}
              size="large"
            >
              Tạo danh mục
            </Button>
          </Col>
        </Row>

        {loading ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>Đang tải dữ liệu...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <Empty
            description={searchText ? "Không tìm thấy kết quả" : "Chưa có danh mục nào"}
            style={{ padding: 48 }}
          >
            {!searchText && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenCategoryForm()}>
                Tạo danh mục đầu tiên
              </Button>
            )}
          </Empty>
        ) : (
          <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
            {filteredCategories.map((category) => {
              const categoryModules = (modulesByCategory[category.id] || []).filter((m) => {
                if (!searchText.trim()) return true;
                const searchLower = searchText.toLowerCase();
                return (
                  m.title?.toLowerCase().includes(searchLower) ||
                  m.slug?.toLowerCase().includes(searchLower) ||
                  m.lessons?.some((l) => l.title?.toLowerCase().includes(searchLower))
                );
              });
              const isCategoryExpanded = expandedCategories.includes(category.id);

              return (
                <Card
                  key={category.id}
                  style={{
                    marginBottom: 16,
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    background: isCategoryExpanded ? "#fafafa" : "#fff",
                  }}
                  bodyStyle={{ padding: 16 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => toggleCategoryExpand(category.id)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                      {isCategoryExpanded ? (
                        <DownOutlined style={{ color: "#8B0000" }} />
                      ) : (
                        <RightOutlined style={{ color: "#8c8c8c" }} />
                      )}
                      <FolderOutlined style={{ fontSize: 20, color: "#8B0000" }} />
                      <div>
                        <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
                          {category.name}
                        </Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {categoryModules.length} module
                        </Text>
                      </div>
                    </div>
                    <Space>
                      <Badge count={categoryModules.length} showZero>
                        <Tag color="blue">{categoryModules.length} module</Tag>
                      </Badge>
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCategoryForm(category);
                        }}
                      >
                        Sửa
                      </Button>
                      <Popconfirm
                        title="Xóa danh mục?"
                        description="Tất cả module trong danh mục sẽ bị ảnh hưởng."
                        onConfirm={() => handleDeleteCategory(category.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                      >
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          size="small"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Xóa
                        </Button>
                      </Popconfirm>
                      <Button
                        type="primary"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModuleForm(undefined, category.id);
                        }}
                      >
                        Thêm Module
                      </Button>
                    </Space>
                  </div>

                  {isCategoryExpanded && (
                    <div style={{ marginTop: 16, paddingLeft: 32 }}>
                      {categoryModules.length === 0 ? (
                        <Empty
                          description="Chưa có module nào"
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          style={{ padding: 24 }}
                        >
                          <Button
                            type="primary"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => handleOpenModuleForm(undefined, category.id)}
                          >
                            Tạo module đầu tiên
                          </Button>
                        </Empty>
                      ) : (
                        categoryModules.map((module) => {
                          const lessons = module.lessons || [];
                          const quiz = module.quizPrompt;
                          const isModuleExpanded = expandedModules.includes(module.id);
                          // Sử dụng lessonsCount nếu lessons chưa được fetch
                          const displayLessonsCount = lessons.length > 0 ? lessons.length : (module.lessonsCount || 0);

                          return (
                            <Card
                              key={module.id}
                              style={{
                                marginBottom: 12,
                                borderRadius: 8,
                                border: "1px solid #e8e8e8",
                                background: isModuleExpanded ? "#f9f9f9" : "#fff",
                              }}
                              bodyStyle={{ padding: 12 }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                  cursor: "pointer",
                                }}
                                onClick={() => toggleModuleExpand(module.id)}
                              >
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1 }}>
                                  {isModuleExpanded ? (
                                    <DownOutlined style={{ color: "#8B0000", marginTop: 4 }} />
                                  ) : (
                                    <RightOutlined style={{ color: "#8c8c8c", marginTop: 4 }} />
                                  )}
                                  <BookOutlined style={{ fontSize: 18, color: "#1890ff", marginTop: 2 }} />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                      <Text strong style={{ fontSize: 15 }}>
                                        {module.title}
                                      </Text>
                                      <Tag color="cyan">{module.categoryName}</Tag>
                                    </div>
                                    <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#8c8c8c" }}>
                                      <span>
                                        <FileTextOutlined /> {displayLessonsCount} bài học
                                      </span>
                                      <span>
                                        <ClockCircleOutlined /> {module.durationMinutes || 0} phút
                                      </span>
                                      {quiz && (
                                        <span>
                                          <QuestionCircleOutlined /> Quiz ({quiz.totalQuestions} câu)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <Space size="small" onClick={(e) => e.stopPropagation()}>
                                  <Tooltip title="Xem chi tiết">
                                    <Button
                                      type="text"
                                      icon={<EyeOutlined />}
                                      size="small"
                                      onClick={() => openModuleDetail(module.id)}
                                    />
                                  </Tooltip>
                                  <Tooltip title="Sửa module">
                                    <Button
                                      type="text"
                                      icon={<EditOutlined />}
                                      size="small"
                                      onClick={() => handleOpenModuleForm(module)}
                                    />
                                  </Tooltip>
                                  <Tooltip title="Thêm bài học">
                                    <Button
                                      type="text"
                                      icon={<PlusOutlined />}
                                      size="small"
                                      onClick={() => handleOpenLessonForm(module.id)}
                                    />
                                  </Tooltip>
                                  {!quiz && (
                                    <Tooltip title="Tạo quiz">
                                      <Button
                                        type="text"
                                        icon={<QuestionCircleOutlined />}
                                        size="small"
                                        onClick={() => handleOpenQuizCreate(module.id)}
                                      />
                                    </Tooltip>
                                  )}
                                  <Popconfirm
                                    title="Xóa module?"
                                    description="Tất cả bài học và quiz trong module sẽ bị xóa."
                                    onConfirm={() => handleDeleteModule(module.id)}
                                    okText="Xóa"
                                    cancelText="Hủy"
                                  >
                                    <Button
                                      type="text"
                                      danger
                                      icon={<DeleteOutlined />}
                                      size="small"
                                    />
                                  </Popconfirm>
                                </Space>
                              </div>

                              {isModuleExpanded && (
                                <div style={{ marginTop: 12, paddingLeft: 32 }}>
                                  {/* Lessons */}
                                  {lessons.length > 0 && (
                                    <div style={{ marginBottom: 12 }}>
                                      <div
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          marginBottom: 8,
                                        }}
                                      >
                                        <Text strong style={{ fontSize: 13, color: "#595959" }}>
                                          <FileTextOutlined /> Bài học ({lessons.length})
                                        </Text>
                                        <Button
                                          type="link"
                                          size="small"
                                          icon={<PlusOutlined />}
                                          onClick={() => handleOpenLessonForm(module.id)}
                                        >
                                          Thêm bài học
                                        </Button>
                                      </div>
                                      <Space direction="vertical" size="small" style={{ width: "100%" }}>
                                        {lessons
                                          .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                                          .map((lesson) => (
                                            <Card
                                              key={lesson.id}
                                              size="small"
                                              style={{
                                                background: "#fff",
                                                border: "1px solid #f0f0f0",
                                              }}
                                              bodyStyle={{ padding: 8 }}
                                            >
                                              <div
                                                style={{
                                                  display: "flex",
                                                  justifyContent: "space-between",
                                                  alignItems: "center",
                                                }}
                                              >
                                                <div style={{ flex: 1 }}>
                                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <Text strong style={{ fontSize: 13 }}>
                                                      {lesson.orderIndex}. {lesson.title}
                                                    </Text>
                                                    <Tag color="orange" style={{ fontSize: 11 }}>
                                                      {difficultyLabels[lesson.difficulty] || lesson.difficulty}
                                                    </Tag>
                                                  </div>
                                                  <div style={{ fontSize: 11, color: "#8c8c8c", marginTop: 4 }}>
                                                    <ClockCircleOutlined /> {lesson.estimatedMinutes || 0} phút
                                                  </div>
                                                </div>
                                                <Space size="small">
                                                  <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<EyeOutlined />}
                                                    onClick={() => openLessonDetail(lesson.id)}
                                                  >
                                                    Xem
                                                  </Button>
                                                  <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<EditOutlined />}
                                                    onClick={() => handleOpenLessonForm(module.id, lesson)}
                                                  >
                                                    Sửa
                                                  </Button>
                                                  <Popconfirm
                                                    title="Xóa bài học?"
                                                    onConfirm={() => handleDeleteLesson(lesson.id)}
                                                    okText="Xóa"
                                                    cancelText="Hủy"
                                                  >
                                                    <Button
                                                      type="text"
                                                      danger
                                                      size="small"
                                                      icon={<DeleteOutlined />}
                                                    />
                                                  </Popconfirm>
                                                </Space>
                                              </div>
                                            </Card>
                                          ))}
                                      </Space>
                                    </div>
                                  )}

                                  {/* Quiz */}
                                  {quiz && (
                                    <div>
                                      <div
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          marginBottom: 8,
                                        }}
                                      >
                                        <Text strong style={{ fontSize: 13, color: "#595959" }}>
                                          <QuestionCircleOutlined /> Quiz
                                        </Text>
                                      </div>
                                      <Card
                                        size="small"
                                        style={{
                                          background: "#f6ffed",
                                          border: "1px solid #b7eb8f",
                                        }}
                                        bodyStyle={{ padding: 12 }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                          }}
                                        >
                                          <div style={{ flex: 1 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                              <Text strong style={{ fontSize: 13 }}>
                                                {quiz.title}
                                              </Text>
                                              <Tag color="green">{quiz.totalQuestions} câu</Tag>
                                              <Tag color="blue">{quiz.timeLimitMinutes} phút</Tag>
                                            </div>
                                            <div style={{ fontSize: 11, color: "#8c8c8c", marginTop: 4 }}>
                                              <Tag color="orange" style={{ fontSize: 11 }}>
                                                {difficultyLabels[quiz.difficulty] || quiz.difficulty}
                                              </Tag>
                                            </div>
                                          </div>
                                          <Space size="small">
                                            <Button
                                              type="text"
                                              size="small"
                                              icon={<EyeOutlined />}
                                              onClick={() => openQuizDetail(quiz.id)}
                                            >
                                              Xem
                                            </Button>
                                            <Button
                                              type="text"
                                              size="small"
                                              icon={<EditOutlined />}
                                              onClick={() => handleOpenQuizEdit(quiz.id)}
                                            >
                                              Sửa
                                            </Button>
                                            <Popconfirm
                                              title="Xóa quiz?"
                                              onConfirm={() => handleDeleteQuiz(quiz.id)}
                                              okText="Xóa"
                                              cancelText="Hủy"
                                            >
                                              <Button
                                                type="text"
                                                danger
                                                size="small"
                                                icon={<DeleteOutlined />}
                                              />
                                            </Popconfirm>
                                          </Space>
                                        </div>
                                      </Card>
                                    </div>
                                  )}

                                  {/* Empty state for lessons */}
                                  {lessons.length === 0 && !quiz && (
                                    <Empty
                                      description="Chưa có bài học hoặc quiz"
                                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                                      style={{ padding: 16 }}
                                    >
                                      <Space>
                                        <Button
                                          type="primary"
                                          size="small"
                                          icon={<FileTextOutlined />}
                                          onClick={() => handleOpenLessonForm(module.id)}
                                        >
                                          Thêm bài học
                                        </Button>
                                        <Button
                                          size="small"
                                          icon={<QuestionCircleOutlined />}
                                          onClick={() => handleOpenQuizCreate(module.id)}
                                        >
                                          Tạo quiz
                                        </Button>
                                      </Space>
                                    </Empty>
                                  )}
                                </div>
                              )}
                            </Card>
                          );
                        })
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal Chi tiết */}
      <Modal
        title={
          detailType === "module"
            ? "Chi tiết Module"
            : detailType === "lesson"
              ? "Chi tiết Bài học"
              : "Chi tiết Quiz"
        }
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          setDetailData(null);
        }}
        footer={[<Button key="close" onClick={() => setDetailModalOpen(false)}>Đóng</Button>]}
        width={700}
      >
        {renderDetailContent()}
      </Modal>

      {/* Modal Danh mục */}
      <Modal
        title={categoryEditId ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
        open={categoryModalOpen}
        onCancel={() => setCategoryModalOpen(false)}
        onOk={handleSaveCategory}
        confirmLoading={categorySaving}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={categoryForm} layout="vertical">
          <Form.Item label="Tên" name="name" rules={[{ required: true }]}>
            <Input placeholder="VD: Văn hóa Tây Nguyên" />
          </Form.Item>
          <Form.Item label="Slug" name="slug">
            <Input placeholder="Tự động từ tên nếu để trống" />
          </Form.Item>
          <Form.Item label="Thứ tự" name="orderIndex">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Module */}
      <Modal
        title={moduleEditId ? "Chỉnh sửa module" : "Tạo module mới"}
        open={moduleModalOpen}
        onCancel={() => setModuleModalOpen(false)}
        onOk={handleSaveModule}
        confirmLoading={moduleSaving}
        okText="Lưu"
        cancelText="Hủy"
        width={560}
      >
        <Form form={moduleForm} layout="vertical">
          <Form.Item label="Tiêu đề" name="title" rules={[{ required: true }]}>
            <Input placeholder="VD: Cồng chiêng Tây Nguyên" />
          </Form.Item>
          <Form.Item label="Slug" name="slug">
            <Input placeholder="Tự động từ tiêu đề nếu để trống" />
          </Form.Item>
          <Form.Item label="Danh mục" name="categoryId" rules={[{ required: true }]}>
            <Select
              placeholder="Chọn danh mục"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item label="Ảnh (URL)" name="thumbnailUrl">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item label="Cultural Etiquette - Tiêu đề" name="culturalEtiquetteTitle">
            <Input />
          </Form.Item>
          <Form.Item label="Cultural Etiquette - Nội dung" name="culturalEtiquetteText">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Bài học */}
      <Modal
        title={lessonEditId ? "Chỉnh sửa bài học" : "Tạo bài học mới"}
        open={lessonModalOpen}
        onCancel={() => setLessonModalOpen(false)}
        onOk={handleSaveLesson}
        confirmLoading={lessonSaving}
        okText="Lưu"
        cancelText="Hủy"
        width={600}
      >
        <Form form={lessonForm} layout="vertical">
          <Form.Item label="Tiêu đề" name="title" rules={[{ required: true }]}>
            <Input placeholder="VD: Lịch sử Cồng chiêng" />
          </Form.Item>
          <Form.Item label="Slug" name="slug">
            <Input placeholder="Tự động từ tiêu đề nếu để trống" />
          </Form.Item>
          <Form.Item label="Module" name="moduleId" rules={[{ required: true }]}>
            <Select
              placeholder="Chọn module"
              options={modules.map((m) => ({ value: m.id, label: m.title }))}
            />
          </Form.Item>
          <Form.Item label="Độ khó" name="difficulty">
            <Select options={DIFFICULTY_OPTIONS} />
          </Form.Item>
          <Form.Item label="Thời lượng (phút)" name="estimatedMinutes">
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Mục tiêu" name="objectiveText">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Video URL" name="videoUrl">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item label="Ảnh URL" name="imageUrl">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item label="Nội dung (JSON)" name="contentJson">
            <TextArea rows={4} placeholder='{"blocks": [...]}' />
          </Form.Item>
          <Form.Item label="Thứ tự" name="orderIndex">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Tạo Quiz */}
      <Modal
        title="Tạo quiz mới"
        open={quizCreateModalOpen}
        onCancel={() => setQuizCreateModalOpen(false)}
        footer={null}
        width={700}
      >
        <Form form={quizCreateForm} layout="vertical" onFinish={handleSaveQuizCreate}>
          <Form.Item label="Module" name="moduleId" rules={[{ required: true }]}>
            <Select
              placeholder="Chọn module"
              options={modules.map((m) => ({ value: m.id, label: m.title }))}
            />
          </Form.Item>
          <Form.Item label="Tiêu đề" name="title" rules={[{ required: true }]}>
            <Input placeholder="VD: Quiz Cồng chiêng" />
          </Form.Item>
          <Form.Item label="Thời gian (phút)" name="timeLimitMinutes" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Độ khó" name="difficulty" rules={[{ required: true }]}>
            <Select options={DIFFICULTY_OPTIONS} />
          </Form.Item>
          <Form.Item label="Mục tiêu" name="objective">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Quy tắc (mỗi dòng một quy tắc)" name="rules">
            <TextArea rows={2} placeholder="Mỗi dòng một quy tắc" />
          </Form.Item>
          <Divider>Câu hỏi</Divider>
          <Form.List name="questions">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card key={key} size="small" style={{ marginBottom: 16 }}>
                    <Form.Item
                      {...restField}
                      name={[name, "questionText"]}
                      label="Câu hỏi"
                      rules={[{ required: true }]}
                    >
                      <Input.TextArea rows={2} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, "hintText"]} label="Gợi ý">
                      <Input />
                    </Form.Item>
                    <Form.List name={[name, "options"]}>
                      {(optFields, { add: addOpt, remove: removeOpt }) => (
                        <>
                          {optFields.map(({ key: ok, name: on }) => (
                            <div
                              key={ok}
                              style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}
                            >
                              <Form.Item
                                {...restField}
                                name={[name, "options", on, "label"]}
                                style={{ width: 60, marginBottom: 0 }}
                              >
                                <Input placeholder="A" />
                              </Form.Item>
                              <Form.Item
                                {...restField}
                                name={[name, "options", on, "optionText"]}
                                rules={[{ required: true }]}
                                style={{ flex: 1, marginBottom: 0 }}
                              >
                                <Input placeholder="Nội dung đáp án" />
                              </Form.Item>
                              <Form.Item
                                {...restField}
                                name={[name, "options", on, "isCorrect"]}
                                style={{ marginBottom: 0 }}
                              >
                                <Select
                                  style={{ width: 100 }}
                                  options={[
                                    { value: true, label: "Đúng" },
                                    { value: false, label: "Sai" },
                                  ]}
                                />
                              </Form.Item>
                              <Button type="link" danger size="small" onClick={() => removeOpt(on)}>
                                Xóa
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="dashed"
                            onClick={() =>
                              addOpt({
                                label: String.fromCharCode(65 + optFields.length),
                                optionText: "",
                                isCorrect: false,
                              })
                            }
                            block
                          >
                            + Thêm đáp án
                          </Button>
                        </>
                      )}
                    </Form.List>
                    <Button
                      type="link"
                      danger
                      size="small"
                      onClick={() => remove(name)}
                      style={{ marginTop: 8 }}
                    >
                      Xóa câu hỏi
                    </Button>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  onClick={() =>
                    add({
                      questionText: "",
                      hintText: "",
                      orderIndex: fields.length,
                      options: [
                        { label: "A", optionText: "", isCorrect: false },
                        { label: "B", optionText: "", isCorrect: false },
                      ],
                    })
                  }
                  block
                >
                  + Thêm câu hỏi
                </Button>
              </>
            )}
          </Form.List>
          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={quizCreateSaving}>
                Tạo quiz
              </Button>
              <Button onClick={() => setQuizCreateModalOpen(false)}>Hủy</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Chỉnh sửa Quiz (đáp án) */}
      <Modal
        title="Chỉnh sửa đáp án Quiz"
        open={quizEditModalOpen}
        onCancel={() => {
          setQuizEditModalOpen(false);
          setQuizEditData(null);
        }}
        footer={null}
        width={720}
        destroyOnClose={true}
      >
        {quizEditData && (
          <QuizEditForm
            key={quizEditData.id}
            quiz={quizEditData}
            onSave={handleSaveQuizEdit}
            onCancel={() => {
              setQuizEditModalOpen(false);
              setQuizEditData(null);
            }}
            saving={quizEditSaving}
          />
        )}
      </Modal>
    </Space>
  );
}

// Component riêng cho form sửa quiz (tránh lỗi hooks)
function QuizEditForm({
  quiz,
  onSave,
  onCancel,
  saving,
}: {
  quiz: AdminLearnQuiz;
  onSave: (values: any) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form] = Form.useForm();

  // Reset form khi quiz data thay đổi để đảm bảo dữ liệu được load đúng
  useEffect(() => {
    if (quiz && quiz.questions && quiz.questions.length > 0) {
      // Reset form trước để clear các giá trị cũ
      form.resetFields();
      
      // Chuẩn bị form values với đầy đủ options
      const formValues = {
        title: quiz.title || "",
        timeLimitMinutes: quiz.timeLimitMinutes || 0,
        difficulty: quiz.difficulty || "BASIC",
        objective: quiz.objective || "",
        rules: (quiz.rules ?? []).join("\n"),
        questions: (quiz.questions ?? []).map((q) => ({
          id: q.id,
          questionText: q.questionText || "",
          hintText: q.hintText || "",
          orderIndex: q.orderIndex ?? 0,
          options: (q.options ?? []).map((opt) => {
            console.log("[QuizEditForm] Mapping option:", {
              id: opt.id,
              label: opt.label,
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
              isCorrectType: typeof opt.isCorrect,
            });
            return {
              id: opt.id,
              label: opt.label || "",
              optionText: opt.optionText || "",
              isCorrect: opt.isCorrect === true || opt.isCorrect === "true" || opt.isCorrect === 1,
            };
          }),
        })),
      };
      
      console.log("[QuizEditForm] Setting form values:", formValues);
      console.log("[QuizEditForm] Questions count:", formValues.questions.length);
      formValues.questions.forEach((q, i) => {
        console.log(`[QuizEditForm] Question ${i + 1}:`, {
          questionText: q.questionText,
          optionsCount: q.options.length,
          options: q.options,
        });
      });
      
      // Set form values sau một chút delay để đảm bảo form đã được render
      setTimeout(() => {
        form.setFieldsValue(formValues);
      }, 100);
    }
  }, [quiz, form]);

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        title: quiz.title,
        timeLimitMinutes: quiz.timeLimitMinutes,
        difficulty: quiz.difficulty,
        objective: quiz.objective,
        rules: (quiz.rules ?? []).join("\n"),
        questions: (quiz.questions ?? []).map((q) => ({
          ...q,
          options: q.options ?? [],
        })),
      }}
      onFinish={onSave}
    >
      <Form.Item label="Tiêu đề" name="title" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Thời gian (phút)" name="timeLimitMinutes" rules={[{ required: true }]}>
        <InputNumber min={1} style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item label="Độ khó" name="difficulty" rules={[{ required: true }]}>
        <Select options={DIFFICULTY_OPTIONS} />
      </Form.Item>
      <Form.Item label="Mục tiêu" name="objective">
        <Input.TextArea rows={2} />
      </Form.Item>
      <Form.Item label="Quy tắc (mỗi dòng một quy tắc)" name="rules">
        <TextArea rows={3} />
      </Form.Item>
      <Divider>Câu hỏi và đáp án</Divider>
      <Form.List name="questions">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Card key={key} size="small" style={{ marginBottom: 16 }}>
                <Form.Item
                  {...restField}
                  name={[name, "questionText"]}
                  label="Câu hỏi"
                  rules={[{ required: true }]}
                >
                  <Input.TextArea rows={2} />
                </Form.Item>
                <Form.Item {...restField} name={[name, "hintText"]} label="Gợi ý">
                  <Input />
                </Form.Item>
                <Form.List name={[name, "options"]}>
                  {(optFields, { add: addOpt, remove: removeOpt }) => (
                    <>
                      {optFields.map(({ key: ok, name: on }) => (
                        <div
                          key={ok}
                          style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}
                        >
                          <Form.Item
                            {...restField}
                            name={[name, "options", on, "label"]}
                            style={{ width: 60, marginBottom: 0 }}
                          >
                            <Input placeholder="A" />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, "options", on, "optionText"]}
                            rules={[{ required: true }]}
                            style={{ flex: 1, marginBottom: 0 }}
                          >
                            <Input placeholder="Nội dung đáp án" />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, "options", on, "isCorrect"]}
                            style={{ marginBottom: 0 }}
                          >
                            <Select
                              style={{ width: 100 }}
                              options={[
                                { value: true, label: "Đúng" },
                                { value: false, label: "Sai" },
                              ]}
                            />
                          </Form.Item>
                          <Button type="link" danger size="small" onClick={() => removeOpt(on)}>
                            Xóa
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="dashed"
                        onClick={() =>
                          addOpt({
                            label: String.fromCharCode(65 + optFields.length),
                            optionText: "",
                            isCorrect: false,
                          })
                        }
                        block
                      >
                        + Thêm đáp án
                      </Button>
                    </>
                  )}
                </Form.List>
                <Button type="link" danger size="small" onClick={() => remove(name)} style={{ marginTop: 8 }}>
                  Xóa câu hỏi
                </Button>
              </Card>
            ))}
            <Button
              type="dashed"
              onClick={() =>
                add({
                  questionText: "",
                  hintText: "",
                  orderIndex: fields.length,
                  options: [
                    { label: "A", optionText: "", isCorrect: false },
                    { label: "B", optionText: "", isCorrect: false },
                  ],
                })
              }
              block
            >
              + Thêm câu hỏi
            </Button>
          </>
        )}
      </Form.List>
      <Form.Item style={{ marginTop: 24 }}>
        <Space>
          <Button type="primary" htmlType="submit" loading={saving}>
            Lưu
          </Button>
          <Button onClick={onCancel}>Hủy</Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
