/**
 * Fly-to-cart animation — clones the product image and animates it
 * in an arc towards the cart icon in the navbar.
 */
export function flyToCart(sourceEl) {
  const cartBtn = document.querySelector('.navbar__cart-btn');
  if (!cartBtn || !sourceEl) return;

  const srcRect = sourceEl.getBoundingClientRect();
  const destRect = cartBtn.getBoundingClientRect();

  // Create a flying clone
  const ghost = document.createElement('div');
  ghost.className = 'fly-to-cart-ghost';

  // Try to grab actual image src, otherwise snapshot via background
  const imgTag = sourceEl.tagName === 'IMG' ? sourceEl : sourceEl.querySelector('img');
  if (imgTag && imgTag.src) {
    const img = document.createElement('img');
    img.src = imgTag.src;
    img.alt = '';
    img.style.cssText = 'width:100%;height:100%;object-fit:contain;border-radius:inherit;';
    ghost.appendChild(img);
  } else {
    // Fallback: clone the node
    const clone = sourceEl.cloneNode(true);
    clone.style.cssText = 'width:100%;height:100%;pointer-events:none;';
    ghost.appendChild(clone);
  }

  const size = Math.min(srcRect.width, srcRect.height, 80);
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${srcRect.left + srcRect.width / 2 - size / 2}px`,
    top: `${srcRect.top + srcRect.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    zIndex: '99999',
    pointerEvents: 'none',
    borderRadius: '50%',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
    transition: 'none',
  });

  document.body.appendChild(ghost);

  // Destination centre
  const dx = destRect.left + destRect.width / 2 - size / 2;
  const dy = destRect.top + destRect.height / 2 - size / 2;

  // Force reflow then animate
  ghost.getBoundingClientRect();
  Object.assign(ghost.style, {
    transition: 'all 0.65s cubic-bezier(0.2, 0.8, 0.3, 1)',
    left: `${dx}px`,
    top: `${dy}px`,
    width: '20px',
    height: '20px',
    opacity: '0.3',
    transform: 'rotate(360deg)',
  });

  // Bounce the cart icon on arrival
  ghost.addEventListener('transitionend', () => {
    ghost.remove();
    cartBtn.classList.add('navbar__cart-btn--bounce');
    setTimeout(() => cartBtn.classList.remove('navbar__cart-btn--bounce'), 500);
  }, { once: true });

  // Safety cleanup
  setTimeout(() => { if (ghost.parentNode) ghost.remove(); }, 1200);
}
