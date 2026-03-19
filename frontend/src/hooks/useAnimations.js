import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Intersection Observer hook for scroll-triggered animations.
 * Returns a ref to attach to the element and a boolean `inView`.
 */
export function useInView(options = {}) {
  const { threshold = 0.15, rootMargin = '0px', once = true } = options;
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        if (once) obs.disconnect();
      } else if (!once) {
        setInView(false);
      }
    }, { threshold, rootMargin });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, inView];
}

/**
 * Creates a ripple effect at click position inside an element.
 */
export function useRipple() {
  const handleRipple = useCallback((e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }, []);

  return handleRipple;
}

/**
 * Staggered children animation — adds delay to each child.
 */
export function getStaggerDelay(index, base = 0.08) {
  return `${index * base}s`;
}
