import { useEffect, useState } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/categories';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, FolderOpen, GripVertical } from 'lucide-react';

const EMPTY = { name: '', icon: '', order: 0 };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [modal, setModal]           = useState(null); // null | 'add' | 'edit'
  const [form, setForm]             = useState(EMPTY);
  const [editId, setEditId]         = useState(null);
  const [saving, setSaving]         = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await getCategories();
      setCategories(r.data.categories || []);
    } catch { toast.error('Failed to load categories.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setEditId(null); setModal('add'); };
  const openEdit = (c) => {
    setForm({ name: c.name, icon: c.icon || '', order: c.order || 0 });
    setEditId(c._id);
    setModal('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Category name is required.');
    setSaving(true);
    try {
      if (modal === 'add') {
        await createCategory({ name: form.name.trim(), icon: form.icon, order: Number(form.order || 0) });
        toast.success('Category added!');
      } else {
        await updateCategory(editId, { name: form.name.trim(), icon: form.icon, order: Number(form.order || 0) });
        toast.success('Category updated!');
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save category.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"? Products in this category will become uncategorized.`)) return;
    try {
      await deleteCategory(id);
      toast.success('Category deleted.');
      load();
    } catch { toast.error('Failed to delete category.'); }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1><FolderOpen size={22} /> Categories</h1>
        <button className="btn btn--primary" onClick={openAdd}><Plus size={16} /> Add Category</button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading…</p>
      ) : categories.length === 0 ? (
        <p style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>No categories yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th>Name</th>
                <th>Slug</th>
                <th style={{ width: 80 }}>Order</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c, i) => (
                <tr key={c._id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td style={{ color: '#6b7280', fontSize: '0.82rem' }}>{c.slug}</td>
                  <td>{c.order}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn--sm btn--outline" title="Edit" onClick={() => openEdit(c)}><Pencil size={14} /></button>
                      <button className="btn btn--sm btn--outline" title="Delete" style={{ color: '#dc2626' }} onClick={() => handleDelete(c._id, c.name)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-card__header">
              <h2>{modal === 'add' ? 'Add Category' : 'Edit Category'}</h2>
              <button className="modal-card__close" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px 0' }}>
                <div>
                  <label className="form-label">Category Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Skin Care" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Icon (emoji or code)</label>
                    <input className="form-input" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="💊" />
                  </div>
                  <div>
                    <label className="form-label">Sort Order</label>
                    <input className="form-input" type="number" min={0} value={form.order} onChange={e => setForm(f => ({ ...f, order: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8 }}>
                <button type="button" className="btn btn--outline" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? 'Saving…' : modal === 'add' ? 'Add Category' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
