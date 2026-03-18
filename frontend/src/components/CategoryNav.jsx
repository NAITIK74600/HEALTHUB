import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

const CATEGORIES = [
  {
    label: 'Health Resource Center',
    slug: 'health-resource-center',
    children: [
      { label: 'All Diseases', slug: 'all-diseases' },
      { label: 'All Medicines', slug: 'all-medicines' },
      { label: 'Medicines by Therapeutic Class', slug: 'therapeutic-class' },
    ],
  },
  {
    label: 'Hair Care',
    slug: 'hair-care',
    children: [
      { label: 'Hair Oils', slug: 'hair-oils' },
      { label: 'Shampoos & Conditioners', slug: 'shampoos-conditioners' },
      { label: 'Hair Serums', slug: 'hair-serums' },
      { label: 'Hair Creams & Masks', slug: 'hair-creams-masks' },
      { label: 'Hair Colour', slug: 'hair-colour' },
      { label: 'Hair Growth Products', slug: 'hair-growth-products' },
      { label: 'Essential Oils', slug: 'essential-oils' },
    ],
  },
  {
    label: 'Fitness & Health',
    slug: 'fitness-health',
    children: [
      { label: 'Pre/Post Workout', slug: 'pre-post-workout' },
      { label: 'Mass Gainers', slug: 'mass-gainers' },
      { label: 'Plant Protein', slug: 'plant-protein' },
      { label: 'Smart Watches & Rings', slug: 'smart-watches-rings' },
      { label: 'Fat Burners', slug: 'fat-burners' },
    ],
  },
  {
    label: 'Sexual Wellness',
    slug: 'sexual-wellness',
    children: [
      { label: 'Condoms', slug: 'condoms' },
      { label: 'Lubricants & Massage Gels', slug: 'lubricants-massage-gels' },
      { label: 'Sexual Wellness Devices', slug: 'sexual-wellness-devices' },
      { label: 'Performance Enhancers', slug: 'performance-enhancers' },
      { label: 'Oral Contraceptives', slug: 'oral-contraceptives' },
    ],
  },
  {
    label: 'Vitamins & Nutrition',
    slug: 'vitamins-nutrition',
    children: [
      { label: 'Omega & Fish Oil & DHA', slug: 'omega-fish-oil-dha' },
      { label: 'Fish Oil', slug: 'fish-oil' },
      { label: 'Cod Liver Oil', slug: 'cod-liver-oil' },
      { label: 'Flax Seed Oil', slug: 'flax-seed-oil' },
      { label: 'Vitamin D', slug: 'vitamin-d' },
      { label: 'Vitamin B', slug: 'vitamin-b' },
      { label: 'Vitamin C', slug: 'vitamin-c' },
      { label: 'Vitamin A', slug: 'vitamin-a' },
      { label: 'Minerals', slug: 'minerals' },
      { label: 'Calcium', slug: 'calcium' },
      { label: 'Global Supplements', slug: 'global-supplements' },
      { label: 'Hair & Skin Supplements', slug: 'hair-skin-supplements' },
      { label: 'Specialty Supplements', slug: 'specialty-supplements' },
      { label: 'Antioxidants', slug: 'antioxidants' },
      { label: 'Vitamin K', slug: 'vitamin-k' },
      { label: 'Gummies Vitamins', slug: 'gummies-vitamins' },
    ],
  },
  {
    label: 'Supports & Braces',
    slug: 'supports-braces',
    children: [
      { label: 'Back & Abdomen Support', slug: 'back-abdomen-support' },
      { label: 'Ankle, Foot & Leg Support', slug: 'ankle-foot-leg-support' },
      { label: 'Knee Support', slug: 'knee-support' },
      { label: 'Neck & Shoulder Support', slug: 'neck-shoulder-support' },
    ],
  },
  {
    label: 'Immunity Boosters',
    slug: 'immunity-boosters',
    children: [
      { label: 'Chyawanprash', slug: 'chyawanprash' },
      { label: 'Antioxidant Supplements', slug: 'antioxidant-supplements' },
      { label: 'Ayurvedic Supplements', slug: 'ayurvedic-supplements' },
      { label: 'Herbal Tea', slug: 'herbal-tea' },
      { label: 'Immunity Tablets', slug: 'immunity-tablets' },
    ],
  },
  {
    label: 'Homeopathy',
    slug: 'homeopathy',
    children: [
      { label: 'Homeopathic Medicines', slug: 'homeopathic-medicines' },
      { label: 'Homeopathic Drops', slug: 'homeopathic-drops' },
      { label: 'Homeopathic Creams', slug: 'homeopathic-creams' },
    ],
  },
  {
    label: 'Ayurveda',
    slug: 'ayurveda',
    children: [
      { label: 'Patanjali', slug: 'patanjali' },
      { label: 'Dabur', slug: 'dabur' },
      { label: 'Himalaya', slug: 'himalaya' },
      { label: 'Hamdard', slug: 'hamdard' },
      { label: 'Ayurvedic Tonics', slug: 'ayurvedic-tonics' },
      { label: 'Ayurvedic Oils', slug: 'ayurvedic-oils' },
    ],
  },
  {
    label: 'Skin Care',
    slug: 'skin-care',
    children: [
      { label: 'Face Wash & Cleansers', slug: 'face-wash-cleansers' },
      { label: 'Moisturizers', slug: 'moisturizers' },
      { label: 'Sunscreen', slug: 'sunscreen' },
      { label: 'Acne & Pimple Care', slug: 'acne-pimple-care' },
      { label: 'Anti Ageing', slug: 'anti-ageing' },
      { label: 'Face Serums', slug: 'face-serums' },
    ],
  },
  {
    label: 'Baby Care',
    slug: 'baby-care',
    children: [
      { label: 'Baby Food & Nutrition', slug: 'baby-food-nutrition' },
      { label: 'Diapers & Wipes', slug: 'diapers-wipes' },
      { label: 'Baby Skincare', slug: 'baby-skincare' },
      { label: 'Baby Medicines', slug: 'baby-medicines' },
    ],
  },
  {
    label: 'Diabetes Care',
    slug: 'diabetes-care',
    children: [
      { label: 'Glucometers & Strips', slug: 'glucometers-strips' },
      { label: 'Insulin Syringes', slug: 'insulin-syringes' },
      { label: 'Sugar-free Products', slug: 'sugar-free-products' },
      { label: 'Diabetic Footwear', slug: 'diabetic-footwear' },
    ],
  },
];

export default function CategoryNav() {
  const [activeIdx, setActiveIdx] = useState(null);
  const navRef = useRef(null);
  const closeTimer = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setActiveIdx(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const open = (idx) => {
    clearTimeout(closeTimer.current);
    setActiveIdx(idx);
  };

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setActiveIdx(null), 120);
  };

  return (
    <nav className="cat-nav" ref={navRef} aria-label="Category navigation">
      <div className="cat-nav__scroll">
        {CATEGORIES.map((cat, idx) => (
          <div
            key={cat.slug}
            className={`cat-nav__item ${activeIdx === idx ? 'cat-nav__item--active' : ''}`}
            onMouseEnter={() => open(idx)}
            onMouseLeave={scheduleClose}
          >
            <Link
              to={`/products?category=${cat.slug}`}
              className="cat-nav__label"
              onClick={() => setActiveIdx(null)}
            >
              {cat.label}
              {cat.children?.length > 0 && (
                <ChevronDown size={13} className="cat-nav__chevron" />
              )}
            </Link>

            {cat.children?.length > 0 && activeIdx === idx && (
              <div
                className="cat-nav__dropdown"
                onMouseEnter={() => open(idx)}
                onMouseLeave={scheduleClose}
              >
                {cat.children.map((child) => (
                  <Link
                    key={child.slug}
                    to={`/products?category=${child.slug}`}
                    className="cat-nav__dropdown-item"
                    onClick={() => setActiveIdx(null)}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}
