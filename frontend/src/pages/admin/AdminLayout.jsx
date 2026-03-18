import { useState, useEffect, Component } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, Tag, Percent, Shield, LogOut, ExternalLink, ChevronLeft, ChevronRight, Bell, FileText, FlaskConical, Menu, X, Truck, Ticket, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../../components/NotificationBell';

class AdminErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('Admin page error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="admin-page" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2 style={{ color: '#C0392B', marginBottom: 12 }}>Something went wrong</h2>
          <p style={{ color: '#666', marginBottom: 20 }}>{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <button className="btn btn--primary" onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const NAV = [
  { to: '/admin',                label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/admin/products',       label: 'Products',       icon: Package },
  { to: '/admin/discounts',      label: 'Discounts',      icon: Percent },
  { to: '/admin/orders',         label: 'Orders',         icon: ShoppingBag },
  { to: '/admin/users',          label: 'Customers',      icon: Users },
  { to: '/admin/offers',         label: 'Offers',         icon: Tag },
  { to: '/admin/prescriptions',  label: 'Prescriptions',  icon: FileText },
  { to: '/admin/lab-tests',      label: 'Lab Tests',      icon: FlaskConical },
  { to: '/admin/lab-bookings',   label: 'Lab Bookings',   icon: FlaskConical },
  { to: '/admin/delivery',       label: 'Delivery',       icon: Truck },
  { to: '/admin/coupons',        label: 'Coupons',        icon: Ticket },
  { to: '/admin/brands',         label: 'Brands',         icon: Star },
  { to: '/admin/notifications',  label: 'Notifications',  icon: Bell },
  { to: '/admin/admins',         label: 'Admins',         icon: Shield, superAdminOnly: true },
  { to: '/admin/audit',          label: 'Audit Log',      icon: Shield, superAdminOnly: true },
];

export default function AdminLayout() {
  const { user, logout, isSuperAdmin } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth > 768) setMobileOpen(false); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const links = NAV.filter(n => !n.superAdminOnly || isSuperAdmin);

  const SidebarContent = ({ collapsed }) => (
    <>
      <div className="admin-sidebar__brand">
        {!collapsed && <><span className="brand-gradient">BM</span> Admin</>}
        <button
          className="admin-sidebar__toggle"
          onClick={() => setSidebarOpen(o => !o)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="admin-nav">
        {links.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`admin-nav__link ${location.pathname === to ? 'admin-nav__link--active' : ''}`}
          >
            <Icon size={18} />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>

      <div className="admin-sidebar__footer">
        {!collapsed && (
          <>
            <p className="admin-sidebar__user">{user?.name}</p>
            <span className="badge">{user?.role?.toUpperCase()}</span>
          </>
        )}
        <Link to="/" className="admin-sidebar__exit-btn" title="Back to store">
          <ExternalLink size={15} />
          {!collapsed && <span>View Store</span>}
        </Link>
        <button className="admin-sidebar__logout-btn" onClick={logout} title="Logout">
          <LogOut size={15} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="admin-layout">
      {/* Desktop sidebar */}
      <aside className={`admin-sidebar admin-sidebar--desktop ${sidebarOpen ? '' : 'admin-sidebar--collapsed'}`}>
        <SidebarContent collapsed={!sidebarOpen} />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="admin-sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={`admin-sidebar admin-sidebar--mobile ${mobileOpen ? 'admin-sidebar--mobile-open' : ''}`}>
        <button className="admin-sidebar__mobile-close" onClick={() => setMobileOpen(false)}>
          <X size={20} />
        </button>
        <SidebarContent collapsed={false} />
      </aside>

      <main className="admin-main">
        <div className="admin-main__topbar">
          {/* Hamburger — mobile only */}
          <button className="admin-hamburger" onClick={() => setMobileOpen(o => !o)} title="Menu">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div style={{ flex: 1 }} />
          <NotificationBell adminMode={true} />
        </div>
        <AdminErrorBoundary>
          <Outlet />
        </AdminErrorBoundary>
      </main>
    </div>
  );
}
