import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

// path = direct route link; slug = /products?category=slug
const CATEGORIES = [
  {
    label: 'Health Resource Center',
    slug: 'allopathic',
    children: [
      { label: 'All Diseases',               path: '/diseases' },
      { label: 'All Medicines',              path: '/products' },
      { label: 'Capsules & Tablets',         slug: 'caps-tabs' },
      { label: 'Liquids & Syrups',           slug: 'liquids' },
      { label: 'Generic Medicines',          slug: 'generic' },
      { label: 'High Value Medicines',       slug: 'high-value' },
    ],
  },
  {
    label: 'Hair Care',
    slug: 'hair-care',
    children: [
      { label: 'Hair Oils & Lotions',          slug: 'hair-care' },
      { label: 'Shampoos & Products',          slug: 'hair-care' },
      { label: 'Hair Creams & Serums',         slug: 'hair-care' },
      { label: 'Hair Growth Tablets',          slug: 'hair-care' },
    ],
  },
  {
    label: 'Fitness & Health',
    slug: 'fitness-health',
    children: [
      { label: 'Protein & Supplement Powders', slug: 'fitness-health' },
      { label: 'Vitamin Capsules',             slug: 'fitness-health' },
      { label: 'Softgel Supplements',          slug: 'fitness-health' },
      { label: 'Health Drinks & Syrups',       slug: 'fitness-health' },
    ],
  },
  {
    label: 'Sexual Wellness',
    slug: 'sexual-wellness',
    children: [
      { label: 'Contraceptives & Wellness',    slug: 'sexual-wellness' },
      { label: 'Wellness Tablets',             slug: 'sexual-wellness' },
    ],
  },
  {
    label: 'Vitamins & Nutrition',
    slug: 'vitamins-nutrition',
    children: [
      { label: 'Vitamin Tablets & Capsules',   slug: 'vitamins-nutrition' },
      { label: 'Vitamin Syrups',               slug: 'vitamins-nutrition' },
      { label: 'Nutrition Powders',            slug: 'vitamins-nutrition' },
      { label: 'Softgel Vitamins',             slug: 'vitamins-nutrition' },
      { label: 'Nutritional Drops',            slug: 'vitamins-nutrition' },
    ],
  },
  {
    label: 'Supports & Braces',
    slug: 'supports-braces',
    children: [
      { label: 'Surgical Supports',            slug: 'supports-braces' },
      { label: 'Medical Equipment',            slug: 'supports-braces' },
      { label: 'Devices & Containers',         slug: 'supports-braces' },
    ],
  },
  {
    label: 'Immunity Boosters',
    slug: 'immunity-boosters',
    children: [
      { label: 'Immunity Tablets',             slug: 'immunity-boosters' },
      { label: 'Immunity Syrups',              slug: 'immunity-boosters' },
      { label: 'Health Powders',               slug: 'immunity-boosters' },
    ],
  },
  {
    label: 'Homeopathy',
    slug: 'homeopathy',
    children: [
      { label: 'Homeopathic Drops',            slug: 'homeopathy' },
      { label: 'Homeopathic Syrups',           slug: 'homeopathy' },
      { label: 'Homeopathic Tablets',          slug: 'homeopathy' },
      { label: 'Homeopathic Powders',          slug: 'homeopathy' },
    ],
  },
  {
    label: 'Ayurveda',
    slug: 'ayurveda',
    children: [
      { label: 'Ayurvedic Tablets',            slug: 'ayurveda' },
      { label: 'Ayurvedic Syrups & Tonics',    slug: 'ayurveda' },
      { label: 'Ayurvedic Oils & Lotions',     slug: 'ayurveda' },
      { label: 'Ayurvedic Powders',            slug: 'ayurveda' },
      { label: 'Herbal Creams',                slug: 'ayurveda' },
    ],
  },
  {
    label: 'Skin Care',
    slug: 'skin-care',
    children: [
      { label: 'Creams & Ointments',           slug: 'skin-care' },
      { label: 'Lotions & Moisturizers',       slug: 'skin-care' },
      { label: 'Skin Care Products',           slug: 'skin-care' },
    ],
  },
  {
    label: 'Baby Care',
    slug: 'baby-care',
    children: [
      { label: 'Baby Drops',                   slug: 'baby-care' },
      { label: 'Baby Powders',                 slug: 'baby-care' },
      { label: 'Baby Creams & Lotions',        slug: 'baby-care' },
    ],
  },
  {
    label: 'Diabetes Care',
    slug: 'diabetes-care',
    children: [
      { label: 'Diabetes Tablets',             slug: 'diabetes-care' },
      { label: 'Insulin & Injections',         slug: 'diabetes-care' },
      { label: 'Strips & Devices',             slug: 'diabetes-care' },
      { label: 'Diabetes Drops',               slug: 'diabetes-care' },
    ],
  },
];

export default function CategoryNav() {
  const [activeIdx, setActiveIdx] = useState(null);
  const [dropPos, setDropPos] = useState({ left: 0, top: 0 });
  const navRef = useRef(null);
  const dropdownRef = useRef(null);
  const itemRefs = useRef([]);
  const closeTimer = useRef(null);

  // ── URL-based "currently browsing" highlight ──────────────────────────────
  const location = useLocation();
  const currentCatSlug = new URLSearchParams(location.search).get('category') || '';

  // Find which top-level nav item owns the active slug (direct parent match OR child match)
  const browsingIdx = CATEGORIES.findIndex(cat =>
    cat.slug === currentCatSlug ||
    cat.children?.some(child => child.slug === currentCatSlug)
  );

  // Close on outside click or scroll
  useEffect(() => {
    const close = (e) => {
      const inNav = navRef.current && navRef.current.contains(e.target);
      const inDrop = dropdownRef.current && dropdownRef.current.contains(e.target);
      if (!inNav && !inDrop) setActiveIdx(null);
    };
    const closeOnScroll = () => setActiveIdx(null);
    // Use 'click' (not 'mousedown') so Link navigation fires first before the dropdown closes
    document.addEventListener('click', close);
    window.addEventListener('scroll', closeOnScroll, { passive: true });
    return () => {
      document.removeEventListener('click', close);
      window.removeEventListener('scroll', closeOnScroll);
    };
  }, []);

  const openAt = useCallback((idx) => {
    clearTimeout(closeTimer.current);
    const el = itemRefs.current[idx];
    if (el) {
      const rect = el.getBoundingClientRect();
      setDropPos({ left: rect.left, top: rect.bottom }); // fixed positioning
    }
    setActiveIdx(idx);
  }, []);

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setActiveIdx(null), 150);
  };

  const toggle = (idx, hasChildren, e) => {
    if (!hasChildren) return; // no children → let the Link navigate normally
    e.preventDefault();
    if (activeIdx === idx) {
      setActiveIdx(null);
    } else {
      openAt(idx);
    }
  };

  const handleChildClick = () => {
    setActiveIdx(null);
  };

  const activeCat = activeIdx !== null ? CATEGORIES[activeIdx] : null;

  return (
    <>
      <nav className="cat-nav" ref={navRef} aria-label="Category navigation">
        <div className="cat-nav__scroll">
          {CATEGORIES.map((cat, idx) => {
            const hasChildren = cat.children?.length > 0;
            const isActive = activeIdx === idx;
            return (
              <div
                key={cat.slug}
                className={`cat-nav__item${
                  isActive || browsingIdx === idx ? ' cat-nav__item--active' : ''
                }${browsingIdx === idx && activeIdx !== idx ? ' cat-nav__item--browsing' : ''}`}
                ref={el => { itemRefs.current[idx] = el; }}
                onMouseEnter={() => openAt(idx)}
                onMouseLeave={scheduleClose}
              >
                <Link
                  to={cat.path || `/products?category=${cat.slug}`}
                  className="cat-nav__label"
                  onClick={(e) => toggle(idx, hasChildren, e)}
                >
                  {cat.label}
                  {hasChildren && (
                    <ChevronDown size={13} className="cat-nav__chevron" />
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Dropdown rendered in a portal-style fixed element — escapes ALL overflow clipping */}
      {activeCat?.children?.length > 0 && (
        <div
          className="cat-nav__dropdown"
          ref={dropdownRef}
          style={{ left: dropPos.left, top: dropPos.top }}
          onMouseEnter={() => { clearTimeout(closeTimer.current); }}
          onMouseLeave={scheduleClose}
          onClick={e => e.stopPropagation()}
        >
          {activeCat.children.map((child) => {
            const childSlug = child.slug || '';
            const isChildActive = childSlug && childSlug === currentCatSlug;
            return (
              <Link
                key={child.path || child.slug}
                to={child.path || `/products?category=${child.slug}`}
                className={`cat-nav__dropdown-item${isChildActive ? ' cat-nav__dropdown-item--active' : ''}`}
                onClick={handleChildClick}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
