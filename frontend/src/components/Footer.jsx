import { Phone, MessageCircle, MapPin, Plus, Shield, Mail, Clock, Navigation, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const GOOGLE_MAPS_URL = 'https://maps.app.goo.gl/W4Qtps1fKbArBvz17';

const QUICK_LINKS = [
  { label: 'All Products',        to: '/products' },
  { label: 'Upload Prescription', to: '/prescriptions' },
  { label: 'My Orders',           to: '/orders' },
  { label: 'My Account',          to: '/account' },
];

const POLICY_LINKS = [
  { label: 'Privacy Policy',    to: '/privacy-policy' },
  { label: 'Terms & Conditions', to: '/terms' },
  { label: 'Refund Policy',     to: '/refund-policy' },
];

export default function Footer() {
  const WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER || '917303240289';
  const { pathname } = useLocation();
  const isMinimal = pathname.startsWith('/admin') || pathname.startsWith('/login') || pathname.startsWith('/register');

  if (isMinimal) {
    return (
      <footer className="footer footer--minimal">
        <span>&copy; {new Date().getFullYear()} <strong>Health Hub</strong> — All rights reserved.</span>
        <a href="tel:+917303240289" className="footer--minimal__link"><Phone size={13} /> 7303240289</a>
        <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="footer--minimal__link"><MessageCircle size={13} /> WhatsApp</a>
        <a href="mailto:support@healthub.site" className="footer--minimal__link"><Mail size={13} /> Email Us</a>
      </footer>
    );
  }

  return (
    <footer className="footer">
      <div className="footer__inner">

        {/* ── Column 1: Brand ── */}
        <div className="footer__brand">
          <div className="footer__logo">
            <img src="/logo.jpg?v=5" alt="Health Hub" style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 12 }} />
          </div>
          <p>Your neighbourhood pharmacy in Connaught Place, New Delhi. Genuine medicines, free delivery.</p>
          <div className="footer__services">
            {['Allopathic', 'Ayurvedic', 'Cosmetics', 'Baby Care', 'Surgical', 'Free Delivery'].map(s => (
              <span key={s} className="footer__service-chip"><Shield size={10} /> {s}</span>
            ))}
          </div>
          {/* Payment accepted */}
          <div className="footer__pay-row">
            <span className="footer__pay-label">Accepted Payments</span>
            <div className="footer__pay-logos">
              {/* Visa */}
              <span className="footer__pay-logo" title="Visa">
                <svg viewBox="0 0 60 20" width="42" height="14" xmlns="http://www.w3.org/2000/svg">
                  <text x="1" y="16" fontFamily="'Arial Black',Arial" fontWeight="900" fontSize="17" fontStyle="italic" fill="#1A1F71">VISA</text>
                </svg>
              </span>
              {/* Mastercard */}
              <span className="footer__pay-logo" title="Mastercard">
                <svg viewBox="0 0 40 26" width="36" height="26" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="14" cy="13" r="11" fill="#EB001B"/>
                  <circle cx="26" cy="13" r="11" fill="#F79E1B"/>
                  <path d="M20 4.8a11 11 0 010 16.4A11 11 0 0120 4.8z" fill="#FF5F00"/>
                </svg>
              </span>
              {/* RuPay */}
              <span className="footer__pay-logo footer__pay-logo--text" title="RuPay">
                <span style={{color:'#007B3E', fontWeight:900, fontSize:11}}>Ru</span><span style={{color:'#F7941D', fontWeight:900, fontSize:11}}>Pay</span>
              </span>
              {/* UPI */}
              <span className="footer__pay-logo footer__pay-logo--text" title="UPI">
                <svg viewBox="0 0 40 20" width="36" height="18" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0" y="0" width="40" height="20" rx="3" fill="white"/>
                  <text x="5" y="14" fontFamily="'Arial Black',Arial" fontWeight="900" fontSize="12" fill="#097939">UPI</text>
                  <circle cx="33" cy="10" r="5" fill="#FF6B35"/>
                </svg>
              </span>
              {/* Paytm */}
              <span className="footer__pay-logo" title="Paytm">
                <svg viewBox="0 0 52 20" width="46" height="20" xmlns="http://www.w3.org/2000/svg">
                  <rect width="52" height="20" rx="3" fill="#00BAF2"/>
                  <text x="4" y="14" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="11" fill="white">Pay</text>
                  <rect x="28" y="0" width="24" height="20" rx="0" fill="#012970"/>
                  <text x="30" y="14" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="11" fill="white">TM</text>
                </svg>
              </span>
              {/* COD */}
              <span className="footer__pay-logo footer__pay-logo--cod" title="Cash on Delivery">
                <svg viewBox="0 0 16 16" width="13" height="13" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="4" width="14" height="9" rx="2" stroke="#166534" strokeWidth="1.4"/>
                  <circle cx="8" cy="8.5" r="2" stroke="#166534" strokeWidth="1.4"/>
                  <path d="M4 4V3a2 2 0 014 0v1" stroke="#166534" strokeWidth="1.4"/>
                </svg>
                COD
              </span>
            </div>
          </div>
        </div>

        {/* ── Column 2: Store Info ── */}
        <div className="footer__info">
          <h4>Store Information</h4>
          <a href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer">
            <MapPin size={15} />
            <span>Block G, Connaught Place,<br />New Delhi – 110001</span>
          </a>
          <a href="tel:+917303240289"><Phone size={14} /> +91 73032 40289</a>
          <a href="mailto:support@healthub.site"><Mail size={14} /> support@healthub.site</a>
          <div className="footer__hours">
            <Clock size={14} />
            <div>
              <div className="footer__hours-row"><span>Mon – Sat</span><span>8:00 AM – 11:45 PM</span></div>
              <div className="footer__hours-row"><span>Sunday</span><span>8:00 AM – 11:45 PM</span></div>
            </div>
          </div>
          <a href={GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer" className="footer__map-link">
            <Navigation size={13} /> Get Directions on Google Maps
          </a>
        </div>

        {/* ── Column 3: Quick Links ── */}
        <div className="footer__links">
          <h4>Quick Links</h4>
          <ul>
            {QUICK_LINKS.map(l => (
              <li key={l.to}>
                <Link to={l.to}><ChevronRight size={13} /> {l.label}</Link>
              </li>
            ))}
          </ul>
          <h4 style={{ marginTop: 18 }}>Legal</h4>
          <ul>
            {POLICY_LINKS.map(l => (
              <li key={l.to}>
                <Link to={l.to}><ChevronRight size={13} /> {l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Column 4: Contact ── */}
        <div className="footer__contact">
          <h4>Quick Contact</h4>
          <a
            href={`https://wa.me/${WHATSAPP}?text=Hi%2C%20I%20want%20to%20place%20an%20order`}
            target="_blank" rel="noopener noreferrer"
            className="footer__contact-btn footer__contact-btn--wa"
          >
            <MessageCircle size={17} /> WhatsApp Order
          </a>
          <a href="tel:+917303240289" className="footer__contact-btn footer__contact-btn--phone">
            <Phone size={17} /> Call the Store
          </a>
          <a href="mailto:support@healthub.site" className="footer__contact-btn footer__contact-btn--email">
            <Mail size={17} /> Email Support
          </a>
          <div className="footer__note">
            <Shield size={12} /> 100% Genuine &amp; Licensed medicines
          </div>
        </div>

      </div>
      <div className="footer__copy">
        &copy; {new Date().getFullYear()} Health Hub Chemist &amp; Cosmetics, New Delhi — All rights reserved.
        <span className="footer__policy-links">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <span>·</span>
          <Link to="/terms">Terms</Link>
          <span>·</span>
          <Link to="/refund-policy">Refund Policy</Link>
        </span>
      </div>
    </footer>
  );
}

