import { useInView, getStaggerDelay } from '../hooks/useAnimations';

/**
 * AnimatedSection — wraps content with scroll-triggered animation.
 * 
 * Props:
 *   animation: 'fadeUp' | 'fadeIn' | 'slideLeft' | 'slideRight' | 'zoomIn' | 'flipUp' | 'bounceIn' | 'none'
 *   delay: extra delay in seconds (default: 0)
 *   stagger: if true, children get staggered delays
 *   className: additional class names
 *   children: content
 */
const ANIMATION_CLASSES = {
  fadeUp: 'anim--fade-up',
  fadeIn: 'anim--fade-in',
  slideLeft: 'anim--slide-left',
  slideRight: 'anim--slide-right',
  zoomIn: 'anim--zoom-in',
  flipUp: 'anim--flip-up',
  bounceIn: 'anim--bounce-in',
  glowIn: 'anim--glow-in',
  none: '',
};

export default function AnimatedSection({
  animation = 'fadeUp',
  delay = 0,
  stagger = false,
  staggerBase = 0.08,
  className = '',
  style = {},
  children,
  as: Tag = 'div',
  ...rest
}) {
  const [ref, inView] = useInView({ threshold: 0.1 });
  const animClass = ANIMATION_CLASSES[animation] || ANIMATION_CLASSES.fadeUp;

  return (
    <Tag
      ref={ref}
      className={`anim-section ${animClass} ${inView ? 'anim--visible' : ''} ${className}`}
      style={{ ...style, animationDelay: delay ? `${delay}s` : undefined }}
      {...rest}
    >
      {stagger
        ? Array.isArray(children)
          ? children.map((child, i) =>
              child ? (
                <div
                  key={i}
                  className={`anim-stagger-item ${animClass} ${inView ? 'anim--visible' : ''}`}
                  style={{ animationDelay: getStaggerDelay(i, staggerBase) }}
                >
                  {child}
                </div>
              ) : null
            )
          : children
        : children}
    </Tag>
  );
}
