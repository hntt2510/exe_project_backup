import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { User, ShoppingBag, BookOpen, Ticket } from "lucide-react";
import Breadcrumbs from "../Breadcrumbs";
import ProfileHeader from "./ProfileHeader";
import ProfileOverview from "./ProfileOverview";
import ProfileOrders from "./ProfileOrders";
import ProfileLearn from "./ProfileLearn";
import ProfileVoucher from "./ProfileVoucher";
import { ChangePassword } from "./changePass";
import { ChangeProfile } from "./changeProfile";
import {
  getUserProfile,
  getUserBookings,
  getUserVouchers,
  getLearnStats,
  getSavedLessons,
  uploadAvatar,
  updateUserProfile,
  type UserProfile,
  type UserBooking,
  type UserVoucher,
  type LearnStats,
  type FeaturedCourse,
} from "../../services/profileApi";
import { authLogout } from "../../services/authApi";
import { clearAuthSession } from "../../utils/authSession";
import { message } from "antd";
import "../../styles/components/profile/_profile-page.scss";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Tổng quan", icon: <User size={18} /> },
  { id: "orders", label: "Đơn của tôi", icon: <ShoppingBag size={18} /> },
  { id: "learn", label: "Học & Quiz", icon: <BookOpen size={18} /> },
  { id: "voucher", label: "Ví Voucher", icon: <Ticket size={18} /> },
];

const SCROLL_OFFSET = 120; // navbar + sticky nav height buffer

export default function ProfilePage() {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("overview");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [vouchers, setVouchers] = useState<UserVoucher[]>([]);
  const [learnStats, setLearnStats] = useState<LearnStats | null>(null);
  const [savedCourses, setSavedCourses] = useState<FeaturedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Section refs
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isScrollingRef = useRef(false);

  /* ---------- Scroll spy ---------- */
  const handleScroll = useCallback(() => {
    if (isScrollingRef.current) return;

    const scrollY = window.scrollY + SCROLL_OFFSET + 40;
    let current = "overview";

    for (const item of NAV_ITEMS) {
      const el = sectionRefs.current[item.id];
      if (el && el.offsetTop <= scrollY) {
        current = item.id;
      }
    }
    setActiveSection(current);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  /* ---------- Scroll to section ---------- */
  const scrollToSection = (id: string) => {
    const el = sectionRefs.current[id];
    if (!el) return;

    isScrollingRef.current = true;
    setActiveSection(id);

    const top = el.offsetTop - SCROLL_OFFSET;
    window.scrollTo({ top, behavior: "smooth" });

    // Re-enable scroll spy after animation
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 800);
  };

  /* ---------- Data fetch ---------- */
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const storedUser = localStorage.getItem("userInfo");
    if (!storedUser) {
      navigate("/login", { replace: true });
      return;
    }

    const parsed = JSON.parse(storedUser);
    const userId = parsed.id as number;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [profileData, bookingsData, vouchersData, statsData, savedData] =
          await Promise.all([
            getUserProfile(userId).catch(() => null),
            getUserBookings().catch(() => [] as UserBooking[]),
            getUserVouchers().catch(() => [] as UserVoucher[]),
            getLearnStats().catch(() => null),
            getSavedLessons().catch(() => [] as FeaturedCourse[]),
          ]);

        if (profileData) {
          // If API returns no avatarUrl but localStorage has one, prefer localStorage
          const localAvatar = parsed.avatarUrl || "";
          if (
            (!profileData.avatarUrl || profileData.avatarUrl === "null") &&
            localAvatar
          ) {
            profileData.avatarUrl = localAvatar;
          }
          // Also sync back to localStorage so navbar stays in sync
          if (profileData.avatarUrl) {
            const freshStore = localStorage.getItem("userInfo");
            if (freshStore) {
              const freshParsed = JSON.parse(freshStore);
              if (freshParsed.avatarUrl !== profileData.avatarUrl) {
                localStorage.setItem(
                  "userInfo",
                  JSON.stringify({
                    ...freshParsed,
                    avatarUrl: profileData.avatarUrl,
                  }),
                );
              }
            }
          }
          setUser(profileData);
        } else {
          setUser({
            id: parsed.id,
            username: parsed.fullName,
            email: parsed.email,
            phone: parsed.phone || "",
            fullName: parsed.fullName,
            avatarUrl: parsed.avatarUrl || "",
            dateOfBirth: "",
            gender: "OTHER",
            role: parsed.role,
            status: "ACTIVE",
            createdAt: parsed.createdAt || new Date().toISOString(),
          });
        }

        setBookings(bookingsData);
        setVouchers(vouchersData);
        if (statsData) setLearnStats(statsData);
        setSavedCourses(savedData ?? []);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [navigate]);

  /* ---------- Handlers ---------- */
  const handleLogout = async () => {
    try {
      await authLogout();
    } catch {
      // ignore
    } finally {
      clearAuthSession();
      navigate("/");
    }
  };

  const handleAvatarChange = async (file: File) => {
    try {
      // 1. Upload file → get URL
      const url = await uploadAvatar(file);
      console.log("[Avatar] Upload response URL:", url);

      // 2. Update local state immediately so UI reflects the change
      setUser((prev) => (prev ? { ...prev, avatarUrl: url } : prev));

      // Update localStorage
      const storedUser = localStorage.getItem("userInfo");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        localStorage.setItem(
          "userInfo",
          JSON.stringify({ ...parsed, avatarUrl: url }),
        );
      }

      // 3. Also persist avatarUrl on user profile via PUT /api/users/{id}
      if (user) {
        try {
          await updateUserProfile(user.id, {
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            dateOfBirth: user.dateOfBirth?.split("T")[0] || "",
            avatarUrl: url,
          });
        } catch (profileErr) {
          console.warn(
            "[Avatar] Profile update with avatarUrl failed (avatar still uploaded):",
            profileErr,
          );
        }
      }

      message.success("Cập nhật ảnh đại diện thành công!");
    } catch (err) {
      console.error("Avatar upload failed:", err);
      message.error("Tải ảnh thất bại. Vui lòng thử lại.");
    }
  };

  const handleEditProfile = () => {
    setShowEditProfile(true);
  };

  const handleChangePassword = () => {
    setShowChangePassword(true);
  };

  const handleProfileUpdated = (updated: UserProfile) => {
    setUser(updated);
  };

  const handleReviewSuccess = async () => {
    try {
      const storedUser = localStorage.getItem('userInfo');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const bookingsData = await getUserBookings();
        setBookings(bookingsData);
      }
    } catch {
      // ignore
    }
  };

  /* ---------- Loading ---------- */
  if (loading || !user) {
    return (
      <div className="profile-page-loading">
        <div className="profile-page-loading__spinner" />
        <p>Đang tải hồ sơ...</p>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "Trang chủ", path: "/" },
    { label: "Tài khoản" },
  ];

  return (
    <div className="profile-page">
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <ProfileHeader
        user={user}
        onEditProfile={handleEditProfile}
        onChangePassword={handleChangePassword}
        onLogout={handleLogout}
        onAvatarChange={handleAvatarChange}
      />

      {/* Landing layout: sticky sidebar + sections */}
      <div className="profile-page__body">
        {/* Sticky sidebar nav */}
        <nav className="profile-page__sidebar">
          <ul className="profile-page__nav">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  className={`profile-page__nav-item ${
                    activeSection === item.id
                      ? "profile-page__nav-item--active"
                      : ""
                  }`}
                  onClick={() => scrollToSection(item.id)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* All sections stacked */}
        <div className="profile-page__sections">
          <div
            id="section-overview"
            ref={(el) => {
              sectionRefs.current.overview = el;
            }}
            className="profile-page__section"
          >
            <ProfileOverview
              user={user}
              stats={learnStats}
              bookings={bookings}
              vouchers={vouchers}
            />
          </div>

          <div
            id="section-orders"
            ref={(el) => {
              sectionRefs.current.orders = el;
            }}
            className="profile-page__section profile-page__section--card"
          >
            <ProfileOrders bookings={bookings} onReviewSuccess={handleReviewSuccess} />
          </div>

          <div
            id="section-learn"
            ref={(el) => {
              sectionRefs.current.learn = el;
            }}
            className="profile-page__section profile-page__section--card"
          >
            <ProfileLearn stats={learnStats} savedCourses={savedCourses} />
          </div>

          <div
            id="section-voucher"
            ref={(el) => {
              sectionRefs.current.voucher = el;
            }}
            className="profile-page__section profile-page__section--card"
          >
            <ProfileVoucher vouchers={vouchers} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <ChangePassword
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
      {user && (
        <ChangeProfile
          open={showEditProfile}
          user={user}
          onClose={() => setShowEditProfile(false)}
          onUpdated={handleProfileUpdated}
        />
      )}
    </div>
  );
}
