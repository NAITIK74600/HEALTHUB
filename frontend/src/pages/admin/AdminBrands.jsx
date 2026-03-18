import { useEffect, useState } from 'react';
import { getAdminBrands, createBrand, updateBrand, deleteBrand } from '../../api/brands';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Star, Leaf, Tag } from 'lucide-react';

const EMPTY = { name: '', category: 'featured', ord: 0, logoUrl: '', isActive: true };

const CAT_LABEL = { featured: 'Featured', ayurvedic: 'Ayurvedic', general: 'General' };
const CAT_COLOR = {
  featured:  { bg: '#FEF2F2', color: '#C0392B' },
  ayurvedic: { bg: '#F0FBF4', color: '#1B8843' },
  general:   { bg: '#EFF6FF', color: '#2563EB' },
};

export default function AdminBrands() {
  const [brands, setBrands]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [modal, setModal]       = useState(null); // null | 'add' | 'edit'
  const [form, setForm]         = useState(EMPTY);
  const [logoFile, setLogoFile] = useState(null);
  const [preview, setPreview]   = useState(null);
  const [saving, setSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await getAdminBrands();
      setBrands(r.data.brands || []);
    } catch { toast.error('Failed to load brands.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setForm(EMPTY); setLogoFile(null); setPreview(null); setModal('add');
  };

  const openEdit = (b) => {
    setForm({ name: b.name, category: b.category, ord: b.ord, logoUrl: b.logoUrl || '', isActive: b.isActive, _id: b._id });
    setLogoFile(null);
    setPreview(b.logoUrl || null);
    setModal('edit');
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Brand name is required.');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('category', form.category);
      fd.append('ord', String(form.ord || 0));
      fd.append('isActive', String(form.isActive));
      if (logoFile) fd.append('logo', logoFile);
      else if (form.logoUrl) fd.append('logoUrl', form.logoUrl);

      if (modal === 'add') {
        await createBrand(fd);
        toast.success('Brand added!');
      } else {
        if (!logoFile && !form.logoUrl) fd.append('removeLogo', 'false');
        await updateBrand(form._id, fd);
        toast.success('Brand updated!');
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data?.errors?.[0]?.msg || 'Could not save brand.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete brand "${name}"?`)) return;
    setDeletingId(id);
    try {
      await deleteBrand(id);
      toast.success('Brand deleted.');
      setBrands(prev => prev.filter(b => b._id !== id));
    } catch { toast.error('Could not delete brand.'); }
    finally { setDeletingId(null); }
  };

  const grouped = {
    featured:  brands.filter(b => b.category === 'featured'),
    ayurvedic: brands.filter(b => b.category === 'ayurvedic'),
    general:   brands.filter(b => b.category === 'general'),
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>Brands</h1>
        <button className="btn btn--primary" onClick={openAdd}>
          <Plus size={16} /> Add Brand
        </button>
      </div>

      {loading ? (
        <div className="spinner" style={{ padding: '60px 0', textAlign: 'center' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {[['featured', <Star size={16} />, 'Featured Brands (shown on homepage)'],
            ['ayurvedic', <Leaf size={16} />, 'Ayurvedic Brands'],
            ['general', <Tag size={16} />, 'General Brands']].map(([cat, icon, label]) => (
            <div key={cat} className="admin-section-box">
              <div className="admin-section-box__header">
                {icon} {label}
                <span className="badge" style={{ marginLeft: 8, background: CAT_COLOR[cat].bg, color: CAT_COLOR[cat].color }}>
                  {grouped[cat].length}
                </span>
              </div>
              <div className="brands-admin-grid">
                {grouped[cat].length === 0 && (
                  <p style={{ color: 'var(--gray-400)', padding: '16px 0' }}>No brands yet. Click "Add Brand" to create one.</p>
                )}
                {grouped[cat].map(b => (
                  <div key={b._id} className={`brand-admin-card ${!b.isActive ? 'brand-admin-card--inactive' : ''}`}>
                    <div className="brand-admin-card__logo">
                      {b.logoUrl
                        ? <img src={b.logoUrl} alt={b.name} />
                        : <span style={{ fontSize: 28, color: 'var(--gray-300)' }}>🏷</span>
                      }
                    </div>
                    <div className="brand-admin-card__name">{b.name}</div>
                    <div className="brand-admin-card__meta">
                      <span style={{ background: CAT_COLOR[b.category].bg, color: CAT_COLOR[b.category].color, borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>
                        {CAT_LABEL[b.category]}
                      </span>
                      {!b.isActive && <span style={{ fontSize: 11, color: '#999' }}>Hidden</span>}
                      <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>ord: {b.ord}</span>
                    </div>
                    <div className="brand-admin-card__actions">
                      <button className="icon-btn" onClick={() => openEdit(b)} title="Edit"><Pencil size={14} /></button>
                      <button className="icon-btn icon-btn--danger" onClick={() => handleDelete(b._id, b.name)} disabled={deletingId === b._id} title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{modal === 'add' ? 'Add Brand' : 'Edit Brand'}</h3>
              <button className="modal__close" onClick={() => setModal(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Logo upload */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 120, height: 80, margin: '0 auto 10px', border: '1.5px dashed var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#fafafa' }}>
                  {preview
                    ? <img src={preview} alt="logo preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    : <span style={{ color: 'var(--gray-300)', fontSize: 32 }}>🏷</span>
                  }
                </div>
                <label className="btn btn--outline" style={{ cursor: 'pointer', fontSize: 13 }}>
                  Upload Logo
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
                </label>
                {preview && (
                  <button type="button" className="btn btn--ghost" style={{ fontSize: 12, marginLeft: 8 }} onClick={() => { setLogoFile(null); setPreview(null); setForm(f => ({ ...f, logoUrl: '' })); }}>
                    Remove
                  </button>
                )}
              </div>

              <div>
                <label className="form-label">Or paste logo URL</label>
                <input className="form-input" type="url" placeholder="https://..." value={form.logoUrl}
                  onChange={e => { setForm(f => ({ ...f, logoUrl: e.target.value })); if (e.target.value) { setPreview(e.target.value); setLogoFile(null); } }} />
              </div>

              <div>
                <label className="form-label">Brand Name *</label>
                <input className="form-input" type="text" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} maxLength={150} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Category *</label>
                  <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="featured">Featured</option>
                    <option value="ayurvedic">Ayurvedic</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Order (lower = first)</label>
                  <input className="form-input" type="number" min={0} value={form.ord}
                    onChange={e => setForm(f => ({ ...f, ord: e.target.value }))} />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                Visible on website
              </label>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn--ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Saving…' : modal === 'add' ? 'Add Brand' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
