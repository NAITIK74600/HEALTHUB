import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { uploadPrescription, getMyPrescriptions, deletePrescription } from '../api/prescriptions';
import toast from 'react-hot-toast';
import { Upload, Trash2, Eye, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

function statusBadge(status) {
  const map = {
    pending:  { label: 'Under Review', cls: 'rx-badge rx-badge--pending',  icon: <Clock size={12} /> },
    approved: { label: 'Approved',     cls: 'rx-badge rx-badge--approved', icon: <CheckCircle size={12} /> },
    rejected: { label: 'Rejected',     cls: 'rx-badge rx-badge--rejected', icon: <XCircle size={12} /> },
  };
  return map[status] || map.pending;
}

function fmt(d) {
  try {
    if (!d) return '';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '';
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]   = useState(null); // {url, isPdf}
  const [form, setForm]         = useState({ notes: '', doctorName: '', patientName: '' });
  const [file, setFile]         = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [lastUploadedId, setLastUploadedId] = useState(null);
  const fileRef = useRef(null);

  const load = () => {
    setLoading(true);
    getMyPrescriptions()
      .then(r => {
        const data = r.data;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.prescriptions)
            ? data.prescriptions
            : [];
        setPrescriptions(list.filter(Boolean));
      })
      .catch(() => toast.error('Failed to load prescriptions.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleFile = (f) => {
    if (!f) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(f.type)) { toast.error('Only JPG, PNG, WebP, or PDF allowed.'); return; }
    if (f.size > 5 * 1024 * 1024) { toast.error('File must be under 5 MB.'); return; }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Please select a file first.'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('notes',       form.notes);
      fd.append('doctorName',  form.doctorName);
      fd.append('patientName', form.patientName);
      const res = await uploadPrescription(fd);
      toast.success('Prescription uploaded! Under review.');
      setFile(null);
      setForm({ notes: '', doctorName: '', patientName: '' });
      setLastUploadedId(res?.data?._id || null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this prescription?')) return;
    try {
      await deletePrescription(id);
      toast.success('Deleted.');
      setPrescriptions(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <main className="rx-page container">
      <div className="rx-page__header">
        <h1>My Prescriptions</h1>
        <p className="rx-page__sub">Upload prescriptions required for scheduled medicines. Our pharmacist will review within a few hours.</p>
      </div>

      {/* Upload Form */}
      <section className="rx-upload-card">
        <h2><Upload size={18} /> Upload New Prescription</h2>
        <form onSubmit={handleUpload} className="rx-upload-form">
          {/* Drop zone */}
          <div
            className={`rx-dropzone${dragOver ? ' rx-dropzone--over' : ''}${file ? ' rx-dropzone--has-file' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])} />
            {file ? (
              <div className="rx-dropzone__file">
                <FileText size={36} />
                <span>{file.name}</span>
                <span className="rx-dropzone__size">{(file.size / 1024).toFixed(0)} KB</span>
              </div>
            ) : (
              <div className="rx-dropzone__prompt">
                <Upload size={36} />
                <span>Drag &amp; drop or <strong>click to browse</strong></span>
                <small>JPG, PNG, WebP or PDF · Max 5 MB</small>
              </div>
            )}
          </div>

          <div className="rx-upload-fields">
            <div className="form-group">
              <label>Patient Name <small>(if different from account)</small></label>
              <input value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))}
                placeholder="Full name on prescription" maxLength={100} />
            </div>
            <div className="form-group">
              <label>Doctor / Hospital Name</label>
              <input value={form.doctorName} onChange={e => setForm(f => ({ ...f, doctorName: e.target.value }))}
                placeholder="Dr. name or clinic name" maxLength={100} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>Additional Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any special instructions or notes for the pharmacist..." rows={2} maxLength={500} />
            </div>
          </div>

          <button type="submit" className="btn btn--primary" disabled={uploading || !file}>
            {uploading ? 'Uploading…' : 'Upload Prescription'}
          </button>

          {lastUploadedId && !uploading && (
            <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link to="/" className="btn btn--outline">Continue Shopping</Link>
            </div>
          )}
        </form>
      </section>

      {/* List */}
      <section className="rx-list">
        <h2>Uploaded Prescriptions</h2>
        {loading ? (
          <div className="spinner" style={{ padding: 40, textAlign: 'center' }}>Loading…</div>
        ) : prescriptions.length === 0 ? (
          <div className="rx-empty">
            <FileText size={48} />
            <p>No prescriptions uploaded yet.</p>
          </div>
        ) : (
          <div className="rx-grid">
            {prescriptions.map(rx => {
              const badge = statusBadge(rx.status);
              const isPdf = rx.imageUrl?.toLowerCase().includes('.pdf') || rx.imageUrl?.includes('/raw/');
              return (
                <div key={rx._id} className="rx-card">
                  <div className="rx-card__thumb" onClick={() => setPreview({ url: rx.imageUrl, isPdf })}>
                    {isPdf ? (
                      <div className="rx-card__pdf-icon"><FileText size={40} /></div>
                    ) : (
                      <img src={rx.imageUrl} alt="Prescription" />
                    )}
                    <div className="rx-card__overlay"><Eye size={20} /> View</div>
                  </div>
                  <div className="rx-card__body">
                    <span className={badge.cls}>{badge.icon} {badge.label}</span>
                    {rx.patientName && <p><strong>Patient:</strong> {rx.patientName}</p>}
                    {rx.doctorName && <p><strong>Doctor:</strong> {rx.doctorName}</p>}
                    {rx.adminNote && (
                      <p className="rx-card__admin-note"><strong>Pharmacist note:</strong> {rx.adminNote}</p>
                    )}
                    <p className="rx-card__date">Uploaded: {fmt(rx.createdAt)}</p>
                    {rx.usedInOrders?.length > 0 && (
                      <p className="rx-card__used">Used in {rx.usedInOrders.length} order(s)</p>
                    )}
                  </div>
                  <div className="rx-card__actions">
                    <button className="btn btn--outline btn--sm"
                      onClick={() => setPreview({ url: rx.imageUrl, isPdf })}>
                      <Eye size={14} /> View
                    </button>
                    {rx.status === 'pending' && (!rx.usedInOrders || rx.usedInOrders.length === 0) && (
                      <button className="btn btn--danger btn--sm" onClick={() => handleDelete(rx._id)}>
                        <Trash2 size={14} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Preview Modal */}
      {preview && (
        <div className="rx-modal" onClick={() => setPreview(null)}>
          <div className="rx-modal__box" onClick={e => e.stopPropagation()}>
            <button className="rx-modal__close" onClick={() => setPreview(null)}>✕</button>
            {preview.isPdf ? (
              <iframe src={preview.url} title="Prescription PDF" style={{ width: '100%', height: '80vh', border: 'none' }} />
            ) : (
              <img src={preview.url} alt="Prescription" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
