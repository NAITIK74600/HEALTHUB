import { useEffect, useState } from 'react';
import { getAllPrescriptions, updatePrescriptionStatus } from '../../api/prescriptions';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, Eye, Filter, X } from 'lucide-react';

function fmt(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_OPTS = ['', 'pending', 'approved', 'rejected'];

export default function AdminPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage]  = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [preview, setPreview] = useState(null);       // prescription to preview
  const [reviewing, setReviewing] = useState(null);   // prescription being reviewed
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await getAllPrescriptions(params);
      setPrescriptions(data.prescriptions || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch {
      toast.error('Failed to load prescriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter, page]);

  const startReview = (rx) => { setReviewing(rx); setAdminNote(''); };

  const submitReview = async (status) => {
    if (!reviewing) return;
    setSaving(true);
    try {
      await updatePrescriptionStatus(reviewing._id, { status, adminNote });
      toast.success(`Prescription ${status}.`);
      setReviewing(null);
      load();
    } catch {
      toast.error('Failed to update.');
    } finally {
      setSaving(false);
    }
  };

  const BADGE = {
    pending:  <span className="admin-rx-badge admin-rx-badge--pending"><Clock size={12}/> Pending</span>,
    approved: <span className="admin-rx-badge admin-rx-badge--approved"><CheckCircle size={12}/> Approved</span>,
    rejected: <span className="admin-rx-badge admin-rx-badge--rejected"><XCircle size={12}/> Rejected</span>,
  };

  return (
    <section className="admin-rx">
      <div className="admin-section-header">
        <h2>Prescriptions</h2>
        <span className="admin-count">{total} total</span>
      </div>

      {/* Filter bar */}
      <div className="admin-rx__filters">
        <Filter size={15} />
        {STATUS_OPTS.map(s => (
          <button key={s || 'all'} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`btn btn--sm ${statusFilter === s ? 'btn--primary' : 'btn--outline'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="spinner" style={{ padding: 60, textAlign: 'center' }}>Loading…</div>
      ) : prescriptions.length === 0 ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--clr-muted)' }}>
          No {statusFilter || ''} prescriptions found.
        </div>
      ) : (
        <div className="admin-rx__grid">
          {prescriptions.map(rx => {
            const isPdf = rx.imageUrl?.toLowerCase().includes('.pdf') || rx.imageUrl?.includes('/raw/');
            return (
              <div key={rx._id} className="admin-rx-card">
                <div className="admin-rx-card__thumb" onClick={() => setPreview(rx)}>
                  {isPdf ? (
                    <div className="admin-rx-card__pdf">PDF</div>
                  ) : (
                    <img src={rx.imageUrl} alt="Rx" />
                  )}
                  <div className="admin-rx-card__overlay"><Eye size={16} /> View</div>
                </div>
                <div className="admin-rx-card__body">
                  {BADGE[rx.status]}
                  <p className="admin-rx-card__user">{rx.user?.name || 'Unknown'}<br/>
                    <small>{rx.user?.email}</small></p>
                  {rx.patientName && <p><strong>Patient:</strong> {rx.patientName}</p>}
                  {rx.doctorName  && <p><strong>Doctor:</strong> {rx.doctorName}</p>}
                  {rx.notes && <p className="admin-rx-card__notes">{rx.notes}</p>}
                  {rx.adminNote && <p className="admin-rx-card__admin-note"><strong>Note:</strong> {rx.adminNote}</p>}
                  <p className="admin-rx-card__date">{fmt(rx.createdAt)}</p>
                </div>
                {rx.status === 'pending' && (
                  <button className="btn btn--primary btn--sm admin-rx-card__review-btn" onClick={() => startReview(rx)}>
                    Review
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="admin-pagination">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn btn--outline btn--sm">← Prev</button>
          <span>{page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="btn btn--outline btn--sm">Next →</button>
        </div>
      )}

      {/* Review Modal */}
      {reviewing && (
        <div className="modal-overlay" onClick={() => setReviewing(null)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal__head">
              <h3>Review Prescription</h3>
              <button className="icon-btn" onClick={() => setReviewing(null)}><X size={18} /></button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <p><strong>From:</strong> {reviewing.user?.name} ({reviewing.user?.email})</p>
              {reviewing.patientName && <p><strong>Patient:</strong> {reviewing.patientName}</p>}
              {reviewing.doctorName  && <p><strong>Doctor:</strong> {reviewing.doctorName}</p>}
              {reviewing.notes && <p><strong>Customer notes:</strong> {reviewing.notes}</p>}
            </div>
            <div className="form-group">
              <label>Pharmacist Note (shown to customer)</label>
              <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
                placeholder="Reason for rejection, or instructions…" rows={3} maxLength={500} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn--primary" style={{ flex: 1 }} disabled={saving} onClick={() => submitReview('approved')}>
                <CheckCircle size={15} /> Approve
              </button>
              <button className="btn btn--danger" style={{ flex: 1 }} disabled={saving} onClick={() => submitReview('rejected')}>
                <XCircle size={15} /> Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full image preview */}
      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <button className="rx-modal__close" style={{ position: 'fixed', top: 16, right: 16 }} onClick={() => setPreview(null)}>✕</button>
            {(preview.imageUrl?.includes('.pdf') || preview.imageUrl?.includes('/raw/')) ? (
              <iframe src={preview.imageUrl} title="Prescription" style={{ width: '80vw', height: '85vh', border: 'none' }} />
            ) : (
              <img src={preview.imageUrl} alt="Prescription" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 12 }} />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
