/**
 * HeroVisual — animated rotating taglines / quotes for the Health Hub hero.
 *
 * Logo medallion + a stack of health taglines that fade/slide in and out
 * continuously, plus a row of quick highlight chips. Pure CSS + small timer;
 * respects reduced-motion.
 */
import { useEffect, useState } from 'react';
import { Quote, Truck, Clock, ShieldCheck } from 'lucide-react';

const QUOTES = [
  { text: 'Your health, delivered to your doorstep.', tag: 'Free delivery above ₹499' },
  { text: '100% genuine medicines, every single time.', tag: 'Licensed & verified sources' },
  { text: 'Care that never closes early.', tag: 'Open 8 AM – 11:45 PM, 7 days' },
  { text: 'Lab tests, now from the comfort of home.', tag: 'Sample pickup at your door' },
  { text: 'Upload a prescription, we handle the rest.', tag: 'Fast & hassle-free' },
];

const STATS = [
  { Icon: Truck,       label: 'Free Delivery',   sub: 'Above ₹499' },
  { Icon: Clock,       label: '8 AM – 11:45 PM',  sub: 'All 7 days' },
  { Icon: ShieldCheck, label: '100% Genuine',     sub: 'Licensed' },
];

export default function HeroVisual() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const id = setInterval(() => setI(p => (p + 1) % QUOTES.length), 3800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hero-quotes" aria-hidden="true">
      <span className="hero-quotes__halo" />

      <div className="hero-quotes__logo-wrap">
        <img src="/logo.jpg?v=5" alt="Health Hub" className="hero-quotes__logo" />
      </div>

      <div className="hero-quotes__card">
        <Quote className="hero-quotes__qicon" size={26} />
        <div className="hero-quotes__stage">
          {QUOTES.map((q, idx) => (
            <div key={idx} className={`hero-quotes__item ${idx === i ? 'is-active' : ''}`}>
              <p className="hero-quotes__text">{q.text}</p>
              <span className="hero-quotes__tag">{q.tag}</span>
            </div>
          ))}
        </div>
        <div className="hero-quotes__dots">
          {QUOTES.map((_, idx) => (
            <span key={idx} className={`hero-quotes__dot ${idx === i ? 'is-active' : ''}`} />
          ))}
        </div>
      </div>

      <div className="hero-quotes__stats">
        {STATS.map(({ Icon, label, sub }, idx) => (
          <div className="hero-quotes__stat" key={idx} style={{ animationDelay: `${idx * 0.15}s` }}>
            <span className="hero-quotes__stat-icon"><Icon size={18} strokeWidth={2.2} /></span>
            <div className="hero-quotes__stat-txt">
              <strong>{label}</strong>
              <small>{sub}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
