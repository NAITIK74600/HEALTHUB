import { Link } from 'react-router-dom';
import { useState, useRef, useCallback } from 'react';
import { ShoppingCart, FileText, Heart, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import MedicineImage from './MedicineImage';

/* Tiny click-sound via Web Audio API — no external file needed */
function playCartSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(520, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.25);
  } catch { /* AudioContext blocked — silent fail */ }
}

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product._id);
  const [added, setAdded] = useState(false);   // shows ✓ tick briefly
  const [burst, setBurst] = useState(false);   // triggers button burst anim
  const [fly, setFly]     = useState(false);   // flying cart icon
  const timeoutRef = useRef(null);

  const discount = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const handleAddToCart = useCallback(() => {
    if (added) return;
    addItem(product);
    playCartSound();
    setAdded(true);
    setBurst(true);
    setFly(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setAdded(false);
      setBurst(false);
      setFly(false);
    }, 1200);
  }, [added, addItem, product]);

  return (
    <div className="product-card">
      <Link to={`/products/${product.slug}`}>
        <div className="product-card__image-wrap">
          <MedicineImage product={product} />
          {discount > 0 && (
            <span className="product-card__badge product-card__badge--discount">{discount}% OFF</span>
          )}
          {product.requiresPrescription && (
            <span className="product-card__badge product-card__badge--rx">
              <FileText size={9} /> Rx
            </span>
          )}
        </div>
        <div className="product-card__info">
          <p className="product-card__brand">{product.brand || 'Generic'}</p>
          <p className="product-card__name">{product.name}</p>
          <div className="product-card__pricing">
            <span className="product-card__price">₹{product.price}</span>
            {discount > 0 && <span className="product-card__mrp">₹{product.mrp}</span>}
            {discount > 0 && (
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--green)', marginLeft: 'auto' }}>
                Save {discount}%
              </span>
            )}
          </div>
        </div>
      </Link>
      <div className="product-card__footer-row">
        <button
          className={`product-card__add-btn${burst ? ' product-card__add-btn--burst' : ''}${added ? ' product-card__add-btn--added' : ''}`}
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          aria-label={`Add ${product.name} to cart`}
        >
          {/* Flying cart icon */}
          {fly && (
            <span className="cart-fly-icon" aria-hidden="true">
              <ShoppingCart size={15} />
            </span>
          )}
          {product.stock === 0
            ? 'Out of Stock'
            : added
              ? (<><Check size={15} strokeWidth={3} /> Added!</>)
              : (<><ShoppingCart size={15} /> Add to Cart</>)
          }
        </button>
        <button
          className={`product-card__wish-btn${wishlisted ? ' product-card__wish-btn--active' : ''}`}
          onClick={() => toggle(product)}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          title={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
      </div>
    </div>
  );
}

