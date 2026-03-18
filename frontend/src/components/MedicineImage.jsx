import { useState, useEffect } from 'react';

/* ─── Category themes ────────────────────────────────────────── */
const THEMES = {
  allopathic:       { from: '#C0392B', to: '#922B21' },
  ayurvedic:        { from: '#1E8449', to: '#145A32' },
  cosmetics:        { from: '#8E44AD', to: '#6C3483' },
  'baby-products':  { from: '#2980B9', to: '#1A5276' },
  surgical:         { from: '#2E4057', to: '#1A252F' },
};
const DEFAULT_THEME = { from: '#566573', to: '#2C3E50' };

function getTheme(category) {
  const slug = typeof category === 'object' ? category?.slug : null;
  return THEMES[slug] || DEFAULT_THEME;
}
function getSlug(category) {
  return typeof category === 'object' ? category?.slug || 'default' : 'default';
}

/* ─── SVG Icons per category ─────────────────────────────────── */
const PillIcon = () => (
  <svg width="64" height="64" viewBox="0 0 100 100" fill="none">
    <rect x="18" y="33" width="64" height="34" rx="17" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.55)" strokeWidth="2.5"/>
    <rect x="18" y="33" width="32" height="34" rx="17" fill="rgba(255,255,255,0.60)"/>
    <line x1="50" y1="35" x2="50" y2="65" stroke="rgba(255,255,255,0.35)" strokeWidth="2"/>
    <circle cx="30" cy="50" r="8" fill="rgba(255,255,255,0.25)"/>
    <circle cx="72" cy="50" r="8" fill="rgba(255,255,255,0.12)"/>
  </svg>
);
const LeafIcon = () => (
  <svg width="64" height="64" viewBox="0 0 100 100" fill="none">
    <path d="M50 10 C28 20 16 46 22 66 C28 82 41 88 50 88 C59 88 72 82 78 66 C84 46 72 20 50 10Z" fill="rgba(255,255,255,0.82)" />
    <line x1="50" y1="88" x2="50" y2="10" stroke="rgba(0,0,0,0.12)" strokeWidth="1.8"/>
    <line x1="50" y1="44" x2="34" y2="34" stroke="rgba(0,0,0,0.09)" strokeWidth="1.4"/>
    <line x1="50" y1="56" x2="66" y2="44" stroke="rgba(0,0,0,0.09)" strokeWidth="1.4"/>
  </svg>
);
const TubeIcon = () => (
  <svg width="64" height="64" viewBox="0 0 100 100" fill="none">
    <rect x="34" y="25" width="32" height="50" rx="10" fill="rgba(255,255,255,0.82)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
    <rect x="38" y="15" width="24" height="14" rx="5" fill="rgba(255,255,255,0.60)"/>
    <circle cx="50" cy="82" r="7" fill="rgba(255,255,255,0.45)"/>
    <rect x="41" y="36" width="18" height="3" rx="1.5" fill="rgba(0,0,0,0.10)"/>
    <rect x="41" y="44" width="14" height="2.5" rx="1.2" fill="rgba(0,0,0,0.07)"/>
  </svg>
);
const BabyIcon = () => (
  <svg width="64" height="64" viewBox="0 0 100 100" fill="none">
    <rect x="34" y="32" width="32" height="50" rx="13" fill="rgba(255,255,255,0.82)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
    <rect x="39" y="20" width="22" height="16" rx="5" fill="rgba(255,255,255,0.60)"/>
    <path d="M44 20 C44 12 56 12 56 20" stroke="rgba(255,255,255,0.7)" strokeWidth="2" fill="rgba(255,255,255,0.5)"/>
    <rect x="41" y="55" width="18" height="3" rx="1.5" fill="rgba(0,0,0,0.10)"/>
  </svg>
);
const CrossIcon = () => (
  <svg width="64" height="64" viewBox="0 0 100 100" fill="none">
    <rect x="38" y="14" width="24" height="72" rx="7" fill="rgba(255,255,255,0.85)"/>
    <rect x="14" y="38" width="72" height="24" rx="7" fill="rgba(255,255,255,0.85)"/>
  </svg>
);

const ICONS = {
  allopathic:      PillIcon,
  ayurvedic:       LeafIcon,
  cosmetics:       TubeIcon,
  'baby-products': BabyIcon,
  surgical:        CrossIcon,
};

/* ─── Module-level external image cache ──────────────────────── */
const _cache   = new Map(); // productKey → url | null
const _pending = new Set();

// Concurrency limiter — max 3 simultaneous Wikipedia requests
let _activeCount = 0;
const _queue = [];
function _runNext() {
  if (_activeCount >= 3 || _queue.length === 0) return;
  const { fn, resolve } = _queue.shift();
  _activeCount++;
  fn().then(v => { _activeCount--; resolve(v); _runNext(); });
}
function _throttled(fn) {
  return new Promise(resolve => { _queue.push({ fn, resolve }); _runNext(); });
}

async function _fetchExternalImage(product) {
  const key = product._id || product.slug;
  if (!key) return null;
  if (_cache.has(key)) return _cache.get(key);
  if (_pending.has(key)) return null;
  _pending.add(key);

  const done = url => { _cache.set(key, url ?? null); _pending.delete(key); return url ?? null; };

  return _throttled(async () => {
    const salt      = product.salt?.trim();
    const nameShort = (product.name || '').split(' ').slice(0, 2).join(' ');

    // Wikipedia by salt (most reliable for Indian pharma — Paracetamol, Amoxicillin, etc.)
    if (salt) {
      try {
        const r = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&generator=search` +
          `&gsrsearch=${encodeURIComponent(salt)}&gsrlimit=1&prop=pageimages` +
          `&pithumbsize=500&format=json&origin=*`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (r.ok) {
          const d = await r.json();
          const url = Object.values(d.query?.pages || {})[0]?.thumbnail?.source;
          if (url) return done(url);
        }
      } catch { /* timeout / offline */ }
    }

    // Wikipedia by product name (first 2 words)
    if (nameShort) {
      try {
        const r = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&generator=search` +
          `&gsrsearch=${encodeURIComponent(nameShort)}&gsrlimit=1&prop=pageimages` +
          `&pithumbsize=500&format=json&origin=*`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (r.ok) {
          const d = await r.json();
          const url = Object.values(d.query?.pages || {})[0]?.thumbnail?.source;
          if (url) return done(url);
        }
      } catch { /* timeout / offline */ }
    }

    return done(null);
  });
}

/* ─── Main component ─────────────────────────────────────────── */
export default function MedicineImage({ product, alt, className = '', idx = 0, style = {} }) {
  const [storedErr, setStoredErr] = useState(false);

  const key = product?._id || product?.slug;
  const [externalUrl, setExternalUrl] = useState(() =>
    key ? (_cache.get(key) ?? null) : null
  );

  const storedSrc = product?.images?.[idx];

  useEffect(() => {
    // Run when: no stored image, OR stored image failed to load
    if (storedSrc && !storedErr) return;
    if (!product || !key) return;
    if (_cache.has(key)) { setExternalUrl(_cache.get(key)); return; }
    _fetchExternalImage(product).then(url => { if (url) setExternalUrl(url); });
  }, [key, storedSrc, storedErr]); // eslint-disable-line react-hooks/exhaustive-deps

  // 1. Stored image (Cloudinary / 1mg CDN URL)
  if (storedSrc && !storedErr) {
    return (
      <img
        src={storedSrc}
        alt={alt || product?.name || 'Medicine'}
        className={className}
        style={style}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setStoredErr(true)}
      />
    );
  }

  // 2. External image fetched from Wikipedia / Open Food Facts
  if (externalUrl) {
    return (
      <img
        src={externalUrl}
        alt={alt || product?.name || 'Medicine'}
        className={className}
        style={style}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => { _cache.set(key, null); setExternalUrl(null); }}
      />
    );
  }

  // 3. SVG category placeholder
  const slug     = getSlug(product?.category);
  const theme    = getTheme(product?.category);
  const Icon     = ICONS[slug] || PillIcon;
  const initials = (product?.brand || product?.name || 'M')
    .trim().split(/\s+/).slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '').join('');

  return (
    <div
      className={`med-placeholder ${className}`}
      style={{ background: `linear-gradient(145deg, ${theme.from}, ${theme.to})`, ...style }}
      aria-label={alt || product?.name || 'Medicine'}
      role="img"
    >
      <Icon />
      <span className="med-placeholder__initials">{initials}</span>
    </div>
  );
}
