import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck, MapPin, ShieldCheck, Clock, ChevronRight, ChevronLeft,
  Navigation, ExternalLink,
  Stethoscope, Pill, Leaf, Sparkles, Baby, Scissors, Hospital, Star, Heart, Syringe,
  Droplets, Droplet, FlaskConical, Wind, Thermometer, ShoppingBag, Box,
  TestTube, Package, GlassWater, Gem, LayoutGrid, Activity,
  SmilePlus, Users, Zap, Shield, Award, FileText, BadgePercent,
} from 'lucide-react';
import { getActiveOffers } from '../api/offers';
import { getCategories } from '../api/categories';
import { getProducts } from '../api/products';
import { getBrands } from '../api/brands';
import { getLabTests } from '../api/lab';
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

const HEALTH_TIPS = [
  '💊 Always complete your antibiotic course even if you feel better',
  '🥤 Drink 8–10 glasses of water daily to stay hydrated',
  '🩺 Check blood pressure regularly after age 40',
  '🌿 Ayurvedic herbs can complement modern medicine safely',
  '💉 Keep your vaccine schedule up to date',
  '🍎 Eat 5 portions of fruits & vegetables every day',
  '😴 7–8 hours of sleep boosts your immune system',
  '🚶 30 minutes of daily walking prevents diabetes & heart disease',
  '🧴 Always read medicine labels and check expiry before use',
  '🔬 Annual full-body checkup helps catch problems early',
];

const WHY_CHOOSE = [
  { icon: <Award size={26} />,       bg: '#FEF2F2', color: '#C0392B', title: '20+ Years of Trust',   desc: 'Serving Jamia Nagar since 2005' },
  { icon: <ShieldCheck size={26} />, bg: '#F0FBF4', color: '#1B8843', title: '100% Authentic',        desc: 'Direct from licensed distributors' },
  { icon: <Truck size={26} />,       bg: '#EFF6FF', color: '#2563EB', title: 'Fast Delivery',         desc: 'Same-day delivery in Jamia Nagar' },
  { icon: <Stethoscope size={26} />, bg: '#FDF4FF', color: '#9333EA', title: 'Free Consultation',     desc: 'Expert pharmacists, no charge' },
  { icon: <Clock size={26} />,       bg: '#FFFBEB', color: '#D97706', title: 'Open 7 Days a Week',   desc: 'Monday to Sunday, 9 AM – 9 PM' },
  { icon: <Heart size={26} />,       bg: '#FFF0F6', color: '#DB2777', title: 'Patient Care First',   desc: 'Your wellbeing is our mission' },
];

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
  const [countdown, setCountdown]   = useState({ h: 0, m: 0, s: 0 });
  const [labTests, setLabTests]       = useState([]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(); end.setHours(23, 59, 59, 999);
      const diff = Math.max(0, end - now);
      setCountdown({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    getActiveOffers().then(r => setOffers(r.data.offers)).catch(() => {});
    getCategories().then(r => setCategories(r.data.categories)).catch(() => {});
    getProducts({ limit: 8, sort: 'newest' }).then(r => setNewArrivals(r.data.products)).catch(() => {});
    getProducts({ limit: 8, sort: 'price_asc' }).then(r => setFeatured(r.data.products)).catch(() => {});
    getBrands({ category: 'featured'  }).then(r => setFeaturedBrands(r.data.brands || [])).catch(() => {});
    getBrands({ category: 'ayurvedic' }).then(r => setAyurvedaBrands(r.data.brands || [])).catch(() => {});
    getLabTests({ limit: 6 }).then(r => setLabTests(r.data.tests || [])).catch(() => {});
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
              <Link to="/prescriptions" className="btn btn--ghost btn--lg">
                <FileText size={18} /> Upload Prescription
              </Link>
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

      {/* ════════════ HEALTH TIPS TICKER ════════════════════════════════ */}
      <div className="health-ticker">
        <div className="health-ticker__label"><Sparkles size={13} /> Health Tips</div>
        <div className="health-ticker__track">
          <div className="health-ticker__inner">
            {[...HEALTH_TIPS, ...HEALTH_TIPS].map((tip, i) => (
              <span key={i} className="health-ticker__item">{tip}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════ DEAL OF THE DAY ════════════════════════════════════ */}
      <section className="deal-section">
        <div className="container">
          <div className="deal-card">
            <div className="deal-card__badge"><BadgePercent size={16} /> Deal of the Day</div>
            <div className="deal-card__content">
              <div className="deal-card__text">
                <h2>Up to <span>70% OFF</span></h2>
                <p>On selected medicines, lab tests &amp; health essentials. Don't miss out!</p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.2rem' }}>
                  <Link to="/products" className="btn btn--white btn--lg">Shop Now <ChevronRight size={16} /></Link>
                  <Link to="/lab" className="btn btn--outline-white btn--lg">Book Lab Test</Link>
                </div>
              </div>
              <div className="deal-card__timer">
                <p className="deal-card__timer-label">Ends in</p>
                <div className="deal-card__timer-grid">
                  <div className="deal-card__timer-unit">
                    <span>{String(countdown.h).padStart(2, '0')}</span>
                    <small>HRS</small>
                  </div>
                  <div className="deal-card__timer-sep">:</div>
                  <div className="deal-card__timer-unit">
                    <span>{String(countdown.m).padStart(2, '0')}</span>
                    <small>MIN</small>
                  </div>
                  <div className="deal-card__timer-sep">:</div>
                  <div className="deal-card__timer-unit">
                    <span>{String(countdown.s).padStart(2, '0')}</span>
                    <small>SEC</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ PATHOLOGY TESTS ══════════════════════════════════ */}
      {labTests.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section__header">
              <h2 className="section__title">Pathology Tests <span className="lab-section__badge">UP TO 70% OFF</span></h2>
              <Link to="/lab" className="section__link">See all <ChevronRight size={14} /></Link>
            </div>
            <div className="lab-home-grid">
              {labTests.map(test => (
                <Link key={test._id} to="/lab" className="lab-home-card">
                  <div className="lab-home-card__icon">
                    <FlaskConical size={22} />
                  </div>
                  <div className="lab-home-card__body">
                    <div className="lab-home-card__name">{test.name}</div>
                    {test.parameters?.length > 0 && (
                      <div className="lab-home-card__params">{test.parameters.slice(0, 3).join(', ')}</div>
                    )}
                  </div>
                  <div className="lab-home-card__price">₹{test.price}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════ WHY CHOOSE US ══════════════════════════════════════ */}
      <section className="section why-section">
        <div className="container">
          <div className="section__header" style={{ flexDirection: 'column', gap: '4px', textAlign: 'center' }}>
            <h2 className="section__title" style={{ justifyContent: 'center' }}>Why Choose Batla Medicos?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Trusted by 50,000+ families in Jamia Nagar</p>
          </div>
          <div className="why-grid">
            {WHY_CHOOSE.map((w, i) => (
              <div key={i} className="why-card">
                <div className="why-card__icon" style={{ background: w.bg, color: w.color }}>{w.icon}</div>
                <h4 className="why-card__title">{w.title}</h4>
                <p className="why-card__desc">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ STORE MAP STRIP ═══════════════════════════ */}
      <div className="map-strip">
        <div className="map-strip__inner">
          <div className="map-strip__left">
            <div className="map-strip__pin"><MapPin size={18} /></div>
            <div>
              <div className="map-strip__name">Batla Medicos — Batla House, Jamia Nagar</div>
              <div className="map-strip__addr">{STORE_ADDRESS}</div>
            </div>
          </div>
          <div className="map-strip__actions">
            <a href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer" className="map-strip__btn map-strip__btn--primary">
              <Navigation size={14} /> Get Directions
            </a>
            <a href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer" className="map-strip__btn map-strip__btn--outline">
              <ExternalLink size={14} /> Open Maps
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
