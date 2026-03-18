import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle, Truck, MapPin, ShieldCheck, Clock, ChevronRight,
  Navigation, ExternalLink,
  Stethoscope, Pill, Leaf, Sparkles, Baby, Scissors, Hospital, Star, Heart, Syringe,
  Droplets, Droplet, FlaskConical, Wind, Thermometer, ShoppingBag, Box,
  TestTube, Package, Tag, GlassWater, Gem, LayoutGrid
} from 'lucide-react';
import { getActiveOffers } from '../api/offers';
import { getCategories } from '../api/categories';
import { getProducts } from '../api/products';
import { getBrands } from '../api/brands';
import ProductCard from '../components/ProductCard';
import OfferBanner from '../components/OfferBanner';

const CATEGORY_ICONS = {
  /* ── DB Slugs (seedCategories) ── */
  'caps-tabs':        { icon: <Pill size={28} />,         bg: '#FEF2F2', color: '#C0392B' },
  'liquids':          { icon: <Droplets size={28} />,     bg: '#EFF6FF', color: '#2563EB' },
  'cream-ointment':   { icon: <FlaskConical size={28} />, bg: '#FDF4FF', color: '#9333EA' },
  'drop':             { icon: <Droplet size={28} />,      bg: '#ECFEFF', color: '#0891B2' },
  'powder':           { icon: <TestTube size={28} />,     bg: '#F1F5F9', color: '#475569' },
  'lotion':           { icon: <Sparkles size={28} />,     bg: '#FFF0F6', color: '#DB2777' },
  'injection':        { icon: <Syringe size={28} />,      bg: '#F0F0FF', color: '#4F46E5' },
  'inhaler':          { icon: <Wind size={28} />,         bg: '#F0FFFE', color: '#0D9488' },
  'softgel-capsules': { icon: <Gem size={28} />,          bg: '#FFF7ED', color: '#EA580C' },
  'fluids':           { icon: <GlassWater size={28} />,   bg: '#F0F9FF', color: '#0284C7' },
  'high-value':       { icon: <Star size={28} />,         bg: '#FFFBEB', color: '#D97706' },
  'fmcg':             { icon: <ShoppingBag size={28} />,  bg: '#FFF5E0', color: '#C2410C' },
  'surgicals':        { icon: <Scissors size={28} />,     bg: '#F0F4F8', color: '#334155' },
  'generic':          { icon: <Package size={28} />,      bg: '#F0FBF4', color: '#16A34A' },
  'keimed-generics':  { icon: <Tag size={28} />,          bg: '#EFF8FF', color: '#0369A1' },
  'container':        { icon: <Box size={28} />,          bg: '#FEFCE8', color: '#CA8A04' },
  'pharma-misc':      { icon: <LayoutGrid size={28} />,   bg: '#F5F3FF', color: '#7C3AED' },
  'fridge':           { icon: <Thermometer size={28} />,  bg: '#E8EEFF', color: '#1E40AF' },
  /* ── Legacy fallbacks ── */
  allopathic:         { icon: <Pill size={28} />,         bg: '#FEF2F2', color: '#C0392B' },
  ayurvedic:          { icon: <Leaf size={28} />,         bg: '#F0FBF4', color: '#1E8449' },
  cosmetics:          { icon: <Sparkles size={28} />,     bg: '#FDF4FF', color: '#9333EA' },
  'baby-products':    { icon: <Baby size={28} />,         bg: '#FFF7ED', color: '#EA580C' },
  surgical:           { icon: <Scissors size={28} />,     bg: '#EFF6FF', color: '#2563EB' },
};

const DEFAULT_CAT = { icon: <Hospital size={28} />, bg: '#F0FBF4', color: '#1E8449' };

const TRUST_FEATURES = [
  { icon: <Truck size={22} />,        bg: '#FEF2F2', color: '#C0392B', title: 'Free Home Delivery',      desc: 'On all orders, every day' },
  { icon: <ShieldCheck size={22} />,  bg: '#F0FBF4', color: '#1B8843', title: '100% Genuine Medicines',  desc: 'Sourced from licensed suppliers' },
  { icon: <Clock size={22} />,        bg: '#FEF2F2', color: '#C0392B', title: 'Open Until 9 PM',         desc: 'Monday to Sunday' },
  { icon: <Stethoscope size={22} />,  bg: '#F0FBF4', color: '#1B8843', title: 'Expert Pharmacists',      desc: 'Available for consultation' },
];

const STORE_ADDRESS = 'F 41/2, Nafees Road, Batla House, Jamia Nagar, New Delhi - 110025';
const GOOGLE_MAPS_URL = 'https://maps.app.goo.gl/W4Qtps1fKbArBvz17';

export default function Home() {
  const [offers, setOffers]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [featuredBrands, setFeaturedBrands] = useState([]);
  const [ayurvedaBrands, setAyurvedaBrands] = useState([]);

  useEffect(() => {
    getActiveOffers().then(r => setOffers(r.data.offers)).catch(() => {});
    getCategories().then(r => setCategories(r.data.categories)).catch(() => {});
    getProducts({ limit: 8, sort: 'newest' }).then(r => setFeatured(r.data.products)).catch(() => {});
    getBrands({ category: 'featured'  }).then(r => setFeaturedBrands(r.data.brands || [])).catch(() => {});
    getBrands({ category: 'ayurvedic' }).then(r => setAyurvedaBrands(r.data.brands || [])).catch(() => {});
  }, []);

  const WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER || '919990165925';

  return (
    <main>
      {/* Hero */}
      <section className="hero">
        {/* Floating particle crosses */}
        <div className="hero__particles" aria-hidden="true">
          {[1,2,3,4,5,6,7,8].map(n => <div key={n} className={`hero__particle hero__particle--${n}`} />)}
        </div>

        <div className="hero__layout">
          {/* Medicine Orbital — right side */}
          <div className="hero-orbital" aria-hidden="true">
            {/* Central cross */}
            <div className="hero-orbital__core">
              <svg viewBox="0 0 60 60" width="52" height="52" fill="none">
                <rect x="22" y="4"  width="16" height="52" rx="6" fill="white" opacity="0.95"/>
                <rect x="4"  y="22" width="52" height="16" rx="6" fill="white" opacity="0.95"/>
                <rect x="22" y="4"  width="16" height="52" rx="6" fill="url(#cg)" opacity="0.3"/>
                <rect x="4"  y="22" width="52" height="16" rx="6" fill="url(#cg)" opacity="0.3"/>
                <defs><linearGradient id="cg" x1="0" y1="0" x2="60" y2="60"><stop offset="0%" stopColor="#C0392B"/><stop offset="100%" stopColor="#1B8843"/></linearGradient></defs>
              </svg>
            </div>
            {/* Ring 1 — pills */}
            <div className="hero-orbital__ring hero-orbital__ring--1">
              <div className="hero-orbital__icon hero-orbital__icon--1"><Pill size={18} color="white" /></div>
              <div className="hero-orbital__icon hero-orbital__icon--1b"><Pill size={16} color="rgba(255,255,255,0.8)" /></div>
            </div>
            {/* Ring 2 — leaf + heart */}
            <div className="hero-orbital__ring hero-orbital__ring--2">
              <div className="hero-orbital__icon hero-orbital__icon--2"><Leaf size={19} color="#4ade80" /></div>
              <div className="hero-orbital__icon hero-orbital__icon--2b"><Heart size={17} color="#FC8181" /></div>
            </div>
            {/* Ring 3 — stethoscope + syringe */}
            <div className="hero-orbital__ring hero-orbital__ring--3">
              <div className="hero-orbital__icon hero-orbital__icon--3"><Stethoscope size={18} color="white" /></div>
              <div className="hero-orbital__icon hero-orbital__icon--3b"><Syringe size={16} color="rgba(255,220,100,0.95)" /></div>
            </div>
          </div>

          {/* Content */}
          <div className="hero__content">
            <span className="hero__tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 2v20M2 12h20"/></svg>
              Trusted Pharmacy Since 2005
            </span>
            <h1>
              Your Trusted<br />
              <span className="red">Neighbourhood</span><br />
              Pharmacy
            </h1>
            <p>Allopathic &middot; Ayurvedic &middot; Cosmetics &middot; Baby Products &middot; Surgical</p>
            <div className="hero__actions">
              <Link to="/products" className="btn btn--primary btn--lg">
                Shop Now <ChevronRight size={18} />
              </Link>
              <a
                href={`https://wa.me/${WHATSAPP}?text=Hi%2C%20I%20want%20to%20place%20an%20order`}
                target="_blank" rel="noopener noreferrer"
                className="btn btn--ghost btn--lg"
              >
                <MessageCircle size={18} /> Order on WhatsApp
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* Trust Features */}
      <section style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '28px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            {TRUST_FEATURES.map((f, i) => (
              <div key={i} className="trust-card-3d" style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '16px', borderRadius: '10px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: f.bg, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gray-800)', marginBottom: '2px' }}>{f.title}</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3D Offers Banner */}
      {offers.length > 0 && <OfferBanner offers={offers} />}

      {/* Categories */}
      <section className="section">
        <div className="container">
          <div className="section__header">
            <h2 className="section__title">Shop by Category</h2>
            <Link to="/products" className="section__link">All Products <ChevronRight size={14} /></Link>
          </div>
          <div className="category-grid">
            {categories.map(cat => {
              const cfg = CATEGORY_ICONS[cat.slug] || DEFAULT_CAT;
              return (
                <Link key={cat._id} to={`/products?category=${cat._id}`} className="category-card">
                  <span
                    className="category-card__icon"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {cfg.icon}
                  </span>
                  <span>{cat.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="section section--gray">
          <div className="container">
            <div className="section__header">
              <h2 className="section__title">New Arrivals</h2>
              <Link to="/products" className="section__link">View All <ChevronRight size={14} /></Link>
            </div>
            <div className="product-grid">
              {featured.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Featured Brands */}
      {featuredBrands.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section__header">
              <h2 className="section__title">Featured Brands</h2>
              <Link to="/products" className="section__link">See all <ChevronRight size={14} /></Link>
            </div>
            <div className="brands-scroll">
              {featuredBrands.map(b => (
                <Link key={b._id} to={`/products?brand=${encodeURIComponent(b.name)}`} className="brand-card" title={b.name}>
                  {b.logoUrl
                    ? <img src={b.logoUrl} alt={b.name} className="brand-card__img" />
                    : <span className="brand-card__fallback">{b.name.slice(0, 2).toUpperCase()}</span>
                  }
                  <span className="brand-card__name">{b.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ayurvedic Brands */}
      {ayurvedaBrands.length > 0 && (
        <section className="section section--gray">
          <div className="container">
            <div className="section__header">
              <h2 className="section__title" style={{ color: '#1B8843' }}>
                <Leaf size={20} style={{ marginRight: 8 }} />Ayurveda Top Brands
              </h2>
              <Link to="/products?category=ayurvedic" className="section__link">See all <ChevronRight size={14} /></Link>
            </div>
            <div className="brands-scroll">
              {ayurvedaBrands.map(b => (
                <Link key={b._id} to={`/products?brand=${encodeURIComponent(b.name)}`} className="brand-card brand-card--ayurvedic" title={b.name}>
                  {b.logoUrl
                    ? <img src={b.logoUrl} alt={b.name} className="brand-card__img" />
                    : <span className="brand-card__fallback brand-card__fallback--green">{b.name.slice(0, 2).toUpperCase()}</span>
                  }
                  <span className="brand-card__name">{b.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Google Maps */}
      <section className="section map-section">
        <div className="container">
          <h2 className="section__title" style={{ justifyContent: 'center', marginBottom: '6px' }}>
            <MapPin size={20} /> Visit Us In-Store
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
            {STORE_ADDRESS}
          </p>
          <div className="map-wrapper">
            <div className="map-card">
              <div className="map-card__pin">
                <MapPin size={24} />
              </div>
              <div className="map-card__content">
                <h3>Batla Medicos</h3>
                <p>{STORE_ADDRESS}</p>
                <div className="map-card__actions">
                  <a href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer" className="btn btn--primary">
                    <Navigation size={16} /> Get Directions
                  </a>
                  <a href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer" className="btn btn--outline">
                    <ExternalLink size={16} /> Open in Google Maps
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
