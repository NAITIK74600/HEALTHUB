import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle, Truck, MapPin, ShieldCheck, Clock, ChevronRight, ChevronLeft,
  Navigation, ExternalLink,
  Stethoscope, Pill, Leaf, Sparkles, Baby, Scissors, Hospital, Star, Heart, Syringe,
  Droplets, Droplet, FlaskConical, Wind, Thermometer, ShoppingBag, Box,
  TestTube, Package, Tag, GlassWater, Gem, LayoutGrid, Beaker, Activity,
  SmilePlus, Users, Zap, Shield,
} from 'lucide-react';
import { getActiveOffers } from '../api/offers';
import { getCategories } from '../api/categories';
import { getProducts } from '../api/products';
import { getBrands } from '../api/brands';
import ProductCard from '../components/ProductCard';
import OfferBanner from '../components/OfferBanner';

const CATEGORY_ICONS = {
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
  'container':        { icon: <Box size={28} />,          bg: '#FEFCE8', color: '#CA8A04' },
  'pharma-misc':      { icon: <LayoutGrid size={28} />,   bg: '#F5F3FF', color: '#7C3AED' },
  'fridge':           { icon: <Thermometer size={28} />,  bg: '#E8EEFF', color: '#1E40AF' },
  allopathic:         { icon: <Pill size={28} />,         bg: '#FEF2F2', color: '#C0392B' },
  ayurvedic:          { icon: <Leaf size={28} />,         bg: '#F0FBF4', color: '#1E8449' },
  homeopathy:         { icon: <Droplet size={28} />,      bg: '#EFF6FF', color: '#2563EB' },
  vaccines:           { icon: <Syringe size={28} />,      bg: '#F0F0FF', color: '#4F46E5' },
  dental:             { icon: <SmilePlus size={28} />,    bg: '#F0FFFE', color: '#0D9488' },
  otc:                { icon: <ShoppingBag size={28} />,  bg: '#FFF5E0', color: '#C2410C' },
  herbal:             { icon: <Leaf size={28} />,         bg: '#F0FBF4', color: '#16A34A' },
  nutrition:          { icon: <Activity size={28} />,     bg: '#FFFBEB', color: '#D97706' },
};
const DEFAULT_CAT = { icon: <Hospital size={28} />, bg: '#F0FBF4', color: '#1E8449' };

// Personal-care category tiles matching the screenshot style
const PERSONAL_CARE_CATS = [
  { label: 'Skin Care',       slug: 'skin-care',       gradient: 'linear-gradient(135deg,#8BC34A,#5D9E3F)', img: 'https://www.1mg.com/images/category_page_icons/skin_care.png' },
  { label: 'Hair Care',       slug: 'hair-care',       gradient: 'linear-gradient(135deg,#4CAF50,#2E7D32)', img: 'https://www.1mg.com/images/category_page_icons/hair_care.png' },
  { label: 'Sexual Wellness', slug: 'sexual-wellness', gradient: 'linear-gradient(135deg,#FF9800,#E65100)', img: 'https://www.1mg.com/images/category_page_icons/sexual_wellness.png' },
  { label: 'Oral Care',       slug: 'dental',          gradient: 'linear-gradient(135deg,#E57373,#C62828)', img: 'https://www.1mg.com/images/category_page_icons/oral_care.png' },
  { label: 'Elderly Care',    slug: 'caps-tabs',       gradient: 'linear-gradient(135deg,#29B6F6,#0277BD)', img: 'https://www.1mg.com/images/category_page_icons/elderly_care.png' },
  { label: 'Baby Care',       slug: 'baby-care',       gradient: 'linear-gradient(135deg,#9C27B0,#6A1B9A)', img: 'https://www.1mg.com/images/category_page_icons/baby_care.png' },
  { label: 'Women Care',      slug: 'fmcg',            gradient: 'linear-gradient(135deg,#EC407A,#AD1457)', img: 'https://www.1mg.com/images/category_page_icons/womens_care.png' },
  { label: 'Men Grooming',    slug: 'fmcg',            gradient: 'linear-gradient(135deg,#607D8B,#37474F)', img: 'https://www.1mg.com/images/category_page_icons/mens_grooming.png' },
];

const LAB_TESTS = [
  { label: 'Diabetes Panel',     desc: 'HbA1c, Fasting Glucose', discount: '70%', icon: <Activity size={26} color="#DB2777" /> },
  { label: 'Heart Health',       desc: 'Lipid Profile, CBC',      discount: '65%', icon: <Heart size={26} color="#C0392B" /> },
  { label: 'Full Body Checkup',  desc: '72+ Parameters',          discount: '60%', icon: <Stethoscope size={26} color="#4F46E5" /> },
  { label: 'Thyroid Profile',    desc: 'T3, T4, TSH',             discount: '55%', icon: <Zap size={26} color="#D97706" /> },
  { label: 'Kidney Function',    desc: 'Creatinine, Uric Acid',   discount: '50%', icon: <Shield size={26} color="#0891B2" /> },
  { label: 'Vitamin Panel',      desc: 'B12, D3, Folate',         discount: '68%', icon: <Sparkles size={26} color="#9333EA" /> },
];

const TRUST_FEATURES = [
  { icon: <Truck size={22} />,       bg: '#FEF2F2', color: '#C0392B', title: 'Free Delivery',           desc: 'On every order, every day' },
  { icon: <ShieldCheck size={22} />, bg: '#F0FBF4', color: '#1B8843', title: '100% Genuine',            desc: 'Licensed & verified sources' },
  { icon: <Clock size={22} />,       bg: '#FEF2F2', color: '#C0392B', title: 'Open Until 9 PM',         desc: 'Monday to Sunday' },
  { icon: <Stethoscope size={22} />, bg: '#F0FBF4', color: '#1B8843', title: 'Expert Pharmacists',      desc: 'Free consultation' },
  { icon: <Activity size={22} />,    bg: '#EFF6FF', color: '#2563EB', title: 'Lab Tests at Home',       desc: 'Up to 70% off' },
  { icon: <Users size={22} />,       bg: '#FFFBEB', color: '#D97706', title: '50,000+ Customers',       desc: 'Trusted since 2005' },
];

const STORE_ADDRESS = 'F 41/2, Nafees Road, Batla House, Jamia Nagar, New Delhi - 110025';
const GOOGLE_MAPS_URL = 'https://maps.app.goo.gl/W4Qtps1fKbArBvz17';

/* ── Horizontal scroll carousel with prev/next arrows ── */
function ScrollRow({ children, title, link, linkLabel = 'See all', accent }) {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 260, behavior: 'smooth' });
  return (
    <section className="scroll-section">
      <div className="container">
        <div className="section__header">
          <h2 className="section__title" style={accent ? { color: accent } : {}}>
            {title}
          </h2>
          {link && (
            <Link to={link} className="section__link">
              {linkLabel} <ChevronRight size={14} />
            </Link>
          )}
        </div>
        <div className="scroll-row-wrap">
          <button className="scroll-row-btn scroll-row-btn--left"  onClick={() => scroll(-1)} aria-label="Scroll left"><ChevronLeft size={18} /></button>
          <div className="scroll-row" ref={ref}>{children}</div>
          <button className="scroll-row-btn scroll-row-btn--right" onClick={() => scroll(1)} aria-label="Scroll right"><ChevronRight size={18} /></button>
        </div>
      </div>
    </section>
  );
}

/* ── Animated counter ── */
function Counter({ target, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      observer.disconnect();
      let start = 0;
      const step = target / 50;
      const id = setInterval(() => {
        start = Math.min(start + step, target);
        setVal(Math.floor(start));
        if (start >= target) clearInterval(id);
      }, 28);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

export default function Home() {
  const [offers, setOffers]         = useState([]);
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured]     = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [featuredBrands, setFeaturedBrands] = useState([]);
  const [ayurvedaBrands, setAyurvedaBrands] = useState([]);

  useEffect(() => {
    getActiveOffers().then(r => setOffers(r.data.offers)).catch(() => {});
    getCategories().then(r => setCategories(r.data.categories)).catch(() => {});
    getProducts({ limit: 8, sort: 'newest' }).then(r => setNewArrivals(r.data.products)).catch(() => {});
    getProducts({ limit: 8, sort: 'price_asc' }).then(r => setFeatured(r.data.products)).catch(() => {});
    getBrands({ category: 'featured'  }).then(r => setFeaturedBrands(r.data.brands || [])).catch(() => {});
    getBrands({ category: 'ayurvedic' }).then(r => setAyurvedaBrands(r.data.brands || [])).catch(() => {});
  }, []);

  const WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER || '919990165925';

  return (
    <main>
      {/* ══════════════════════════════ HERO ══════════════════════════════ */}
      <section className="hero">
        <div className="hero__particles" aria-hidden="true">
          {[1,2,3,4,5,6,7,8].map(n => <div key={n} className={`hero__particle hero__particle--${n}`} />)}
        </div>
        <div className="hero__layout">
          <div className="hero-orbital" aria-hidden="true">
            <div className="hero-orbital__core">
              <svg viewBox="0 0 60 60" width="52" height="52" fill="none">
                <rect x="22" y="4"  width="16" height="52" rx="6" fill="white" opacity="0.95"/>
                <rect x="4"  y="22" width="52" height="16" rx="6" fill="white" opacity="0.95"/>
                <defs><linearGradient id="cg" x1="0" y1="0" x2="60" y2="60"><stop offset="0%" stopColor="#C0392B"/><stop offset="100%" stopColor="#1B8843"/></linearGradient></defs>
              </svg>
            </div>
            <div className="hero-orbital__ring hero-orbital__ring--1">
              <div className="hero-orbital__icon hero-orbital__icon--1"><Pill size={18} color="white" /></div>
              <div className="hero-orbital__icon hero-orbital__icon--1b"><Pill size={16} color="rgba(255,255,255,0.8)" /></div>
            </div>
            <div className="hero-orbital__ring hero-orbital__ring--2">
              <div className="hero-orbital__icon hero-orbital__icon--2"><Leaf size={19} color="#4ade80" /></div>
              <div className="hero-orbital__icon hero-orbital__icon--2b"><Heart size={17} color="#FC8181" /></div>
            </div>
            <div className="hero-orbital__ring hero-orbital__ring--3">
              <div className="hero-orbital__icon hero-orbital__icon--3"><Stethoscope size={18} color="white" /></div>
              <div className="hero-orbital__icon hero-orbital__icon--3b"><Syringe size={16} color="rgba(255,220,100,0.95)" /></div>
            </div>
          </div>
          <div className="hero__content">
            <span className="hero__tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 2v20M2 12h20"/></svg>
              Trusted Pharmacy Since 2005
            </span>
            <h1>Your Trusted<br /><span className="red">Neighbourhood</span><br />Pharmacy</h1>
            <p>Allopathic · Ayurvedic · Cosmetics · Baby Products · Surgical</p>
            <div className="hero__actions">
              <Link to="/products" className="btn btn--primary btn--lg">Shop Now <ChevronRight size={18} /></Link>
              <a href={`https://wa.me/${WHATSAPP}?text=Hi%2C%20I%20want%20to%20place%20an%20order`} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--lg">
                <MessageCircle size={18} /> Order on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════ TRUST STRIP ══════════════════════════ */}
      <section className="trust-strip">
        <div className="container">
          <div className="trust-strip__grid">
            {TRUST_FEATURES.map((f, i) => (
              <div key={i} className="trust-strip__item">
                <div className="trust-strip__icon" style={{ background: f.bg, color: f.color }}>{f.icon}</div>
                <div>
                  <div className="trust-strip__title">{f.title}</div>
                  <div className="trust-strip__desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════ OFFER BANNER ═════════════════════════ */}
      {offers.length > 0 && <OfferBanner offers={offers} />}

      {/* ══════════════════ STATS COUNTER BANNER ════════════════════════ */}
      <section className="stats-banner">
        <div className="container">
          <div className="stats-banner__grid">
            {[
              { val: 50000, suffix: '+', label: 'Happy Customers' },
              { val: 50000, suffix: '+', label: 'Products' },
              { val: 20, suffix: '+', label: 'Years of Trust' },
              { val: 100, suffix: '%', label: 'Genuine Medicines' },
            ].map((s, i) => (
              <div key={i} className="stats-banner__item">
                <div className="stats-banner__num"><Counter target={s.val} suffix={s.suffix} /></div>
                <div className="stats-banner__label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ PERSONAL CARE CATEGORIES ═══════════════════ */}
      <section className="section">
        <div className="container">
          <div className="section__header">
            <h2 className="section__title">Personal care</h2>
            <Link to="/products" className="section__link">See all <ChevronRight size={14} /></Link>
          </div>
          <div className="personal-care-grid">
            {PERSONAL_CARE_CATS.map((cat) => (
              <Link key={cat.slug + cat.label} to={`/products?category=${cat.slug}`} className="pc-cat-card">
                <div className="pc-cat-card__bg" style={{ background: cat.gradient }} />
                <span className="pc-cat-card__label">{cat.label}</span>
                <img
                  className="pc-cat-card__img"
                  src={cat.img}
                  alt={cat.label}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ FEATURED BRANDS CAROUSEL ═══════════════════ */}
      {featuredBrands.length > 0 && (
        <ScrollRow title="Featured brands" link="/products" accent="">
          {featuredBrands.map(b => (
            <Link key={b._id} to={`/products?brand=${encodeURIComponent(b.name)}`} className="brand-circle-card" title={b.name}>
              <div className="brand-circle-card__ring">
                {b.logoUrl
                  ? <img src={b.logoUrl} alt={b.name} className="brand-circle-card__img" />
                  : <span className="brand-circle-card__fb">{b.name.slice(0, 2).toUpperCase()}</span>
                }
              </div>
              <span className="brand-circle-card__name">{b.name}</span>
            </Link>
          ))}
        </ScrollRow>
      )}

      {/* ═══════════════════ SHOP BY CATEGORY ══════════════════════════ */}
      <section className="section section--gray">
        <div className="container">
          <div className="section__header">
            <h2 className="section__title">Shop by Category</h2>
            <Link to="/products" className="section__link">All Products <ChevronRight size={14} /></Link>
          </div>
          <div className="category-grid-v2">
            {categories.slice(0, 16).map(cat => {
              const cfg = CATEGORY_ICONS[cat.slug] || DEFAULT_CAT;
              return (
                <Link key={cat._id} to={`/products?category=${cat.slug}`} className="cat-tile">
                  <span className="cat-tile__icon" style={{ background: cfg.bg, color: cfg.color }}>{cfg.icon}</span>
                  <span className="cat-tile__name">{cat.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ PATHOLOGY / LAB TESTS ══════════════════════ */}
      <section className="section">
        <div className="container">
          <div className="section__header">
            <h2 className="section__title">Pathology Tests <span className="section__badge">Up to 70% off</span></h2>
            <Link to="/lab-tests" className="section__link">See all <ChevronRight size={14} /></Link>
          </div>
          <div className="lab-grid">
            {LAB_TESTS.map((t, i) => (
              <Link key={i} to="/lab-tests" className="lab-card">
                <div className="lab-card__icon">{t.icon}</div>
                <div className="lab-card__body">
                  <div className="lab-card__title">{t.label}</div>
                  <div className="lab-card__desc">{t.desc}</div>
                </div>
                <div className="lab-card__discount">
                  <span>{t.discount}</span>
                  <small>off</small>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ NEW ARRIVALS ════════════════════════════════ */}
      {newArrivals.length > 0 && (
        <section className="section section--gray">
          <div className="container">
            <div className="section__header">
              <h2 className="section__title">New Arrivals</h2>
              <Link to="/products?sort=newest" className="section__link">View All <ChevronRight size={14} /></Link>
            </div>
            <div className="product-grid">{newArrivals.map(p => <ProductCard key={p._id} product={p} />)}</div>
          </div>
        </section>
      )}

      {/* ════════════════════ AYURVEDA BRANDS ════════════════════════════ */}
      {ayurvedaBrands.length > 0 && (
        <ScrollRow title="Ayurveda top brands" link="/products?category=ayurveda" accent="#1B8843">
          {ayurvedaBrands.map(b => (
            <Link key={b._id} to={`/products?brand=${encodeURIComponent(b.name)}`} className="brand-ayur-card" title={b.name}>
              <div className="brand-ayur-card__box">
                {b.logoUrl
                  ? <img src={b.logoUrl} alt={b.name} className="brand-ayur-card__img" />
                  : <span className="brand-ayur-card__fb">{b.name.slice(0, 2).toUpperCase()}</span>
                }
              </div>
              <span className="brand-ayur-card__name">{b.name}</span>
            </Link>
          ))}
        </ScrollRow>
      )}

      {/* ════════════════════ BEST VALUE PRODUCTS ════════════════════════ */}
      {featured.length > 0 && (
        <section className="section section--gray">
          <div className="container">
            <div className="section__header">
              <h2 className="section__title">Best Value Medicines</h2>
              <Link to="/products?sort=price_asc" className="section__link">View All <ChevronRight size={14} /></Link>
            </div>
            <div className="product-grid">{featured.map(p => <ProductCard key={p._id} product={p} />)}</div>
          </div>
        </section>
      )}

      {/* ════════════════════ WHATSAPP CTA BANNER ════════════════════════ */}
      <section className="wa-cta-banner">
        <div className="container">
          <div className="wa-cta-banner__inner">
            <div className="wa-cta-banner__left">
              <div className="wa-cta-banner__icon">
                <MessageCircle size={32} color="#25D366" />
              </div>
              <div>
                <h3>Order on WhatsApp in seconds</h3>
                <p>Send us a photo of your prescription or just message the medicine name</p>
              </div>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP}?text=Hi%2C%20I%20want%20to%20place%20an%20order`}
              target="_blank" rel="noopener noreferrer"
              className="btn btn--whatsapp btn--lg"
            >
              <MessageCircle size={20} /> Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ════════════════════ STORE MAP ══════════════════════════════════ */}
      <section className="section map-section">
        <div className="container">
          <h2 className="section__title" style={{ justifyContent: 'center', marginBottom: '6px' }}>
            <MapPin size={20} /> Visit Us In-Store
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>{STORE_ADDRESS}</p>
          <div className="map-wrapper">
            <div className="map-card">
              <div className="map-card__pin"><MapPin size={24} /></div>
              <div className="map-card__content">
                <h3>Batla Medicos</h3>
                <p>{STORE_ADDRESS}</p>
                <div className="map-card__actions">
                  <a href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer" className="btn btn--primary"><Navigation size={16} /> Get Directions</a>
                  <a href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer" className="btn btn--outline"><ExternalLink size={16} /> Open in Maps</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
