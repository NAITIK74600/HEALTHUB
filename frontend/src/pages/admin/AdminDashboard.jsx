import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Users, TrendingUp, Package, AlertTriangle, Clock, XCircle, CalendarDays, RefreshCw, Tag } from 'lucide-react';
import { getDashboardStats, triggerCsvSync, getCsvSyncStatus } from '../../api/admin';
import { getOfferStats } from '../../api/offers';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="dash-card" style={{ '--card-color': color }}>
      <div className="dash-card__icon"><Icon size={22} /></div>
      <div className="dash-card__body">
        <p className="dash-card__label">{label}</p>
        <p className="dash-card__value">{value}</p>
        {sub && <p className="dash-card__sub">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { isSuperAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncState, setSyncState] = useState(null);
  const [offerStats, setOfferStats] = useState(null);
  const pollRef = useRef(null);

  const pollStatus = () => {
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await getCsvSyncStatus();
        setSyncState(data);
        if (!data.running) {
          clearInterval(pollRef.current);
          if (data.error) toast.error('Sync failed: ' + data.error);
          else toast.success(`Sync done! Updated ${data.updated} products.`);
        }
      } catch { clearInterval(pollRef.current); }
    }, 2000);
  };

  const handleSync = async () => {
    try {
      const { data } = await triggerCsvSync();
      setSyncState(data.status);
      toast.success('Category sync started…');
      pollStatus();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to start sync.');
    }
  };

  useEffect(() => {
    getCsvSyncStatus().then(r => setSyncState(r.data)).catch(() => {});
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    getDashboardStats()
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    getOfferStats().then(r => setOfferStats(r.data)).catch(() => {});
  }, []);

  const fmt = (n) => {
    if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
    if (n >= 1000)   return '₹' + (n / 1000).toFixed(1) + 'K';
    return '₹' + (n || 0).toLocaleString('en-IN');
  };

  if (loading) return <div className="spinner" style={{ textAlign: 'center', padding: '60px 0' }}>Loading stats…</div>;

  return (
    <div className="admin-dashboard">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        <h1 className="admin-page__title" style={{ margin: 0 }}>Dashboard</h1>
        {isSuperAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {syncState?.running && (
              <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                ⏳ Syncing… matched {syncState.matched} | updated {syncState.updated}
              </span>
            )}
            {syncState?.done && !syncState.running && (
              <span style={{ fontSize: '0.8rem', color: syncState.error ? '#C0392B' : 'var(--green-dark)' }}>
                {syncState.error ? '❌ ' + syncState.error : `✅ Last sync: updated ${syncState.updated} products`}
              </span>
            )}
            <button
              className="btn btn--outline"
              style={{ fontSize: '0.8rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={handleSync}
              disabled={syncState?.running}
            >
              <RefreshCw size={14} className={syncState?.running ? 'spin' : ''} />
              {syncState?.running ? 'Syncing…' : 'Sync Products from CSV/Excel'}
            </button>
          </div>
        )}
      </div>

      <div className="dash-grid">
        <StatCard icon={ShoppingBag}  label="Total Orders"   value={stats?.totalOrders ?? 0}      color="var(--primary)" />
        <StatCard icon={CalendarDays}  label="Today Orders"   value={stats?.todayOrders ?? 0}      color="#2980b9" />
        <StatCard icon={Clock}         label="Pending"         value={stats?.pendingOrders ?? 0}    color="#e67e22" />
        <StatCard icon={TrendingUp}    label="Total Revenue"  value={fmt(stats?.totalRevenue)}     color="var(--green)" />
        <StatCard icon={TrendingUp}    label="Today Revenue"  value={fmt(stats?.todayRevenue)}     color="#27ae60" />
        <StatCard icon={Users}         label="Customers"       value={stats?.totalCustomers ?? 0}   color="#8e44ad" />
        <Link to="/admin/products?stock=low" style={{ textDecoration: 'none' }}>
          <StatCard icon={AlertTriangle} label="Low Stock"  value={stats?.lowStock?.length ?? 0} color="#f39c12" sub="Click to manage" />
        </Link>
        <Link to="/admin/products?stock=out" style={{ textDecoration: 'none' }}>
          <StatCard icon={XCircle} label="Out of Stock" value={stats?.outOfStock ?? 0} color="#c0392b" sub="Click to bulk update" />
        </Link>
        <Link to="/admin/offers" style={{ textDecoration: 'none' }}>
          <StatCard icon={Tag} label="Active Offers" value={offerStats?.active ?? 0} color="#D97706" sub={`${offerStats?.totalClicks ?? 0} clicks`} />
        </Link>
      </div>

      {stats?.lowStock?.length > 0 && (
        <section className="admin-dashboard__low-stock">
          <div className="admin-section-header">
            <h2><AlertTriangle size={18} style={{ color: '#f39c12' }} /> Low Stock Alert</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/admin/products?stock=out" className="btn btn--outline btn--sm">Manage Out of Stock</Link>
              <Link to="/admin/products?stock=low" className="btn btn--outline btn--sm">Manage Low Stock</Link>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStock.map(p => (
                  <tr key={p._id}>
                    <td>{p.name}</td>
                    <td>{p.category?.name || '—'}</td>
                    <td>₹{p.price}</td>
                    <td>
                      <span className={`badge ${p.stock === 0 ? 'badge--danger' : 'badge--warning'}`}>
                        {p.stock === 0 ? 'Out of Stock' : `${p.stock} left`}
                      </span>
                    </td>
                    <td>
                      <Link to={`/admin/products?edit=${p._id}`} className="btn btn--outline btn--sm">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
