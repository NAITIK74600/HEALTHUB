/**
 * Fly-to-cart animation — clones the product image and animates it
 * flying to the cart icon in the navbar.
 */
export function flyToCart(sourceEl) {
  const cartBtn = document.querySelector('.navbar__cart-btn');
  if (!cartBtn || !sourceEl) return;

  const srcRect = sourceEl.getBoundingClientRect();
  const destRect = cartBtn.getBoundingClientRect();

  // Don't animate if source is off-screen
  if (srcRect.width === 0 || srcRect.height === 0) return;

  const ghost = document.createElement('div');
  ghost.className = 'fly-to-cart-ghost';

  // Grab image src for the ghost
  const imgTag = sourceEl.tagName === 'IMG' ? sourceEl : sourceEl.querySelector('img');
  if (imgTag && imgTag.src) {
    const img = document.createElement('img');
    img.src = imgTag.src;
    img.alt = '';
    img.style.cssText = 'width:100%;height:100%;object-fit:contain;border-radius:inherit;';
    ghost.appendChild(img);
  } else {
    ghost.style.background = 'linear-gradient(135deg,#C0392B,#e74c3c)';
    ghost.textContent = '💊';
    ghost.style.cssText += ';font-size:28px;display:flex;align-items:center;justify-content:center;';
  }

  const size = Math.min(srcRect.width, srcRect.height, 72);
  const startX = srcRect.left + srcRect.width / 2 - size / 2;
  const startY = srcRect.top + srcRect.height / 2 - size / 2;
  const endX = destRect.left + destRect.width / 2 - 16;
  const endY = destRect.top + destRect.height / 2 - 16;

  // Initial state — position at source, no transition yet
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${startX}px`,
    top: `${startY}px`,
    width: `${size}px`,
    height: `${size}px`,
    zIndex: '99999',
    pointerEvents: 'none',
    borderRadius: '50%',
    overflow: 'hidden',
    boxShadow: '0 6px 24px rgba(0,0,0,0.30)',
    transition: 'none',
    transform: 'scale(1)',
    opacity: '1',
  });

  document.body.appendChild(ghost);

  // Double RAF — guarantees browser has painted initial state before starting transition
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      Object.assign(ghost.style, {
        transition: 'left 0.6s cubic-bezier(0.25,0.46,0.45,0.94), top 0.6s cubic-bezier(0.25,0.46,0.45,0.94), width 0.6s ease, height 0.6s ease, opacity 0.6s ease, transform 0.6s ease',
        left: `${endX}px`,
        top: `${endY}px`,
        width: '32px',
        height: '32px',
        opacity: '0.15',
        transform: 'scale(0.3) rotate(720deg)',
      });
    });
  });

  // Cleanup + cart bounce after animation completes
  const DURATION = 650;
  setTimeout(() => {
    if (ghost.parentNode) ghost.remove();
    cartBtn.classList.add('navbar__cart-btn--bounce');
    setTimeout(() => cartBtn.classList.remove('navbar__cart-btn--bounce'), 500);
  }, DURATION);
}
