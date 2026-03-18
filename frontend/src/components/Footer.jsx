import { Phone, MessageCircle, MapPin, Plus, Shield, Mail } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const FULL_FOOTER_PATHS = ['/', '/products'];

export default function Footer() {
  const WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER || '919990165925';
  const { pathname } = useLocation();
  const isFull = FULL_FOOTER_PATHS.includes(pathname) || pathname.startsWith('/products');

  if (!isFull) {
    return (
      <footer className="footer footer--minimal">
        <span>&copy; {new Date().getFullYear()} <strong>Batla Medicos</strong> — All rights reserved.</span>
        <a href="tel:+919990165925" className="footer--minimal__link"><Phone size={13} /> 9990165925</a>
        <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="footer--minimal__link"><MessageCircle size={13} /> WhatsApp</a>
        <a href="mailto:ordersupport@batlamedicos.shop" className="footer--minimal__link"><Mail size={13} /> Email Us</a>
      </footer>
    );
  }

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <h3>
            <div className="footer__brand-logo"><Plus size={18} color="white" strokeWidth={3} /></div>
            <span className="brand-gradient">Batla Medicos</span>
          </h3>
          <p>Your trusted neighbourhood chemist &amp; cosmetics store serving Batla House, Jamia Nagar since 2005.</p>
          <div className="footer__services">
            {['Allopathic', 'Ayurvedic', 'Cosmetics', 'Baby Products', 'Surgical', 'Free Delivery'].map(s => (
              <span key={s} className="footer__service-chip"><Shield size={11} /> {s}</span>
            ))}
          </div>
        </div>
        <div className="footer__info">
          <h4>Store Information</h4>
          <p><MapPin size={15} /> F 41/2, Nafees Road, Batla House,<br />Jamia Nagar, New Delhi – 110025</p>
          <a href="tel:+919990165925"><Phone size={15} /> 9990165925</a>
          <a href="mailto:ordersupport@batlamedicos.shop" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}><Mail size={15} /> ordersupport@batlamedicos.shop</a>
        </div>
        <div className="footer__contact">
          <h4>Quick Contact</h4>
          <a
            href={`https://wa.me/${WHATSAPP}?text=Hi%2C%20I%20want%20to%20place%20an%20order`}
            target="_blank" rel="noopener noreferrer"
            className="btn btn--whatsapp"
          >
            <MessageCircle size={18} /> WhatsApp Us
          </a>
        </div>
      </div>
      <div className="footer__copy">
        &copy; {new Date().getFullYear()} Batla Medicos Chemist &amp; Cosmetics — All rights reserved.
      </div>
    </footer>
  );
}
