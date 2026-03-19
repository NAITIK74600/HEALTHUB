import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ShoppingCart, FileText, Heart, Star } from 'lucide-react';
import { getProductBySlug, getRelatedProducts } from '../api/products';
import { getProductReviews, submitReview } from '../api/reviews';
import MedicineImage from '../components/MedicineImage';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ProductCard from '../components/ProductCard';

function StarRating({ value, onChange, readonly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-rating" aria-label={`Rating: ${value} out of 5`}>
      {[1,2,3,4,5].map(star => (
        <button
          key={star}
          type="button"
          className={`star-rating__star${(hover || value) >= star ? ' star-rating__star--active' : ''}`}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          disabled={readonly}
          aria-label={`${star} star`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImg, setMainImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [related, setRelated] = useState({ brandRelated: [], categoryRelated: [] });

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewMeta, setReviewMeta] = useState({ avgRating: 0, ratingCount: 0, total: 0 });
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPages, setReviewPages] = useState(1);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    setMainImg(0);
    setQty(1);
    setMyRating(0);
    setMyComment('');
    getProductBySlug(slug)
      .then(r => {
        setProduct(r.data);
        // Fetch related by brand & category
        getRelatedProducts(r.data._id)
          .then(res => setRelated(res.data))
          .catch(() => {});
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    getProductReviews(product._id, reviewPage)
      .then(r => {
        setReviews(r.data.reviews);
        setReviewPages(r.data.pages);
        setReviewMeta({ avgRating: r.data.avgRating, ratingCount: r.data.ratingCount, total: r.data.total });
      })
      .catch(() => {});
  }, [product, reviewPage]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!myRating) return toast.error('Please select a rating.');
    setSubmitting(true);
    try {
      await submitReview({ productId: product._id, rating: myRating, comment: myComment });
      toast.success('Review submitted!');
      setMyRating(0);
      setMyComment('');
      // Refresh reviews
      const r = await getProductReviews(product._id, 1);
      setReviews(r.data.reviews);
      setReviewPages(r.data.pages);
      setReviewMeta({ avgRating: r.data.avgRating, ratingCount: r.data.ratingCount, total: r.data.total });
      setReviewPage(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="spinner" style={{ padding: '80px 0', textAlign: 'center' }}>Loading…</div>;
  if (!product) return <div className="empty-state">Product not found.</div>;

  const discount = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const wishlisted = isWishlisted(product._id);
  const useInConditions = product.description?.trim() || 'Consult your doctor/pharmacist for proper use.';
  const sideEffectsText = product.sideEffects?.trim() || 'No common side effects listed. If any discomfort occurs, consult your doctor.';

  return (
    <main>
      <div className="product-detail container">
        <div className="product-detail__layout">
          {/* Images */}
          <div className="product-detail__images">
            <div className="product-detail__main-img">
              <MedicineImage
                product={product}
                idx={mainImg}
                className="product-detail__img-el"
              />
            </div>
            {product.images?.length > 1 && (
              <div className="product-detail__thumbnails">
                {product.images.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`${product.name} ${i + 1}`}
                    className={i === mainImg ? 'active' : ''}
                    onClick={() => setMainImg(i)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="product-detail__info">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <h1>{product.name}</h1>
                {product.brand && <p className="product-detail__brand">{product.brand}</p>}
                {product.company && <p className="product-detail__company" style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 2 }}>by {product.company}</p>}
              </div>
              <button
                className={`product-detail__wish-btn${wishlisted ? ' active' : ''}`}
                onClick={() => toggle(product)}
                title={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
              >
                <Heart size={22} fill={wishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Rating summary */}
            {reviewMeta.ratingCount > 0 && (
              <div className="product-detail__rating-summary">
                <span className="product-detail__avg-rating">★ {reviewMeta.avgRating}</span>
                <span className="product-detail__rating-count">({reviewMeta.ratingCount} review{reviewMeta.ratingCount !== 1 ? 's' : ''})</span>
              </div>
            )}

            <div className="product-detail__pricing">
              <span className="product-detail__price">₹{product.price}</span>
              {discount > 0 && (
                <>
                  <span className="product-detail__mrp">₹{product.mrp}</span>
                  <span className="product-detail__discount">{discount}% OFF</span>
                </>
              )}
            </div>

            {product.requiresPrescription && (
              <div className="rx-notice">
                <FileText size={16} /> Prescription required — upload at checkout.
              </div>
            )}

            <p className={`product-detail__stock ${product.stock === 0 ? 'out' : product.stock <= 5 ? 'low' : ''}`}>
              {product.stock === 0
                ? 'Currently unavailable'
                : product.stock <= 5
                  ? 'Available - limited units'
                  : 'Available for order'}
            </p>

            {product.salt && (
              <div className="product-detail__salt">
                <span className="product-detail__salt-label">Composition:</span>
                <span className="product-detail__salt-value">{product.salt}</span>
              </div>
            )}

            <div className="product-detail__desc">
              <p><strong>Use in Conditions:</strong> {useInConditions}</p>
              <p style={{ marginTop: 8 }}><strong>Side Effects:</strong> {sideEffectsText}</p>
            </div>

            <div className="product-detail__cart-row">
              <div className="qty-control">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))}>+</button>
              </div>
              <button
                className="btn btn--primary"
                disabled={product.stock === 0}
                onClick={() => addItem(product, qty)}
                style={{ flex: 1 }}
              >
                <ShoppingCart size={18} /> Add to Cart
              </button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.brandRelated.length > 0 && (
          <section className="product-detail__related">
            <h2>More from {product.brand}</h2>
            <div className="related-scroll">
              {related.brandRelated.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </section>
        )}
        {related.categoryRelated.length > 0 && (
          <section className="product-detail__related">
            <h2>Similar Products</h2>
            <div className="related-scroll">
              {related.categoryRelated.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </section>
        )}

        {/* Reviews */}
        <section className="product-detail__reviews">
          <div className="reviews__header">
            <h2>Customer Reviews</h2>
            {reviewMeta.ratingCount > 0 && (
              <div className="reviews__summary">
                <span className="reviews__avg">{reviewMeta.avgRating}</span>
                <div>
                  <StarRating value={Math.round(reviewMeta.avgRating)} readonly />
                  <span className="reviews__count">{reviewMeta.ratingCount} review{reviewMeta.ratingCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
            )}
          </div>

          {/* Write review form (logged-in users only) */}
          {user && (
            <form className="review-form" onSubmit={handleReviewSubmit}>
              <h3>Write a Review</h3>
              <div className="review-form__rating-row">
                <span>Your rating:</span>
                <StarRating value={myRating} onChange={setMyRating} />
              </div>
              <textarea
                className="review-form__textarea"
                placeholder="Share your experience with this product (optional)"
                value={myComment}
                onChange={e => setMyComment(e.target.value)}
                maxLength={500}
                rows={3}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                  {myComment.length}/500 — Only verified buyers can submit reviews
                </span>
                <button className="btn btn--primary" type="submit" disabled={submitting || !myRating}>
                  {submitting ? 'Submitting…' : 'Submit Review'}
                </button>
              </div>
            </form>
          )}

          {/* Review list */}
          {reviews.length === 0 && !user && (
            <p style={{ color: 'var(--gray-400)', padding: '20px 0' }}>No reviews yet. Be the first to review this product!</p>
          )}
          <div className="review-list">
            {reviews.map(r => (
              <div key={r._id} className="review-item">
                <div className="review-item__top">
                  <span className="review-item__author">{r.user?.name || 'Customer'}</span>
                  <StarRating value={r.rating} readonly />
                  <span className="review-item__date">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                {r.comment && <p className="review-item__comment">{r.comment}</p>}
              </div>
            ))}
          </div>

          {reviewPages > 1 && (
            <div className="pagination" style={{ marginTop: 16 }}>
              <button disabled={reviewPage <= 1} onClick={() => setReviewPage(p => p - 1)}>← Prev</button>
              <span>{reviewPage} / {reviewPages}</span>
              <button disabled={reviewPage >= reviewPages} onClick={() => setReviewPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
