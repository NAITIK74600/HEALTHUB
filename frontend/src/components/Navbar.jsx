import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ShoppingCart, Menu, X, LogOut, ClipboardList, LayoutDashboard, Truck, Clock, Phone, Heart, FileText, Bell as BellIcon, User, FlaskConical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import CartDrawer from './CartDrawer';
import NotificationBell from './NotificationBell';

function CapsuleLogo({ className }) {
  return (
    <svg viewBox="0 0 56 96" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect x="6" y="4" width="44" height="88" rx="22" fill="white" stroke="#27AE60" strokeWidth="3.5"/>
      <clipPath id="nv-cap-top"><rect x="0" y="0" width="56" height="50"/></clipPath>
      <rect x="6" y="4" width="44" height="88" rx="22" fill="#3451D1" clipPath="url(#nv-cap-top)"/>
      <line x1="6" y1="48" x2="50" y2="48" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
      <ellipse cx="22" cy="10" rx="7" ry="13" fill="#27AE60" transform="rotate(-25 22 10)"/>
      <ellipse cx="34" cy="6" rx="7" ry="13" fill="#1E9e55" transform="rotate(18 34 6)"/>
      <line x1="28" y1="58" x2="28" y2="78" stroke="#3451D1" strokeWidth="5.5" strokeLinecap="round"/>
      <line x1="18" y1="68" x2="38" y2="68" stroke="#3451D1" strokeWidth="5.5" strokeLinecap="round"/>
      <line x1="18" y1="84" x2="18" y2="91" stroke="#3451D1" strokeWidth="3.5" strokeLinecap="round" opacity="0.8"/>
      <line x1="14" y1="88" x2="22" y2="88" stroke="#3451D1" strokeWidth="3.5" strokeLinecap="round" opacity="0.8"/>
      <line x1="38" y1="84" x2="38" y2="91" stroke="#3451D1" strokeWidth="3.5" strokeLinecap="round" opacity="0.8"/>
      <line x1="34" y1="88" x2="42" y2="88" stroke="#3451D1" strokeWidth="3.5" strokeLinecap="round" opacity="0.8"/>
    </svg>
  );
}

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const { items: wishItems } = useWishlist();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER || '919990165925';

  return (
    <>
      {/* ── Top Announcement Bar ─────────────────────────────── */}
      <div className="topbar">
        <span className="topbar__item"><Truck size={13} /> Free Delivery above ₹499</span>
        <span className="topbar__divider" />
        <span className="topbar__item"><Clock size={13} /> Open 9 AM – 11:45 PM daily</span>
        <span className="topbar__divider" />
        <a
          href={`https://wa.me/${WHATSAPP}`}
          target="_blank" rel="noopener noreferrer"
          className="topbar__item"
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          <Phone size={13} /> 9990165925
        </a>
      </div>

      {/* ── Main Navbar ──────────────────────────────────────── */}
      <nav className="navbar">
        <div className="navbar__inner">
          {/* Logo */}
          <Link to="/" className="navbar__brand">
            <div className="navbar__logo">
              <CapsuleLogo className="navbar__logo-img" />
            </div>
            <div className="navbar__brand-text">
              <span className="navbar__brand-red">Batla Medicos</span>
              <span className="navbar__brand-green">Chemist &amp; Cosmetics</span>
            </div>
          </Link>

          {/* Nav links */}
          <div className={`navbar__links ${mobileOpen ? 'navbar__links--open' : ''}`}>
            <NavLink to="/" end onClick={() => setMobileOpen(false)}>Home</NavLink>
            <NavLink to="/products" onClick={() => setMobileOpen(false)}>Products</NavLink>
            {user ? (
              <>
                <NavLink to="/orders" onClick={() => setMobileOpen(false)}>
                  <ClipboardList size={15} /> My Orders
                </NavLink>
                <NavLink to="/prescriptions" onClick={() => setMobileOpen(false)}>
                  <FileText size={15} /> Prescriptions
                </NavLink>
                <NavLink to="/lab" onClick={() => setMobileOpen(false)}>
                  <FlaskConical size={15} /> Lab Tests
                </NavLink>
                <NavLink to="/reminders" onClick={() => setMobileOpen(false)}>
                  <BellIcon size={15} /> Reminders
                </NavLink>
                <NavLink to="/account" onClick={() => setMobileOpen(false)}>
                  <User size={15} /> Account
                </NavLink>
                {isAdmin && (
                  <NavLink to="/admin" onClick={() => setMobileOpen(false)}>
                    <LayoutDashboard size={15} /> Admin
                  </NavLink>
                )}
                <button className="navbar__logout" onClick={() => { logout(); setMobileOpen(false); }}>
                  <LogOut size={15} /> Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={() => setMobileOpen(false)}>Login</NavLink>
                <Link
                  to="/register"
                  className="btn btn--primary btn--sm"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="navbar__actions">
            <Link to="/wishlist" className="navbar__wish-btn" aria-label="Wishlist">
              <Heart size={18} />
              {wishItems.length > 0 && <span className="navbar__wish-count">{wishItems.length}</span>}
            </Link>
            {user && <NotificationBell adminMode={false} />}
            <button className="navbar__cart-btn" onClick={() => setDrawerOpen(true)} aria-label="Open cart">
              <ShoppingCart size={18} />
              <span>Cart</span>
              {totalItems > 0 && <span className="navbar__cart-count">{totalItems}</span>}
            </button>
            <button
              className="navbar__menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>
      <CartDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
