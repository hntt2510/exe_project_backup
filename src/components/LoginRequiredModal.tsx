import { Modal } from "antd";
import { useNavigate } from "react-router-dom";
import { setLoginRedirect } from "../utils/loginRedirectCookie";

interface LoginRequiredModalProps {
  open: boolean;
  onClose: () => void;
  /** Đường dẫn redirect sau khi đăng nhập (ví dụ: /lesson?id=1&moduleId=2) */
  redirectPath?: string;
  title?: string;
  content?: string;
}

export default function LoginRequiredModal({
  open,
  onClose,
  redirectPath,
  title = "Yêu cầu đăng nhập",
  content = "Vui lòng đăng nhập để xem bài học và làm quiz.",
}: LoginRequiredModalProps) {
  const navigate = useNavigate();

  const handleLogin = () => {
    if (redirectPath) {
      setLoginRedirect({ path: redirectPath });
    }
    onClose();
    navigate("/login");
  };

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      okText="Đăng nhập"
      cancelText="Hủy"
      onOk={handleLogin}
      centered
    >
      <p style={{ margin: 0 }}>{content}</p>
    </Modal>
  );
}
