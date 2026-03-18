import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Layout from "./components/Layout";
import AdminLayout from "./components/admin/AdminLayout";
import StaffLayout from "./components/staff/StaffLayout";
import RequireAuth from "./components/RequireAuth";

// Critical path - load ngay
import { HomePage } from './pages';
import Login from "./pages/Login";
import GoogleAuthCallback from "./pages/GoogleAuthCallback";

// Lazy - chỉ load khi vào route
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const VerifyCode = lazy(() => import("./pages/VerifyCode"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Tours = lazy(() => import("./pages/Tours"));
const TourDetail = lazy(() => import("./components/tour/TourDetail"));
const TourBooking = lazy(() => import("./components/tourBooking"));
const BookingConfirm = lazy(() => import("./components/tourBooking/step2"));
const PaymentPage = lazy(() => import("./components/paymentMethods").then(m => ({ default: m.PaymentPage })));
const PaymentReturnPage = lazy(() => import("./components/paymentMethods").then(m => ({ default: m.PaymentReturnPage })));
const PaymentFailurePage = lazy(() => import("./components/paymentMethods").then(m => ({ default: m.PaymentFailurePage })));
const ETicketPage = lazy(() => import("./components/tourBooking/e-ticket"));
const ProfilePage = lazy(() => import("./components/profile").then(m => ({ default: m.ProfilePage })));
const About = lazy(() => import("./components/about").then(m => ({ default: m.About })));
const ArtisanPage = lazy(() => import("./components/artisan").then(m => ({ default: m.ArtisanPage })));
const ArtisanDetailPage = lazy(() => import("./components/artisan").then(m => ({ default: m.ArtisanDetailPage })));
const BlogPage = lazy(() => import("./components/blog").then(m => ({ default: m.BlogPage })));
const BlogDetailPage = lazy(() => import("./components/blog").then(m => ({ default: m.BlogDetailPage })));
const PolicyPage = lazy(() => import("./pages/PolicyPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const BookingReviewPage = lazy(() => import("./pages/BookingReviewPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const GuidePage = lazy(() => import("./pages/GuidePage"));
const AIChatBox = lazy(() => import("./components/AIChatBox"));

const LearnPage = lazy(() => import("./pages/learn").then(m => ({ default: m.LearnPage })));
const LessonDetailPage = lazy(() => import("./pages/learn").then(m => ({ default: m.LessonDetailPage })));
const LessonPage = lazy(() => import("./pages/learn").then(m => ({ default: m.LessonPage })));
const QuizPage = lazy(() => import("./pages/learn").then(m => ({ default: m.QuizPage })));
const QuizResultsPage = lazy(() => import("./pages/learn").then(m => ({ default: m.QuizResultsPage })));

// Admin
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboard"));
const ContentManagementPage = lazy(() => import("./pages/admin/ContentManagement"));
const TourManagementPage = lazy(() => import("./pages/admin/TourManagement"));
const BookingManagementPage = lazy(() => import("./pages/admin/BookingManagement"));
const ArtisanManagementPage = lazy(() => import("./pages/admin/ArtisanManagement"));
const UserManagementPage = lazy(() => import("./pages/admin/UserManagement"));
const StaffManagementPage = lazy(() => import("./pages/admin/StaffManagement"));
const LearnManagementPage = lazy(() => import("./pages/admin/LearnManagement"));
const VoucherManagementPage = lazy(() => import("./pages/admin/VoucherManagement"));
const FeedbackManagementPage = lazy(() => import("./pages/admin/FeedbackManagement"));
const MailManagementPage = lazy(() => import("./pages/admin/MailManagement"));
const LeadManagementPage = lazy(() => import("./pages/admin/LeadManagement"));
const TourScheduleManagementPage = lazy(() => import("./pages/admin/TourScheduleManagement"));

// Staff
const StaffDashboardPage = lazy(() => import("./pages/staff/StaffDashboard"));
const StaffBookingManagementPage = lazy(() => import("./pages/staff/BookingManagement"));
const TourCoordinationPage = lazy(() => import("./pages/staff/TourCoordination"));
const StaffArtisanManagementPage = lazy(() => import("./pages/staff/ArtisanManagement"));
const StaffContentManagementPage = lazy(() => import("./pages/staff/ContentManagement"));

function PageFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
      <div className="home-loading-toast__spinner" style={{ width: 32, height: 32 }} />
    </div>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Suspense fallback={null}>
        <AIChatBox />
      </Suspense>
      <Routes>
        {/* Auth Routes - No layout wrapper */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Suspense fallback={<PageFallback />}><Register /></Suspense>} />
        <Route path="/forgot-password" element={<Suspense fallback={<PageFallback />}><ForgotPassword /></Suspense>} />
        <Route path="/verify-code" element={<Suspense fallback={<PageFallback />}><VerifyCode /></Suspense>} />
        <Route path="/reset-password" element={<Suspense fallback={<PageFallback />}><ResetPassword /></Suspense>} />
        <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
        <Route path="/oauth2/callback" element={<GoogleAuthCallback />} />
        <Route path="/oauth2/redirect" element={<GoogleAuthCallback />} />
        <Route path="/login/oauth2/code/google" element={<GoogleAuthCallback />} />

        {/* Public Routes */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/tours" element={<Suspense fallback={<PageFallback />}><Tours /></Suspense>} />
          <Route path="/tours/:id" element={<Suspense fallback={<PageFallback />}><TourDetail /></Suspense>} />
          <Route path="/tours/:id/booking" element={<Suspense fallback={<PageFallback />}><TourBooking /></Suspense>} />
          <Route path="/tours/:id/booking/confirm" element={<Suspense fallback={<PageFallback />}><BookingConfirm /></Suspense>} />
          <Route path="/tours/:id/booking/payment" element={<Suspense fallback={<PageFallback />}><PaymentPage /></Suspense>} />
          <Route path="/tours/:id/booking/e-ticket" element={<Suspense fallback={<PageFallback />}><ETicketPage /></Suspense>} />
          <Route path="/payment-return/vnpay" element={<Suspense fallback={<PageFallback />}><PaymentReturnPage /></Suspense>} />
          <Route path="/payment-return/momo" element={<Suspense fallback={<PageFallback />}><PaymentReturnPage /></Suspense>} />
          <Route path="/payment-failure" element={<Suspense fallback={<PageFallback />}><PaymentFailurePage /></Suspense>} />
          <Route path="/profile" element={<Suspense fallback={<PageFallback />}><ProfilePage /></Suspense>} />
          <Route path="/bookings/:bookingId/review" element={<Suspense fallback={<PageFallback />}><BookingReviewPage /></Suspense>} />
          <Route path="/artisans" element={<Suspense fallback={<PageFallback />}><ArtisanPage /></Suspense>} />
          <Route path="/artisans/:id" element={<Suspense fallback={<PageFallback />}><ArtisanDetailPage /></Suspense>} />
          <Route path="/blog" element={<Suspense fallback={<PageFallback />}><BlogPage /></Suspense>} />
          <Route path="/blog/:id" element={<Suspense fallback={<PageFallback />}><BlogDetailPage /></Suspense>} />
          <Route path="/about" element={<Suspense fallback={<PageFallback />}><About /></Suspense>} />
          <Route path="/policy" element={<Suspense fallback={<PageFallback />}><PolicyPage /></Suspense>} />
          <Route path="/contact" element={<Suspense fallback={<PageFallback />}><ContactPage /></Suspense>} />
          <Route path="/faq" element={<Suspense fallback={<PageFallback />}><FAQPage /></Suspense>} />
          <Route path="/guide" element={<Suspense fallback={<PageFallback />}><GuidePage /></Suspense>} />
          <Route path="/learn" element={<Suspense fallback={<PageFallback />}><LearnPage /></Suspense>} />
          <Route path="/learn/:moduleId" element={<Suspense fallback={<PageFallback />}><LessonDetailPage /></Suspense>} />
          <Route path="/lesson" element={<RequireAuth><Suspense fallback={<PageFallback />}><LessonPage /></Suspense></RequireAuth>} />
          <Route path="/learn/:moduleId/quiz" element={<RequireAuth><Suspense fallback={<PageFallback />}><QuizPage /></Suspense></RequireAuth>} />
          <Route path="/learn/:moduleId/quiz/results" element={<RequireAuth><Suspense fallback={<PageFallback />}><QuizResultsPage /></Suspense></RequireAuth>} />
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Suspense fallback={<PageFallback />}><AdminDashboardPage /></Suspense>} />
          <Route path="/admin/content" element={<Suspense fallback={<PageFallback />}><ContentManagementPage /></Suspense>} />
          <Route path="/admin/tours" element={<Suspense fallback={<PageFallback />}><TourManagementPage /></Suspense>} />
          <Route path="/admin/tour-schedules" element={<Suspense fallback={<PageFallback />}><TourScheduleManagementPage /></Suspense>} />
          <Route path="/admin/bookings" element={<Suspense fallback={<PageFallback />}><BookingManagementPage /></Suspense>} />
          <Route path="/admin/artisans" element={<Suspense fallback={<PageFallback />}><ArtisanManagementPage /></Suspense>} />
          <Route path="/admin/users" element={<Suspense fallback={<PageFallback />}><UserManagementPage /></Suspense>} />
          <Route path="/admin/staff" element={<Suspense fallback={<PageFallback />}><StaffManagementPage /></Suspense>} />
          <Route path="/admin/learn" element={<Suspense fallback={<PageFallback />}><LearnManagementPage /></Suspense>} />
          <Route path="/admin/vouchers" element={<Suspense fallback={<PageFallback />}><VoucherManagementPage /></Suspense>} />
          <Route path="/admin/feedback" element={<Suspense fallback={<PageFallback />}><FeedbackManagementPage /></Suspense>} />
          <Route path="/admin/mails" element={<Suspense fallback={<PageFallback />}><MailManagementPage /></Suspense>} />
          <Route path="/admin/leads" element={<Suspense fallback={<PageFallback />}><LeadManagementPage /></Suspense>} />
        </Route>

        {/* Staff Routes */}
        <Route element={<StaffLayout />}>
          <Route path="/staff" element={<Suspense fallback={<PageFallback />}><StaffDashboardPage /></Suspense>} />
          <Route path="/staff/bookings" element={<Suspense fallback={<PageFallback />}><StaffBookingManagementPage /></Suspense>} />
          <Route path="/staff/tours" element={<Suspense fallback={<PageFallback />}><TourCoordinationPage /></Suspense>} />
          <Route path="/staff/artisans" element={<Suspense fallback={<PageFallback />}><StaffArtisanManagementPage /></Suspense>} />
          <Route path="/staff/content" element={<Suspense fallback={<PageFallback />}><StaffContentManagementPage /></Suspense>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
