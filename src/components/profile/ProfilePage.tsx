import { useEffect, useState, useRef } from "react";
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
  getAllUserVouchers,
  getLearnStats,
  getLearnCourses,
  getSavedLessons,
  getMyReviews,
  uploadAvatar,
  updateUserProfile,
  type UserProfile,
  type UserBooking,
  type UserVoucherWithSource,
  type LearnStats,
  type FeaturedCourse,
  type MyReview,
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

const SCROLL_OFFSET = 120; // navbar + buffer

export default function ProfilePage() {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("overview");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [vouchers, setVouchers] = useState<UserVoucherWithSource[]>([]);
  const [learnStats, setLearnStats] = useState<LearnStats | null>(null);
  const [coursesInProgress, setCoursesInProgress] = useState<FeaturedCourse[]>([]);
  const [savedCourses, setSavedCourses] = useState<FeaturedCourse[]>([]);
  const [myReviews, setMyReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isScrollingRef = useRef(false);

  /* ---------- Scroll spy: IntersectionObserver ---------- */
  useEffect(() => {
    const ids = NAV_ITEMS.map((i) => i.id);
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => ({
            id: (e.target as HTMLElement).id.replace("section-", ""),
            top: e.boundingClientRect.top,
          }))
          .filter((x) => ids.includes(x.id));
        if (visible.length === 0) return;
        const topmost = visible.reduce((a, b) => (a.top < b.top ? a : b));
        setActiveSection(topmost.id);
      },
      { root: null, rootMargin: `-${SCROLL_OFFSET}px 0px -50% 0px`, threshold: 0 }
    );

    const raf = requestAnimationFrame(() => {
      ids.forEach((id) => {
        const el = sectionRefs.current[id];
        if (el) observer.observe(el);
      });
    });
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [loading]);

  /* ---------- Navigate to section ---------- */
  const scrollToSection = (id: string) => {
    const el = sectionRefs.current[id];
    if (!el) return;

    isScrollingRef.current = true;
    setActiveSection(id);
    el.scrollIntoView({ behavior: "smooth", block: "start" });

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
        const [profileData, bookingsData, vouchersData, statsData, coursesData, savedData, reviewsData] =
          await Promise.all([
            getUserProfile(userId).catch(() => null),
            getUserBookings().catch(() => [] as UserBooking[]),
            getAllUserVouchers().catch(() => [] as UserVoucherWithSource[]),
            getLearnStats().catch(() => null),
            getLearnCourses().catch(() => [] as FeaturedCourse[]),
            getSavedLessons().catch(() => [] as FeaturedCourse[]),
            getMyReviews().catch(() => [] as MyReview[]),
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
            role: parsed.role,
            status: "ACTIVE",
            createdAt: parsed.createdAt || new Date().toISOString(),
          });
        }

        setBookings(bookingsData);
        setVouchers(vouchersData);
        if (statsData) setLearnStats(statsData);
        setCoursesInProgress(coursesData ?? []);
        setSavedCourses(savedData ?? []);
        setMyReviews(reviewsData ?? []);
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
      const [bookingsData, reviewsData] = await Promise.all([
        getUserBookings(),
        getMyReviews(),
      ]);
      setBookings(bookingsData);
      setMyReviews(reviewsData ?? []);
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
            <ProfileOrders bookings={bookings} myReviews={myReviews} onReviewSuccess={handleReviewSuccess} />
          </div>

          <div
            id="section-learn"
            ref={(el) => {
              sectionRefs.current.learn = el;
            }}
            className="profile-page__section profile-page__section--card"
          >
            <ProfileLearn stats={learnStats} coursesInProgress={coursesInProgress} savedCourses={savedCourses} />
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
