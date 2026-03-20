import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, Users, TrendingUp, Package, AlertTriangle, Clock, XCircle,
  CalendarDays, RefreshCw, Tag, CheckCircle, Database, Zap,
} from 'lucide-react';
import { getDashboardStats, triggerCsvSync, getCsvSyncStatus } from '../../api/admin';
import { getOfferStats } from '../../api/offers';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

function StatCard({ icon: Icon, label, value, color, sub, to }) {
  const card = (
    <div className="dash-card" style={{ '--card-color': color }}>
      <div className="dash-card__icon"><Icon size={20} /></div>
      <div className="dash-card__body">
        <p className="dash-card__label">{label}</p>
        <p className="dash-card__value">{value}</p>
        {sub && <p className="dash-card__sub">{sub}</p>}
      </div>
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration: 'none', display: 'block' }}>{card}</Link> : card;
}

function SyncCard({ syncState, onSync }) {
  const pct = syncState?.total > 0
    ? Math.round((syncState.processed / syncState.total) * 100)
    : null;

  return (
    <div className="dash-sync-card">
      <div className="dash-sync-card__header">
        <div className="dash-sync-card__icon">
          <Database size={18} />
        </div>
        <div>
          <p className="dash-sync-card__title">Product Sync</p>
          <p className="dash-sync-card__subtitle">Sync from CSV / Excel data file</p>
        </div>
        <button
          className={`btn btn--primary btn--sm dash-sync-card__btn ${syncState?.running ? 'btn--loading' : ''}`}
          onClick={onSync}
          disabled={syncState?.running}
          style={{ marginLeft: 'auto' }}
        >
          <RefreshCw size={13} className={syncState?.running ? 'spin' : ''} />
          {syncState?.running ? 'Syncing…' : 'Sync Now'}
        </button>
      </div>

      {syncState?.running && (
        <div className="dash-sync-card__progress">
          <div className="dash-sync-progress__bar">
            <div
              className="dash-sync-progress__fill"
              style={{ width: pct !== null ? `${pct}%` : '30%', animation: pct === null ? 'dash-progress-pulse 1.4s ease infinite' : 'none' }}
            />
          </div>
          <p className="dash-sync-progress__text">
            {pct !== null ? `${pct}% — ` : ''}
            matched {syncState.matched ?? 0} · updated {syncState.updated ?? 0} · added {syncState.added ?? 0}
          </p>
        </div>
      )}

      {syncState?.done && !syncState.running && (
        <div className={`dash-sync-card__result ${syncState.error ? 'dash-sync-card__result--error' : 'dash-sync-card__result--ok'}`}>
          {syncState.error
            ? <>❌ <strong>Error:</strong> {syncState.error}</>
            : <><CheckCircle size={14} /> Updated {syncState.updated ?? 0} · Added {syncState.added ?? 0} · Skipped {syncState.skipped ?? 0} &mdash; done in {syncState.finishedAt ? new Date(syncState.finishedAt).toLocaleTimeString() : ''}</>
          }
        </div>
      )}
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function AdminDashboard() {
  const { user, isSuperAdmin } = useAuth();
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
          else toast.success(`Sync complete! Updated ${data.updated}, added ${data.added}.`);
        }
      } catch { clearInterval(pollRef.current); }
    }, 2000);
  };

  const handleSync = async () => {
    try {
      const { data } = await triggerCsvSync();
      setSyncState(data.status);
      toast.success('Product sync started…');
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

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) return <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>Loading dashboard…</div>;

  return (
    <div className="admin-dashboard">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="dash-header">
        <div>
          <h1 className="dash-header__greeting">{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="dash-header__date">{today}</p>
        </div>
        {isSuperAdmin && (
          <div className="dash-header__actions">
            <Link to="/admin/products" className="btn btn--outline btn--sm">
              <Package size={14} /> Manage Products
            </Link>
            <Link to="/admin/orders" className="btn btn--outline btn--sm">
              <ShoppingBag size={14} /> View Orders
            </Link>
          </div>
        )}
      </div>

      {/* ── Orders & Revenue ────────────────────────────────────────── */}
      <p className="dash-section-label">Orders &amp; Revenue</p>
      <div className="dash-grid">
        <StatCard icon={ShoppingBag}  label="Total Orders"  value={stats?.totalOrders ?? 0}   color="var(--primary)" />
        <StatCard icon={CalendarDays} label="Today Orders"  value={stats?.todayOrders ?? 0}   color="#2980b9" />
        <StatCard icon={Clock}        label="Pending"        value={stats?.pendingOrders ?? 0} color="#e67e22" />
        <StatCard icon={TrendingUp}   label="Total Revenue" value={fmt(stats?.totalRevenue)}  color="var(--green)" />
        <StatCard icon={TrendingUp}   label="Today Revenue" value={fmt(stats?.todayRevenue)}  color="#27ae60" />
        <StatCard icon={Users}        label="Customers"      value={stats?.totalCustomers ?? 0} color="#8e44ad" />
      </div>

      {/* ── Inventory ───────────────────────────────────────────────── */}
      <p className="dash-section-label" style={{ marginTop: 24 }}>Inventory</p>
      <div className="dash-grid dash-grid--sm">
        <StatCard icon={AlertTriangle} label="Low Stock"    value={stats?.lowStock?.length ?? 0} color="#f39c12"
          sub="Click to manage" to="/admin/products?stock=low" />
        <StatCard icon={XCircle}       label="Out of Stock" value={stats?.outOfStock ?? 0}       color="#c0392b"
          sub="Click to bulk update" to="/admin/products?stock=out" />
        <StatCard icon={Tag}           label="Active Offers" value={offerStats?.active ?? 0}     color="#D97706"
          sub={`${offerStats?.totalClicks ?? 0} total clicks`} to="/admin/offers" />
      </div>

      {/* ── Product Sync (superAdmin only) ──────────────────────────── */}
      {isSuperAdmin && (
        <>
          <p className="dash-section-label" style={{ marginTop: 24 }}>Data Management</p>
          <SyncCard syncState={syncState} onSync={handleSync} />
        </>
      )}

      {/* ── Low Stock Alert table ───────────────────────────────────── */}
      {stats?.lowStock?.length > 0 && (
        <section className="admin-dashboard__low-stock" style={{ marginTop: 24 }}>
          <div className="admin-section-header">
            <h2><AlertTriangle size={17} style={{ color: '#f39c12' }} /> Low Stock Alert</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/admin/products?stock=out" className="btn btn--outline btn--sm">Out of Stock</Link>
              <Link to="/admin/products?stock=low" className="btn btn--outline btn--sm">Low Stock</Link>
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
                      <Link to={`/admin/products?edit=${p._id}`} className="btn btn--outline btn--sm">Edit</Link>
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
