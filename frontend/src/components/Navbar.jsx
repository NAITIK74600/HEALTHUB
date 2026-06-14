import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, LogOut, ClipboardList, LayoutDashboard, Truck, Clock, Phone, Heart, FileText, Bell as BellIcon, User, FlaskConical, Search, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import CartDrawer from './CartDrawer';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const { items: wishItems } = useWishlist();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const navigate = useNavigate();
  const WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER || '917303240289';

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQ.trim())}`);
      setSearchQ('');
    }
  };

  return (
    <>
      {/* ── Top Announcement Bar ─────────────────────────────── */}
      <div className="topbar">
        <span className="topbar__item"><Truck size={13} /> Free Delivery above ₹499</span>
        <span className="topbar__divider" />
        <span className="topbar__item"><Clock size={13} /> Open 8 AM – 11:45 PM daily</span>
        <span className="topbar__divider" />
        <a
          href={`https://wa.me/${WHATSAPP}`}
          target="_blank" rel="noopener noreferrer"
          className="topbar__item"
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          <Phone size={13} /> 7303240289
        </a>
      </div>

      {/* ── Main Navbar ──────────────────────────────────────── */}
      <nav className="navbar">
        <div className="navbar__inner">
          {/* Logo */}
          <Link to="/" className="navbar__brand" aria-label="Health Hub home">
            <div className="navbar__logo">
              <img src="/logo.jpg?v=5" className="navbar__logo-img" alt="Health Hub" />
            </div>
          </Link>

          {/* Location (desktop) */}
          <div className="navbar__location">
            <MapPin size={14} />
            <div>
              <span className="navbar__location-label">Deliver to</span>
              <span className="navbar__location-city">New Delhi</span>
            </div>
          </div>

          {/* Search bar */}
          <form className="navbar__search" onSubmit={handleSearch}>
            <Search size={16} className="navbar__search-icon" />
            <input
              type="text"
              className="navbar__search-input"
              placeholder="Search for medicines, health products, brands..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
            <button type="submit" className="navbar__search-btn">Search</button>
          </form>

          {/* Actions */}
          <div className="navbar__actions">
            <Link to="/wishlist" className="navbar__wish-btn" aria-label="Wishlist">
              <Heart size={18} />
              {wishItems.length > 0 && <span className="navbar__wish-count">{wishItems.length}</span>}
            </Link>
            {user && <NotificationBell adminMode={false} />}

            {/* My Account */}
            {user ? (
              <div className="navbar__account-wrap">
                <Link to="/account" className="navbar__account-btn">
                  <User size={16} />
                  <div className="navbar__account-text">
                    <span className="navbar__account-label">Hello, {user.name?.split(' ')[0] || 'User'}</span>
                    <span className="navbar__account-sub">My Account</span>
                  </div>
                </Link>
              </div>
            ) : (
              <Link to="/login" className="navbar__account-btn">
                <User size={16} />
                <div className="navbar__account-text">
                  <span className="navbar__account-label">Hello, Sign In</span>
                  <span className="navbar__account-sub">My Account</span>
                </div>
              </Link>
            )}

            <button className="navbar__cart-btn" onClick={() => setDrawerOpen(true)} aria-label="Open cart">
              <ShoppingCart size={18} />
              <span>Cart</span>
              {totalItems > 0 && <span className="navbar__cart-count">{totalItems}</span>}
            </button>

            {isAdmin && (
              <Link to="/admin" className="navbar__admin-btn" aria-label="Admin Dashboard">
                <LayoutDashboard size={16} />
                <span>Admin</span>
              </Link>
            )}

            <button
              className="navbar__menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* ── Mobile menu drawer ── */}
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
              <Link to="/register" className="btn btn--primary btn--sm" onClick={() => setMobileOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      </nav>

      {/* Dedicated mobile search strip */}
      <div className="navbar__mobile-search-shell">
        <form className="navbar__search navbar__search--mobile" onSubmit={handleSearch}>
          <Search size={16} className="navbar__search-icon" />
          <input
            type="text"
            className="navbar__search-input"
            placeholder="Search medicines, brands, health products"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
          <button type="submit" className="navbar__search-btn">Search</button>
        </form>
      </div>

      <CartDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
