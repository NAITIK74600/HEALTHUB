import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getAdminProducts, quickUpdateProduct, createProduct, updateProduct, updateProductImages,
  deleteProduct, bulkImportProducts, downloadImportTemplate, bulkUpdateProducts, bulkDiscountProducts,
  aiFillProduct, aiFillBulk, getMissingInfoCount, exportProductsExcel,
} from '../../api/products';
import { getCategories } from '../../api/categories';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, Upload, ToggleLeft, ToggleRight, Camera, X, Link,
  FileSpreadsheet, CheckCircle, AlertTriangle, Search, Package, Percent, Zap, Sparkles,
} from 'lucide-react';

const EMPTY = { name: '', category: '', brand: '', salt: '', description: '', mrp: '', price: '', stock: '', requiresPrescription: false };

const STOCK_OPTS = [
  { value: 'all', label: 'All Stock' },
  { value: 'in',  label: 'In Stock (>10)' },
  { value: 'low', label: 'Low Stock (1-10)' },
  { value: 'out', label: 'Out of Stock' },
];
const STATUS_OPTS = [
  { value: 'all',      label: 'All Status' },
  { value: 'active',   label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];
const SORT_OPTS = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'name_asc',   label: 'Name A-Z' },
  { value: 'name_desc',  label: 'Name Z-A' },
  { value: 'stock_asc',  label: 'Stock Low-High' },
  { value: 'stock_desc', label: 'Stock High-Low' },
  { value: 'price_asc',  label: 'Price Low-High' },
  { value: 'price_desc', label: 'Price High-Low' },
];

function StockBadge({ stock }) {
  if (stock === 0)  return <span className="stock-badge stock-badge--out">Out</span>;
  if (stock <= 10)  return <span className="stock-badge stock-badge--low">Low</span>;
  return                   <span className="stock-badge stock-badge--in">OK</span>;
}

export default function AdminProducts() {
  /* ── Products & Categories ── */
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [page,  setPage]  = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  /* ── Filters ── */
  const [searchInput,  setSearchInput]  = useState('');
  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState('');
  const [brandFilter,  setBrandFilter]  = useState('');
  const [stockFilter,  setStockFilter]  = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy,       setSortBy]       = useState('newest');
  const searchTimer = useRef(null);

  /* ── Form ── */
  const [form,           setForm]           = useState(EMPTY);
  const [editing,        setEditing]        = useState(null);
  const [images,         setImages]         = useState([]);
  const [imgPreviews,    setImgPreviews]    = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [removeImages,   setRemoveImages]   = useState([]);
  const [showForm,       setShowForm]       = useState(false);

  /* ── Import ── */
  const [importing,    setImporting]    = useState(false);
  const [importResult, setImportResult] = useState(null);
  const csvInputRef = useRef(null);

  /* ── Inline image upload ── */
  const inlineUploadRef = useRef(null);
  const [uploadingFor,  setUploadingFor] = useState(null);

  /* ── Image URL modal ── */
  const [urlModal, setUrlModal] = useState({ open: false, productId: null, url: '' });

  /* ── Quick stock ── */
  const [stockEdit, setStockEdit] = useState({});

  /* ── Bulk select ── */
  const [selectedIds,       setSelectedIds]       = useState(new Set());
  const [selectAllMatching, setSelectAllMatching] = useState(false);

  /* ── Bulk stock modal ── */
  const [bulkModal, setBulkModal] = useState({ open: false, value: '', mode: 'set' });

  /* ── Quick Restock modal ── */
  const [restockModal, setRestockModal] = useState({ open: false, type: 'out', qty: '' });

  /* ── Bulk discount modal ── */
  const [discountModal, setDiscountModal] = useState({ open: false, pct: '' });

  /* ── AI Fill state ── */
  const [aiFilling,      setAiFilling]      = useState(new Set());        // per-row loading
  const [aiModal,        setAiModal]        = useState({ open: false });   // bulk AI modal
  const [aiProgress,     setAiProgress]     = useState([]);                // bulk results
  const [aiRunning,      setAiRunning]      = useState(false);
  const [missingFilter,  setMissingFilter]  = useState(false);             // show only missing
  const [missingCount,   setMissingCount]   = useState(null);

  /* ── Refresh trigger ── */
  const [trigger, setTrigger] = useState(0);
  const refresh = () => setTrigger(t => t + 1);

  /* ── Fetch missing count on mount ── */
  useEffect(() => {
    getMissingInfoCount().then(r => setMissingCount(r.data.count)).catch(() => {});
  }, [trigger]);

  /* ── Fetch ── */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 20, search, category: catFilter || undefined, brand: brandFilter || undefined, stockFilter, status: statusFilter, sort: sortBy };
        if (missingFilter) params.missingInfo = '1';
        const [pRes, cRes] = await Promise.all([
          getAdminProducts(params),
          categories.length === 0 ? getCategories() : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setProducts(pRes.data.products || []);
        setPages(pRes.data.pages || 1);
        setTotal(pRes.data.total || 0);
        if (cRes) setCategories(cRes.data.categories || []);
        setSelectedIds(new Set());
      } catch { /* errors shown via toast in handlers */ }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, catFilter, brandFilter, stockFilter, statusFilter, sortBy, trigger, missingFilter]);

  /* ── Search debounce ── */
  const handleSearchInput = (val) => {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(val); setPage(1); setSelectAllMatching(false); }, 400);
  };
  const clearFilters = () => {
    setSearchInput(''); setSearch(''); setCatFilter(''); setBrandFilter('');
    setStockFilter('all'); setStatusFilter('all'); setSortBy('newest'); setPage(1);
    setSelectAllMatching(false); setSelectedIds(new Set());
  };
  const hasFilters = !!(search || catFilter || brandFilter || stockFilter !== 'all' || statusFilter !== 'all');

  /* -- Current filter params (for applyToAll bulk) -- */
  const currentFilterParams = { search, category: catFilter || undefined, stockFilter, status: statusFilter };

  /* ── Quick stock update ── */
  const handleQuickStock = async (id, val) => {
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 0) return;
    try {
      await quickUpdateProduct(id, { stock: n });
      setProducts(prev => prev.map(p => p._id === id ? { ...p, stock: n } : p));
      toast.success('Stock updated.');
    } catch { toast.error('Failed to update stock.'); }
  };

  /* ── Toggle active ── */
  const handleToggleActive = async (product) => {
    try {
      const { data } = await quickUpdateProduct(product._id, { isActive: !product.isActive });
      setProducts(prev => prev.map(p => p._id === product._id ? { ...p, isActive: data.isActive } : p));
      toast.success(data.isActive ? 'Product activated.' : 'Product deactivated.');
    } catch { toast.error('Failed to toggle status.'); }
  };

  /* ── Bulk select ── */
  const toggleSelect = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
      setSelectAllMatching(false);
    } else {
      setSelectedIds(new Set(products.map(p => p._id)));
    }
  };

  /* ── Bulk actions ── */
  /* -- bulkCount = how many items will be affected -- */
  const bulkCount = selectAllMatching ? total : selectedIds.size;
  /* -- bulkPayload = request body for bulk endpoints -- */
  const bulkPayload = (extra) =>
    selectAllMatching
      ? { applyToAll: true, filterParams: currentFilterParams, ...extra }
      : { ids: [...selectedIds], ...extra };

  const handleBulkActivate = async (active) => {
    if (!bulkCount) return;
    try {
      await bulkUpdateProducts(bulkPayload({ update: { isActive: active } }));
      if (!selectAllMatching)
        setProducts(prev => prev.map(p => selectedIds.has(p._id) ? { ...p, isActive: active } : p));
      else refresh();
      toast.success(`${bulkCount} products ${active ? 'activated' : 'deactivated'}.`);
      setSelectedIds(new Set()); setSelectAllMatching(false);
    } catch { toast.error('Bulk update failed.'); }
  };

  const handleBulkMarkOutOfStock = async () => {
    if (!bulkCount) return;
    if (!confirm(`Mark ${bulkCount} products as Out of Stock (stock = 0)?`)) return;
    try {
      await bulkUpdateProducts(bulkPayload({ update: { stock: 0 }, mode: 'set' }));
      if (!selectAllMatching)
        setProducts(prev => prev.map(p => selectedIds.has(p._id) ? { ...p, stock: 0 } : p));
      else refresh();
      toast.success(`${bulkCount} products marked out of stock.`);
      setSelectedIds(new Set()); setSelectAllMatching(false);
    } catch { toast.error('Failed.'); }
  };

  const handleBulkDelete = async () => {
    if (!bulkCount) return;
    if (!confirm(`Delete ${bulkCount} products? This cannot be undone.`)) return;
    try {
      await bulkUpdateProducts(bulkPayload({ update: { isDeleted: true } }));
      toast.success(`${bulkCount} products deleted.`);
      setSelectedIds(new Set()); setSelectAllMatching(false);
      refresh();
    } catch { toast.error('Bulk delete failed.'); }
  };

  /* -- Quick Restock (all out/low stock without manual selection) -- */
  const handleRestock = async () => {
    const qty = parseInt(restockModal.qty, 10);
    if (isNaN(qty) || qty <= 0) { toast.error('Enter a valid quantity (>0).'); return; }
    const label = restockModal.type === 'out' ? 'out-of-stock' : 'low-stock';
    if (!confirm(`Add ${qty} units to ALL ${label} products?`)) return;
    try {
      const { data } = await bulkUpdateProducts({
        applyToAll: true,
        filterParams: { stockFilter: restockModal.type },
        update: { stock: qty },
        mode: 'add',
      });
      toast.success(`Added ${qty} units to ${data.modified} ${label} products.`);
      setRestockModal({ open: false, type: 'out', qty: '' });
      refresh();
    } catch { toast.error('Restock failed.'); }
  };

  /* -- Bulk discount -- */
  const handleBulkDiscount = async () => {
    const pct = parseFloat(discountModal.pct);
    if (isNaN(pct) || pct < 0 || pct > 100) { toast.error('Enter discount % between 0 and 100.'); return; }
    try {
      const { data } = await bulkDiscountProducts(bulkPayload({ discountPct: pct }));
      toast.success(`${pct}% discount applied to ${data.modified} products.`);
      setDiscountModal({ open: false, pct: '' });
      setSelectedIds(new Set()); setSelectAllMatching(false);
      refresh();
    } catch { toast.error('Discount apply failed.'); }
  };

  const handleBulkStockSubmit = async () => {
    const val = parseInt(bulkModal.value, 10);
    if (isNaN(val) || val < 0) { toast.error('Enter a valid stock number (0 or more).'); return; }
    try {
      await bulkUpdateProducts(bulkPayload({ update: { stock: val }, mode: bulkModal.mode }));
      if (!selectAllMatching && bulkModal.mode === 'set') {
        setProducts(prev => prev.map(p => selectedIds.has(p._id) ? { ...p, stock: val } : p));
      } else {
        refresh();
      }
      const modeLabel = bulkModal.mode === 'set' ? `set to ${val}` : bulkModal.mode === 'add' ? `+${val}` : `-${val}`;
      toast.success(`Stock ${modeLabel} for ${bulkCount} products.`);
      setBulkModal({ open: false, value: '', mode: 'set' });
      setSelectedIds(new Set()); setSelectAllMatching(false);
    } catch { toast.error('Bulk stock update failed.'); }
  };

  /* ── Create / Edit form ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(img => fd.append('images', img));
      if (removeImages.length > 0) fd.append('removeImages', JSON.stringify(removeImages));
      if (editing) { await updateProduct(editing, fd); toast.success('Product updated.'); }
      else         { await createProduct(fd);          toast.success('Product created.'); }
      setForm(EMPTY); setImages([]); setImgPreviews([]); setExistingImages([]); setRemoveImages([]);
      setEditing(null); setShowForm(false);
      refresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed.'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try { await deleteProduct(id); toast.success('Product deleted.'); refresh(); }
    catch { toast.error('Delete failed.'); }
  };

  /* ── CSV / Excel import ── */
  const handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) { toast.error('Upload .xlsx, .xls, or .csv file.'); return; }
    const confirmReplace = confirm('This will REMOVE old products and import fresh data from this file. Continue?');
    if (!confirmReplace) return;
    setImporting(true);
    try {
      const { data } = await bulkImportProducts(file, 'replace');
      toast.success(`Import done (${data.mode}): ${data.inserted} added, ${data.skipped} skipped.`);
      setImportResult(data);
      refresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Import failed.'); }
    finally { setImporting(false); }
  };

  const handleExportExcel = async () => {
    try {
      const { data } = await exportProductsExcel();
      const url = URL.createObjectURL(new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not export products.');
    }
  };

  /* ── AI fill handlers ── */
  const handleAiFillOne = async (productId) => {
    setAiFilling(s => new Set(s).add(productId));
    try {
      const res = await aiFillProduct(productId);
      setProducts(prev => prev.map(p =>
        p._id === productId ? { ...p, salt: res.data.salt ?? p.salt, description: res.data.description ?? p.description } : p
      ));
      getMissingInfoCount().then(r => setMissingCount(r.data.count)).catch(() => {});
      toast.success('AI filled salt & description!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI fill failed.');
    } finally {
      setAiFilling(s => { const n = new Set(s); n.delete(productId); return n; });
    }
  };

  const handleAiFillSelected = () => {
    if (!selectedIds.size) return;
    setAiProgress([]);
    setAiModal({ open: true, ids: [...selectedIds] });
  };

  const handleAiFillMissing = () => {
    setAiProgress([]);
    setAiModal({ open: true, ids: null });
  };

  const runAiBulk = async (ids) => {
    if (!ids || ids.length === 0) return;
    setAiRunning(true);
    const BATCH = 20;
    const allResults = [];
    for (let i = 0; i < ids.length; i += BATCH) {
      const batch = ids.slice(i, i + BATCH);
      try {
        const res = await aiFillBulk(batch);
        allResults.push(...res.data.results);
        setAiProgress([...allResults]);
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Request failed';
        allResults.push(...batch.map(id => ({ _id: id, success: false, error: msg })));
        setAiProgress([...allResults]);
      }
    }
    setAiRunning(false);
    getMissingInfoCount().then(r => setMissingCount(r.data.count)).catch(() => {});
    refresh();
    toast.success(`AI filled ${allResults.filter(r => r.success).length} products!`);
  };

  const handleDownloadTemplate = async () => {
    try {
      const { data } = await downloadImportTemplate();
      const url = URL.createObjectURL(new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const a = document.createElement('a'); a.href = url; a.download = 'products-template.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Could not download template.'); }
  };

  /* ── Edit helpers ── */
  const startEdit = (p) => {
    setEditing(p._id);
    setForm({ name: p.name, category: p.category?._id || '', brand: p.brand || '', salt: p.salt || '', description: p.description || '', mrp: p.mrp, price: p.price, stock: p.stock, requiresPrescription: p.requiresPrescription });
    setImages([]); setImgPreviews([]); setExistingImages(p.images || []); setRemoveImages([]);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMarkRemove = (url) => {
    setRemoveImages(r => [...r, url]);
    setExistingImages(e => e.filter(u => u !== url));
  };

  const handleNewImages = (files) => {
    const arr = Array.from(files).slice(0, 5);
    setImages(arr);
    setImgPreviews(arr.map(f => URL.createObjectURL(f)));
  };

  const handleInlineUpload = async (e) => {
    const file = e.target.files[0]; e.target.value = '';
    if (!file || !uploadingFor) return;
    try {
      const fd = new FormData(); fd.append('images', file);
      const { data } = await updateProductImages(uploadingFor, fd);
      setProducts(prev => prev.map(p => p._id === uploadingFor ? { ...p, images: data.images || [] } : p));
      toast.success('Image uploaded!');
    } catch { toast.error('Image upload failed.'); }
    finally { setUploadingFor(null); }
  };

  const handleImageUrl = async () => {
    const { productId, url } = urlModal;
    if (!url.trim()) { toast.error('Enter a valid URL.'); return; }
    if (!/^https?:\/\//i.test(url.trim())) { toast.error('URL must start with http:// or https://'); return; }
    try {
      const fd = new FormData();
      fd.append('imageUrl', url.trim());
      const { data } = await updateProductImages(productId, fd);
      setProducts(prev => prev.map(p => p._id === productId ? { ...p, images: data.images || [url.trim()] } : p));
      toast.success('Image URL added!');
      setUrlModal({ open: false, productId: null, url: '' });
    } catch { toast.error('Failed to add image URL.'); }
  };

  const allSelected  = products.length > 0 && selectedIds.size === products.length;
  const someSelected = selectedIds.size > 0;

  /* ════════════════════════════════════════════════════════════════ */
  return (
    <div className="admin-page">

      {/* ── Page Header ── */}
      <div className="admin-page__header">
        <h1>
          Products{' '}
          {total > 0 && <span className="admin-page__count">{total.toLocaleString()}</span>}
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn--outline" onClick={handleDownloadTemplate} title="Download Excel template (.xlsx)">
            <FileSpreadsheet size={16} /> Template
          </button>
          <button className="btn btn--outline" onClick={handleExportExcel} title="Export products to Excel (.xlsx)">
            <FileSpreadsheet size={16} /> Export Excel
          </button>
          <button className="btn btn--outline" onClick={() => csvInputRef.current?.click()} disabled={importing}>
            <Upload size={16} /> {importing ? 'Importing...' : 'Import CSV/Excel'}
          </button>
          <input ref={csvInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleExcelImport} />
          <button
            className="btn btn--ai"
            onClick={handleAiFillMissing}
            title="Auto-fill description & composition with Gemini AI for all products missing this info"
          >
            <Sparkles size={16} /> AI Fill Missing
            {missingCount !== null && missingCount > 0 && (
              <span className="ai-badge">{missingCount.toLocaleString()}</span>
            )}
          </button>
          <button className="btn btn--primary" onClick={() => { setShowForm(!showForm); setEditing(null); setForm(EMPTY); setExistingImages([]); setRemoveImages([]); setImages([]); setImgPreviews([]); }}>
            <Plus size={16} /> {showForm && !editing ? 'Cancel' : 'Add Product'}
          </button>
        </div>
      </div>

      {/* ── AI Fill Modal ── */}
      {aiModal.open && (
        <div className="import-modal-overlay" onClick={() => !aiRunning && setAiModal({ open: false })}>
          <div className="import-modal ai-fill-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            {!aiRunning && (
              <button className="import-modal__close" onClick={() => setAiModal({ open: false })}><X size={18} /></button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Sparkles size={22} style={{ color: '#7c3aed' }} />
              <h2 style={{ margin: 0 }}>AI Auto-Fill</h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
              {aiModal.ids
                ? <>Filling <strong>{aiModal.ids.length}</strong> selected products with Gemini AI.</>
                : <>Filling <strong>all products</strong> that are missing salt or description — <strong>{missingCount?.toLocaleString() ?? '…'}</strong> products.</>}
              {' '}Each product gets a composed description and salt/composition string.
            </p>

            {!aiRunning && aiProgress.length === 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  className="btn btn--primary btn--full"
                  style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
                  onClick={() => {
                    if (aiModal.ids) {
                      runAiBulk(aiModal.ids);
                    } else {
                      // fetch first 200 missing IDs via the admin list
                      getAdminProducts({ page: 1, limit: 200, missingInfo: '1' })
                        .then(r => runAiBulk(r.data.products.map(p => p._id)))
                        .catch(() => toast.error('Could not fetch missing products.'));
                    }
                  }}
                >
                  <Sparkles size={15} /> Start AI Fill
                </button>
                <button className="btn btn--outline" onClick={() => setAiModal({ open: false })}>Cancel</button>
              </div>
            )}

            {(aiRunning || aiProgress.length > 0) && (
              <div className="ai-progress">
                <div className="ai-progress__bar-wrap">
                  <div
                    className="ai-progress__bar"
                    style={{ width: aiRunning && aiModal.ids ? `${Math.round(aiProgress.length / (aiModal.ids?.length || 1) * 100)}%` : '100%' }}
                  />
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--gray-500)', marginTop: 6, marginBottom: 10 }}>
                  {aiRunning
                    ? `Processing… ${aiProgress.length} done`
                    : `Done — ${aiProgress.filter(r => r.success).length} filled, ${aiProgress.filter(r => !r.success).length} failed`}
                </p>
                <div className="ai-progress__list">
                  {aiProgress.slice().reverse().map((r, i) => (
                    <div key={i} className={`ai-progress__item${r.success ? ' ai-progress__item--ok' : ' ai-progress__item--err'}`}>
                      {r.success ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
                      <span className="ai-progress__name">{r.name || r._id}</span>
                      {r.salt && <span className="ai-progress__salt">{r.salt}</span>}
                      {r.error && <span className="ai-progress__err">{r.error}</span>}
                    </div>
                  ))}
                </div>
                {!aiRunning && (
                  <button className="btn btn--primary" style={{ marginTop: 12, width: '100%' }} onClick={() => setAiModal({ open: false })}>
                    Close
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Import Result Modal ── */}
      {importResult && (
        <div className="import-modal-overlay" onClick={() => setImportResult(null)}>
          <div className="import-modal" onClick={e => e.stopPropagation()}>
            <button className="import-modal__close" onClick={() => setImportResult(null)}><X size={18} /></button>
            <h2 style={{ marginBottom: '1rem' }}>Import Results</h2>
            <div className="import-modal__stats">
              <div className="import-stat import-stat--ok"><CheckCircle size={22} /><span className="import-stat__num">{importResult.inserted}</span><span className="import-stat__lbl">Added</span></div>
              <div className="import-stat import-stat--skip"><AlertTriangle size={22} /><span className="import-stat__num">{importResult.skipped}</span><span className="import-stat__lbl">Skipped</span></div>
            </div>
            {importResult.errors?.length > 0 && (
              <div className="import-modal__errors">
                <h3 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#ef4444' }}>Row Errors ({importResult.errors.length})</h3>
                <ul>{importResult.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
              </div>
            )}
            <button className="btn btn--primary" style={{ marginTop: '1rem', width: '100%' }} onClick={() => setImportResult(null)}>Close</button>
          </div>
        </div>
      )}

      {/* ── Hidden inline image upload ── */}
      <input ref={inlineUploadRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleInlineUpload} />

      {/* ── Image URL Modal ── */}
      {urlModal.open && (
        <div className="import-modal-overlay" onClick={() => setUrlModal({ open: false, productId: null, url: '' })}>
          <div className="import-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <button className="import-modal__close" onClick={() => setUrlModal({ open: false, productId: null, url: '' })}><X size={18} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Link size={20} style={{ color: 'var(--primary)' }} />
              <h2 style={{ margin: 0 }}>Add Image by URL</h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: 16 }}>
              Paste a direct image URL (jpg, png, webp). It will be added to this product's images.
            </p>
            <input
              type="url"
              autoFocus
              placeholder="https://example.com/image.jpg"
              value={urlModal.url}
              onChange={e => setUrlModal(m => ({ ...m, url: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleImageUrl()}
              style={{ width: '100%', padding: '10px 13px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 16 }}
            />
            {urlModal.url && /^https?:\/\//i.test(urlModal.url) && (
              <img
                src={urlModal.url}
                alt="preview"
                onError={e => { e.target.style.display = 'none'; }}
                style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16, background: 'var(--gray-50)' }}
              />
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn--primary" style={{ flex: 1 }} onClick={handleImageUrl}>
                <Link size={14} /> Add Image
              </button>
              <button className="btn btn--outline" onClick={() => setUrlModal({ open: false, productId: null, url: '' })}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Stock Modal ── */}
      {bulkModal.open && (
        <div className="import-modal-overlay" onClick={() => setBulkModal({ open: false, value: '', mode: 'set' })}>
          <div className="import-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <button className="import-modal__close" onClick={() => setBulkModal({ open: false, value: '', mode: 'set' })}><X size={18} /></button>
            <h2 style={{ marginBottom: '0.5rem' }}>Bulk Stock Update</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '1.25rem' }}>
              Updating <strong>{selectedIds.size} products</strong>
            </p>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 8 }}>Update Mode</label>
              <div className="bulk-mode-group">
                {[['set', '= Set to'], ['add', '+ Add'], ['subtract', '- Subtract']].map(([val, lbl]) => (
                  <button key={val} type="button"
                    className={`bulk-mode-btn${bulkModal.mode === val ? ' active' : ''}`}
                    onClick={() => setBulkModal(m => ({ ...m, mode: val }))}
                  >{lbl}</button>
                ))}
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 6 }}>
                {bulkModal.mode === 'set' ? 'New Stock Value' : bulkModal.mode === 'add' ? 'Add Quantity' : 'Subtract Quantity'}
              </label>
              <input
                type="number" min="0" autoFocus
                value={bulkModal.value}
                onChange={e => setBulkModal(m => ({ ...m, value: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleBulkStockSubmit()}
              placeholder="Enter number..."
                style={{ width: '100%', padding: '10px 13px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn--primary" style={{ flex: 1 }} onClick={handleBulkStockSubmit}>
                Apply to {selectedIds.size} Products
              </button>
              <button className="btn btn--outline" onClick={() => setBulkModal({ open: false, value: '', mode: 'set' })}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Restock Modal ── */}
      {restockModal.open && (
        <div className="import-modal-overlay" onClick={() => setRestockModal({ open: false, type: 'out', qty: '' })}>
          <div className="import-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <button className="import-modal__close" onClick={() => setRestockModal({ open: false, type: 'out', qty: '' })}><X size={18} /></button>
            <h2 style={{ marginBottom: '0.5rem' }}>
              Quick Restock — {restockModal.type === 'out' ? 'Out of Stock' : 'Low Stock'} Products
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '1.25rem' }}>
              Add a fixed quantity to <strong>all {restockModal.type === 'out' ? 'out-of-stock' : 'low-stock'}</strong> products at once.
            </p>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 6 }}>Quantity to Add</label>
              <input
                type="number" min="1" autoFocus
                value={restockModal.qty}
                onChange={e => setRestockModal(m => ({ ...m, qty: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleRestock()}
                placeholder="e.g. 50"
                style={{ width: '100%', padding: '10px 13px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn--primary" style={{ flex: 1 }} onClick={handleRestock}>
                <Zap size={14} /> Restock Now
              </button>
              <button className="btn btn--outline" onClick={() => setRestockModal({ open: false, type: 'out', qty: '' })}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Discount Modal ── */}
      {discountModal.open && (
        <div className="import-modal-overlay" onClick={() => setDiscountModal({ open: false, pct: '' })}>
          <div className="import-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <button className="import-modal__close" onClick={() => setDiscountModal({ open: false, pct: '' })}><X size={18} /></button>
            <h2 style={{ marginBottom: '0.5rem' }}>Apply Bulk Discount</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '1.25rem' }}>
              Sets selling price = MRP × (1 − discount%). Applies to <strong>{selectAllMatching ? `all ${total.toLocaleString()} matching` : `${selectedIds.size} selected`}</strong> products.
            </p>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', display: 'block', marginBottom: 6 }}>Discount % (0–100)</label>
              <input
                type="number" min="0" max="100" step="0.5" autoFocus
                value={discountModal.pct}
                onChange={e => setDiscountModal(m => ({ ...m, pct: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleBulkDiscount()}
                placeholder="e.g. 15"
                style={{ width: '100%', padding: '10px 13px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn--primary" style={{ flex: 1, background: 'var(--green)', borderColor: 'var(--green)' }} onClick={handleBulkDiscount}>
                <Percent size={14} /> Apply Discount
              </button>
              <button className="btn btn--outline" onClick={() => setDiscountModal({ open: false, pct: '' })}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Form ── */}
      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <h2>{editing ? 'Edit Product' : 'New Product'}</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required maxLength={200} />
            </div>
            <div className="form-group">
              <label>Category *</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required>
                <option value="">Select category</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Brand</label>
              <input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} maxLength={100} />
            </div>
          </div>
          <div className="form-group">
            <label>Composition / Salt</label>
            <input
              value={form.salt}
              onChange={e => setForm(f => ({ ...f, salt: e.target.value }))}
              maxLength={500}
              placeholder="e.g. Paracetamol 650mg, Ibuprofen 400mg + Paracetamol 325mg"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} maxLength={2000} rows={3} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>MRP (Rs.) *</label>
              <input type="number" min="0" step="0.01" value={form.mrp} onChange={e => setForm(f => ({ ...f, mrp: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Sale Price (Rs.) *</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Stock *</label>
              <input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} required />
            </div>
          </div>
          <div className="form-group">
            <label>Images (max 5)</label>
            {editing && existingImages.length > 0 && (
              <div className="img-manage__existing">
                {existingImages.map((url, i) => (
                  <div key={i} className="img-manage__thumb">
                    <img src={url} alt={`existing ${i + 1}`} />
                    <button type="button" className="img-manage__remove" onClick={() => handleMarkRemove(url)} title="Remove"><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => handleNewImages(e.target.files)} />
            {imgPreviews.length > 0 && (
              <div className="img-manage__existing" style={{ marginTop: 8 }}>
                {imgPreviews.map((src, i) => (
                  <div key={i} className="img-manage__thumb img-manage__thumb--new">
                    <img src={src} alt={`new ${i + 1}`} />
                    <span className="img-manage__new-label">New</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <label className="checkbox-label">
            <input type="checkbox" checked={form.requiresPrescription} onChange={e => setForm(f => ({ ...f, requiresPrescription: e.target.checked }))} />
            Requires Prescription (Rx)
          </label>
          <div className="form-actions">
            <button className="btn btn--primary" type="submit">{editing ? 'Update Product' : 'Create Product'}</button>
            <button type="button" className="btn btn--outline" onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY); setExistingImages([]); setRemoveImages([]); setImages([]); setImgPreviews([]); }}>Cancel</button>
          </div>
        </form>
      )}

      {/* ── Filter Bar ── */}
      <div className="admin-filter-bar">
        <div className="admin-filter-bar__search">
          <Search size={15} className="admin-filter-bar__search-icon" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchInput}
            onChange={e => handleSearchInput(e.target.value)}
          />
          {searchInput && (
            <button className="admin-filter-bar__clear" onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}>
              <X size={13} />
            </button>
          )}
        </div>

        <select className="admin-filter-bar__select" value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>

        <input
          type="text"
          className="admin-filter-bar__input"
          placeholder="Filter by brand..."
          value={brandFilter}
          onChange={e => { setBrandFilter(e.target.value); setPage(1); }}
          style={{ minWidth: '140px' }}
        />

        <select className="admin-filter-bar__select" value={stockFilter} onChange={e => { setStockFilter(e.target.value); setPage(1); }}>
          {STOCK_OPTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        <select className="admin-filter-bar__select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          {STATUS_OPTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        <select className="admin-filter-bar__select" value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}>
          {SORT_OPTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        {hasFilters && (
          <button className="btn btn--sm btn--outline" onClick={clearFilters}>x Clear Filters</button>
        )}
        <button
          className={`btn btn--sm ${missingFilter ? 'btn--primary' : 'btn--outline'}`}
          style={missingFilter ? { background: '#7c3aed', borderColor: '#7c3aed' } : { borderColor: '#7c3aed', color: '#7c3aed' }}
          onClick={() => { setMissingFilter(f => !f); setPage(1); }}
          title="Show only products missing salt or description"
        >
          ⚠ {missingFilter ? 'Hide Missing' : 'Missing Info'}
          {!missingFilter && missingCount !== null && missingCount > 0 && (
            <span className="ai-badge" style={{ marginLeft: 4 }}>{missingCount.toLocaleString()}</span>
          )}
        </button>
      </div>


      {/* -- Quick Restock Panel -- */}
      <div className="quick-restock-bar">
        <span className="quick-restock-bar__label"><Zap size={14} /> Quick Restock</span>
        <button className="btn btn--sm btn--outline" onClick={() => setRestockModal({ open: true, type: 'out', qty: '' })}>
          Restock Out of Stock
        </button>
        <button className="btn btn--sm btn--outline" onClick={() => setRestockModal({ open: true, type: 'low', qty: '' })}>
          Restock Low Stock
        </button>
      </div>

      {/* -- Bulk Actions Bar (shown when items selected) -- */}
      {someSelected && (
        <div className="bulk-actions-bar">
          <span className="bulk-actions-bar__count">
            {selectAllMatching ? `All ${total.toLocaleString()} matching` : `${selectedIds.size} selected`}
          </span>
          <div className="bulk-actions-bar__btns">
            <button className="btn btn--sm btn--outline" onClick={() => handleBulkActivate(true)}>Activate</button>
            <button className="btn btn--sm btn--outline" onClick={() => handleBulkActivate(false)}>Deactivate</button>
            <button className="btn btn--sm btn--outline" onClick={handleBulkMarkOutOfStock}>Mark Out of Stock</button>
            <button className="btn btn--sm btn--primary" onClick={() => setBulkModal({ open: true, value: '', mode: 'set' })}>
              <Package size={14} /> Update Stock
            </button>
            <button className="btn btn--sm btn--primary" style={{ background: 'var(--green)', borderColor: 'var(--green)' }}
              onClick={() => setDiscountModal({ open: true, pct: '' })}>
              <Percent size={14} /> Discount
            </button>
            <button
              className="btn btn--sm btn--outline"
              onClick={handleAiFillSelected}
              style={{ background: '#7c3aed', borderColor: '#7c3aed', color: '#fff' }}
              title="AI auto-fill description & composition for selected products"
            >
              <Sparkles size={13} /> AI Fill
            </button>
            <button className="btn btn--sm btn--danger" onClick={handleBulkDelete}><Trash2 size={14} /> Delete</button>
            <button className="btn btn--sm btn--outline" onClick={() => { setSelectedIds(new Set()); setSelectAllMatching(false); }}><X size={13} /></button>
          </div>
        </div>
      )}

      {/* -- Select All Matching Banner -- */}
      {someSelected && !selectAllMatching && total > products.length && (
        <div className="select-all-banner">
          <span>Only <strong>{products.length}</strong> of <strong>{total.toLocaleString()}</strong> matching products selected.</span>
          <button className="btn btn--sm btn--link" onClick={() => setSelectAllMatching(true)}>
            Select all {total.toLocaleString()} matching products
          </button>
        </div>
      )}
      {selectAllMatching && (
        <div className="select-all-banner select-all-banner--active">
          <span>All <strong>{total.toLocaleString()}</strong> matching products are selected.</span>
          <button className="btn btn--sm btn--link" onClick={() => { setSelectAllMatching(false); setSelectedIds(new Set()); }}>
            Cancel selection
          </button>
        </div>
      )}
      {/* ── Products Table ── */}
      <div style={{ overflowX: 'auto' }}>
        {loading ? (
          <div className="admin-state-msg">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="admin-state-msg">No products found. Try adjusting filters.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} title="Select all on page" />
                </th>
                <th>Image</th>
                <th>Name / Brand / Category</th>
                <th>MRP</th>
                <th>Price</th>
                <th>Disc%</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Rx</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id}
                  className={selectedIds.has(p._id) ? 'row--selected' : ''}
                  style={{ opacity: p.isActive === false ? 0.6 : 1 }}
                >
                  <td>
                    <input type="checkbox" checked={selectedIds.has(p._id)} onChange={() => toggleSelect(p._id)} />
                  </td>
                  <td>
                    <div className="table-img-cell">
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt={p.name} className="table-thumb" />
                        : <span className="table-no-img">No img</span>}
                      <button type="button" className="btn btn--sm table-img-upload-btn" title="Upload image file"
                        onClick={() => { setUploadingFor(p._id); setTimeout(() => inlineUploadRef.current?.click(), 50); }}>
                        <Camera size={13} />
                      </button>
                      <button type="button" className="btn btn--sm table-img-upload-btn" title="Add image by URL"
                        style={{ marginLeft: 2 }}
                        onClick={() => setUrlModal({ open: true, productId: p._id, url: '' })}>
                        <Link size={13} />
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="product-name-cell">
                      <span className="product-name-cell__name">{p.name}</span>
                      {(!p.salt || !p.description) && (
                        <span className="missing-info-badge" title="Missing salt or description">⚠ Missing</span>
                      )}
                      {p.brand && <span className="product-name-cell__brand">{p.brand}</span>}
                      <span className="product-name-cell__cat">{p.category?.name || '-'}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--gray-500)', textDecoration: 'line-through', fontSize: '0.85rem' }}>&#8377;{p.mrp}</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>&#8377;{p.price}</td>
                  <td>{p.mrp > 0 && p.price < p.mrp ? (
                    <span className="disc-badge">{Math.round((p.mrp - p.price) / p.mrp * 100)}%</span>
                  ) : <span style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>-</span>}</td>
                  <td>
                    <div className="stock-edit-cell">
                      <input
                        type="number" min="0"
                        className={`quick-stock-input${p.stock === 0 ? ' qs--out' : p.stock <= 10 ? ' qs--low' : ''}`}
                        value={stockEdit[p._id] !== undefined ? stockEdit[p._id] : p.stock}
                        onChange={e => setStockEdit(s => ({ ...s, [p._id]: e.target.value }))}
                        onBlur={() => {
                          if (stockEdit[p._id] !== undefined) {
                            handleQuickStock(p._id, stockEdit[p._id]);
                            setStockEdit(s => { const n = { ...s }; delete n[p._id]; return n; });
                          }
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            handleQuickStock(p._id, stockEdit[p._id] !== undefined ? stockEdit[p._id] : p.stock);
                            setStockEdit(s => { const n = { ...s }; delete n[p._id]; return n; });
                            e.target.blur();
                          }
                        }}
                        style={{ width: 68 }}
                        title="Type a number and press Enter or Tab to save"
                      />
                      <StockBadge stock={p.stock} />
                    </div>
                  </td>
                  <td>
                    <button
                      className={`toggle-active-btn${p.isActive === false ? '' : ' toggle-active-btn--on'}`}
                      onClick={() => handleToggleActive(p)}
                      title={p.isActive === false ? 'Click to activate' : 'Click to deactivate'}
                    >
                      {p.isActive === false
                        ? <><ToggleLeft size={17} /> Inactive</>
                        : <><ToggleRight size={17} /> Active</>}
                    </button>
                  </td>
                <td>{p.requiresPrescription ? <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.78rem' }}>Rx</span> : '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="btn btn--sm btn--outline"
                        onClick={() => handleAiFillOne(p._id)}
                        disabled={aiFilling.has(p._id)}
                        title="AI auto-fill description & composition"
                        style={{ color: aiFilling.has(p._id) ? '#9ca3af' : '#7c3aed', borderColor: '#7c3aed', padding: '2px 6px' }}
                      >
                        {aiFilling.has(p._id) ? <span style={{ fontSize: '0.7rem' }}>…</span> : <Sparkles size={13} />}
                      </button>
                      <button className="btn btn--sm btn--outline" onClick={() => startEdit(p)} title="Edit"><Pencil size={14} /></button>
                      <button className="btn btn--sm btn--danger" onClick={() => handleDelete(p._id)} title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && pages > 0 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>&laquo; Prev</button>
          <span>Page {page} / {pages} &nbsp;&middot;&nbsp; {total.toLocaleString()} products</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next &raquo;</button>
        </div>
      )}
    </div>
  );
}
