import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { RequireAuth, RequireAdmin, RequireSuperAdmin } from './components/ProtectedRoutes';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import ProductCatalog from './pages/ProductCatalog';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Wishlist from './pages/Wishlist';
import Notifications from './pages/Notifications';
import Prescriptions from './pages/Prescriptions';
import Reminders from './pages/Reminders';
import Account from './pages/Account';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import LabTests from './pages/LabTests';
import LabBookings from './pages/LabBookings';
import GoogleCallback from './pages/GoogleCallback';
import DeliveryPanel from './pages/DeliveryPanel';

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminDiscounts from './pages/admin/AdminDiscounts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOffers from './pages/admin/AdminOffers';
import AdminAdmins from './pages/admin/AdminAdmins';
import AdminAuditLog from './pages/admin/AdminAuditLog';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminPrescriptions from './pages/admin/AdminPrescriptions';
import AdminLabTests from './pages/admin/AdminLabTests';
import AdminLabBookings from './pages/admin/AdminLabBookings';
import AdminDelivery from './pages/admin/AdminDelivery';
import AdminCoupons from './pages/admin/AdminCoupons';

const PublicLayout = () => (
  <>
    <Navbar />
    <Outlet />
    <Footer />
  </>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <Toaster position="top-right" />
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<ProductCatalog />} />
                <Route path="/products/:slug" element={<ProductDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/google-callback" element={<GoogleCallback />} />
                <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
                <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
                <Route path="/orders/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
                <Route path="/prescriptions" element={<RequireAuth><Prescriptions /></RequireAuth>} />
                <Route path="/reminders" element={<RequireAuth><Reminders /></RequireAuth>} />
                <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/lab" element={<LabTests />} />
                <Route path="/lab/bookings" element={<RequireAuth><LabBookings /></RequireAuth>} />
                <Route path="/delivery" element={<RequireAuth><DeliveryPanel /></RequireAuth>} />
              </Route>
              <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="discounts" element={<AdminDiscounts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="offers" element={<AdminOffers />} />
                <Route path="admins" element={<RequireSuperAdmin><AdminAdmins /></RequireSuperAdmin>} />
                <Route path="audit" element={<RequireSuperAdmin><AdminAuditLog /></RequireSuperAdmin>} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="prescriptions" element={<AdminPrescriptions />} />
                <Route path="lab-tests" element={<AdminLabTests />} />
                <Route path="lab-bookings" element={<AdminLabBookings />} />
                <Route path="delivery" element={<AdminDelivery />} />
                <Route path="coupons" element={<AdminCoupons />} />
              </Route>
            </Routes>
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
