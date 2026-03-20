import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout() {
  const { pathname } = useLocation();
  const isTourDetail = /^\/tours\/\d+$/.test(pathname);
  const isProfile = pathname === "/profile";

  return (
    <div className={`main-layout ${isTourDetail ? 'main-layout--tour-detail' : ''} ${isProfile ? 'main-layout--profile' : ''}`}>
      <Navbar />
      <main className="main-layout__content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
