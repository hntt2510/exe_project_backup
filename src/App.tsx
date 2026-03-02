import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import AdminLayout from "./components/admin/AdminLayout";
import StaffLayout from "./components/staff/StaffLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyCode from "./pages/VerifyCode";
import ResetPassword from "./pages/ResetPassword";
import { HomePage } from './pages';
import Tours from "./pages/Tours";
import TourDetail from "./components/tour/TourDetail";
import TourBooking from "./components/tourBooking";
import BookingConfirm from "./components/tourBooking/step2";
import PaymentPage from "./components/paymentMethods";
import ETicketPage from "./components/tourBooking/e-ticket";
import { ProfilePage } from "./components/profile";
import { About } from "./components/about";
import { ArtisanPage, ArtisanDetailPage } from "./components/artisan";
import { LearnPage, LessonDetailPage, QuizPage, QuizResultsPage } from "./pages/learn";

// Admin Pages
import AdminDashboardPage from "./pages/admin/AdminDashboard";
import ContentManagementPage from "./pages/admin/ContentManagement";
import TourManagementPage from "./pages/admin/TourManagement";
import BookingManagementPage from "./pages/admin/BookingManagement";
import ArtisanManagementPage from "./pages/admin/ArtisanManagement";
import UserManagementPage from "./pages/admin/UserManagement";
import StaffManagementPage from "./pages/admin/StaffManagement";
import EmailTemplatesPage from "./pages/admin/EmailTemplates";
import LearnManagementPage from "./pages/admin/LearnManagement";
import VoucherManagementPage from "./pages/admin/VoucherManagement";

// Staff Pages
import StaffDashboardPage from "./pages/staff/StaffDashboard";
import StaffBookingManagementPage from "./pages/staff/BookingManagement";
import TourCoordinationPage from "./pages/staff/TourCoordination";
import StaffArtisanManagementPage from "./pages/staff/ArtisanManagement";
import StaffContentManagementPage from "./pages/staff/ContentManagement";

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes - No layout wrapper */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-code" element={<VerifyCode />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Public Routes */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/tours" element={<Tours />} />
          <Route path="/tours/:id" element={<TourDetail />} />
          <Route path="/tours/:id/booking" element={<TourBooking />} />
          <Route path="/tours/:id/booking/confirm" element={<BookingConfirm />} />
          <Route path="/tours/:id/booking/payment" element={<PaymentPage />} />
          <Route path="/tours/:id/booking/e-ticket" element={<ETicketPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/artisans" element={<ArtisanPage />} />
          <Route path="/artisans/:id" element={<ArtisanDetailPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/learn/:moduleId" element={<LessonDetailPage />} />
          <Route path="/learn/:moduleId/quiz" element={<QuizPage />} />
          <Route path="/learn/:moduleId/quiz/results" element={<QuizResultsPage />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/content" element={<ContentManagementPage />} />
          <Route path="/admin/tours" element={<TourManagementPage />} />
          <Route path="/admin/bookings" element={<BookingManagementPage />} />
          <Route path="/admin/artisans" element={<ArtisanManagementPage />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/staff" element={<StaffManagementPage />} />
          <Route path="/admin/emails" element={<EmailTemplatesPage />} />
          <Route path="/admin/learn" element={<LearnManagementPage />} />
          <Route path="/admin/vouchers" element={<VoucherManagementPage />} />
        </Route>

        {/* Staff Routes */}
        <Route element={<StaffLayout />}>
          <Route path="/staff" element={<StaffDashboardPage />} />
          <Route path="/staff/bookings" element={<StaffBookingManagementPage />} />
          <Route path="/staff/tours" element={<TourCoordinationPage />} />
          <Route path="/staff/artisans" element={<StaffArtisanManagementPage />} />
          <Route path="/staff/content" element={<StaffContentManagementPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
