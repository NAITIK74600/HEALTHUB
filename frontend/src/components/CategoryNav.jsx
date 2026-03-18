import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
      { label: 'Hair Oils & Lotions',        slug: 'lotion' },
      { label: 'Shampoos & Products',        slug: 'fmcg' },
      { label: 'Hair Creams & Serums',       slug: 'cream-ointment' },
      { label: 'Hair Growth Tablets',        slug: 'caps-tabs' },
    ],
  },
  {
    label: 'Fitness & Health',
    slug: 'fitness-health',
    children: [
      { label: 'Protein & Supplement Powders', slug: 'powder' },
      { label: 'Vitamin Capsules',           slug: 'caps-tabs' },
      { label: 'Softgel Supplements',        slug: 'softgel-capsules' },
      { label: 'Health Drinks & Syrups',     slug: 'liquids' },
    ],
  },
  {
    label: 'Sexual Wellness',
    slug: 'sexual-wellness',
    children: [
      { label: 'Contraceptives & Wellness',  slug: 'fmcg' },
      { label: 'Wellness Tablets',           slug: 'caps-tabs' },
    ],
  },
  {
    label: 'Vitamins & Nutrition',
    slug: 'vitamins-nutrition',
    children: [
      { label: 'Vitamin Tablets & Capsules', slug: 'caps-tabs' },
      { label: 'Vitamin Syrups',             slug: 'liquids' },
      { label: 'Nutrition Powders',          slug: 'powder' },
      { label: 'Softgel Vitamins',           slug: 'softgel-capsules' },
      { label: 'Nutritional Drops',          slug: 'drop' },
    ],
  },
  {
    label: 'Supports & Braces',
    slug: 'supports-braces',
    children: [
      { label: 'Surgical Supports',       slug: 'surgicals' },
      { label: 'Medical Equipment',        slug: 'pharma-misc' },
      { label: 'Devices & Containers',     slug: 'container' },
    ],
  },
  {
    label: 'Immunity Boosters',
    slug: 'immunity-boosters',
    children: [
      { label: 'Immunity Tablets',           slug: 'caps-tabs' },
      { label: 'Immunity Syrups',            slug: 'liquids' },
      { label: 'Health Powders',             slug: 'powder' },
    ],
  },
  {
    label: 'Homeopathy',
    slug: 'homeopathy',
    children: [
      { label: 'Homeopathic Drops',          slug: 'drop' },
      { label: 'Homeopathic Syrups',         slug: 'liquids' },
      { label: 'Homeopathic Tablets',        slug: 'caps-tabs' },
      { label: 'Homeopathic Powders',        slug: 'powder' },
    ],
  },
  {
    label: 'Ayurveda',
    slug: 'ayurveda',
    children: [
      { label: 'Ayurvedic Tablets',          slug: 'caps-tabs' },
      { label: 'Ayurvedic Syrups & Tonics',  slug: 'liquids' },
      { label: 'Ayurvedic Oils & Lotions',   slug: 'lotion' },
      { label: 'Ayurvedic Powders',          slug: 'powder' },
      { label: 'Herbal Creams',              slug: 'cream-ointment' },
    ],
  },
  {
    label: 'Skin Care',
    slug: 'skin-care',
    children: [
      { label: 'Creams & Ointments',         slug: 'cream-ointment' },
      { label: 'Lotions & Moisturizers',     slug: 'lotion' },
      { label: 'Skin Care Products',         slug: 'fmcg' },
    ],
  },
  {
    label: 'Baby Care',
    slug: 'baby-care',
    children: [
      { label: 'Baby Drops',                 slug: 'drop' },
      { label: 'Baby Powders',               slug: 'powder' },
      { label: 'Baby Creams & Lotions',      slug: 'lotion' },
    ],
  },
  {
    label: 'Diabetes Care',
    slug: 'diabetes-care',
    children: [
      { label: 'Diabetes Tablets',           slug: 'caps-tabs' },
      { label: 'Insulin & Injections',       slug: 'injection' },
      { label: 'Strips & Devices',           slug: 'surgicals' },
      { label: 'Diabetes Drops',             slug: 'drop' },
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
                className={`cat-nav__item${isActive ? ' cat-nav__item--active' : ''}`}
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
          {activeCat.children.map((child) => (
            <Link
              key={child.path || child.slug}
              to={child.path || `/products?category=${child.slug}`}
              className="cat-nav__dropdown-item"
              onClick={handleChildClick}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
