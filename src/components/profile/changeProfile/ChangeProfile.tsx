import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Calendar } from 'lucide-react';
import { message } from 'antd';
import { updateUserProfile, getCurrentUser, type UserProfile, type UpdateUserRequest } from '../../../services/profileApi';
import '../../../styles/components/profile/changeProfilescss/_change-profile.scss';

interface ChangeProfileProps {
  open: boolean;
  user: UserProfile;
  onClose: () => void;
  onUpdated: (updated: UserProfile) => void;
}

export default function ChangeProfile({ open, user, onClose, onUpdated }: ChangeProfileProps) {
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [dateOfBirth, setDateOfBirth] = useState(user.dateOfBirth?.split('T')[0] || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Sync form when user prop changes
  useEffect(() => {
    if (open) {
      setFullName(user.fullName);
      setEmail(user.email);
      setPhone(user.phone);
      setDateOfBirth(user.dateOfBirth?.split('T')[0] || '');
      setError('');
      setSuccess(false);
    }
  }, [open, user]);

  if (!open) return null;

  const handleClose = () => {
    setError('');
    setSuccess(false);
    onClose();
  };

  const validate = (): string | null => {
    if (!fullName.trim()) return 'Họ và tên không được để trống.';
    if (!email.trim()) return 'Email không được để trống.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email không hợp lệ.';
    if (phone && !/^[0-9]{9,11}$/.test(phone.replace(/\s+/g, '')))
      return 'Số điện thoại không hợp lệ.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Payload chuẩn PUT /api/users/{id}: phone, fullName, email, dateOfBirth (YYYY-MM-DD)
    const payload: UpdateUserRequest = {
      fullName: fullName.trim() || user.fullName,
      email: email.trim() || user.email,
      phone: phone.trim() || user.phone,
    };
    const dobValue = dateOfBirth?.trim() || user.dateOfBirth?.split('T')[0]?.trim();
    if (dobValue && /^\d{4}-\d{2}-\d{2}$/.test(dobValue)) {
      payload.dateOfBirth = dobValue;
    }

    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      const updated = await updateUserProfile(currentUser.id, payload);
      setSuccess(true);
      message.success('Cập nhật hồ sơ thành công!');

      // Also update localStorage
      const storedUser = localStorage.getItem('userInfo');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        localStorage.setItem(
          'userInfo',
          JSON.stringify({ ...parsed, ...updated }),
        );
      }

      onUpdated(updated);
      setTimeout(() => handleClose(), 1200);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; data?: Record<string, string>; errors?: Record<string, string> } } };
      const resData = axiosErr?.response?.data;
      let errMsg = resData?.message || 'Cập nhật thất bại. Vui lòng thử lại.';
      // Backend trả validation errors trong data.data hoặc data.errors
      const errDetails = (resData?.data ?? resData?.errors) as Record<string, string> | undefined;
      if (errDetails && typeof errDetails === 'object') {
        const details = Object.entries(errDetails)
          .map(([k, v]) => `${k}: ${v}`)
          .join('. ');
        if (details) errMsg = details;
      }
      setError(errMsg);
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-profile-overlay" onClick={handleClose}>
      <div className="change-profile" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="change-profile__header">
          <div className="change-profile__header-icon">
            <User size={20} />
          </div>
          <div>
            <h2 className="change-profile__title">Chỉnh sửa hồ sơ</h2>
            <p className="change-profile__subtitle">Cập nhật thông tin cá nhân của bạn</p>
          </div>
          <button className="change-profile__close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Success */}
        {success && (
          <div className="change-profile__success">Cập nhật thông tin thành công!</div>
        )}

        {/* Error */}
        {error && <div className="change-profile__error">{error}</div>}

        {/* Form */}
        <form className="change-profile__form" onSubmit={handleSubmit}>
          {/* Full name */}
          <div className="change-profile__field">
            <label className="change-profile__label">Họ và tên</label>
            <div className="change-profile__input-wrap">
              <User size={16} className="change-profile__input-icon" />
              <input
                type="text"
                className="change-profile__input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
              />
            </div>
          </div>

          {/* Email */}
          <div className="change-profile__field">
            <label className="change-profile__label">Email</label>
            <div className="change-profile__input-wrap">
              <Mail size={16} className="change-profile__input-icon" />
              <input
                type="email"
                className="change-profile__input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="change-profile__field">
            <label className="change-profile__label">Số điện thoại</label>
            <div className="change-profile__input-wrap">
              <Phone size={16} className="change-profile__input-icon" />
              <input
                type="tel"
                className="change-profile__input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912345678"
              />
            </div>
          </div>

          {/* Date of birth */}
          <div className="change-profile__field">
            <label className="change-profile__label">Ngày sinh</label>
            <div className="change-profile__input-wrap">
              <Calendar size={16} className="change-profile__input-icon" />
              <input
                type="date"
                className="change-profile__input"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="change-profile__actions">
            <button
              type="button"
              className="change-profile__btn change-profile__btn--cancel"
              onClick={handleClose}
              disabled={loading}
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="change-profile__btn change-profile__btn--submit"
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
