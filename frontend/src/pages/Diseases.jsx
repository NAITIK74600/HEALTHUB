import { useNavigate } from 'react-router-dom';
import {
  Droplets, Pill, Wind, Thermometer, Activity, Zap, Eye, Ear,
  Baby, Heart, Brain, Bone, Leaf, Shield, Syringe, FlaskConical,
  Sun, Moon, Apple, Scissors, Search,
} from 'lucide-react';

const DISEASES = [
  { name: 'Diabetes',              icon: <Droplets size={28} />,     search: 'diabetes',     color: '#e3f2fd', accent: '#1976d2' },
  { name: 'Blood Pressure',        icon: <Activity size={28} />,     search: 'hypertension', color: '#fce4ec', accent: '#c62828' },
  { name: 'Cold, Cough & Fever',   icon: <Thermometer size={28} />,  search: 'cough',        color: '#e8f5e9', accent: '#2e7d32' },
  { name: 'Pain & Inflammation',   icon: <Zap size={28} />,          search: 'pain',         color: '#fff8e1', accent: '#f57f17' },
  { name: 'Vitamins & Minerals',   icon: <Apple size={28} />,        search: 'vitamin',      color: '#f3e5f5', accent: '#7b1fa2' },
  { name: 'Antibiotics',           icon: <Shield size={28} />,       search: 'antibiotic',   color: '#e0f7fa', accent: '#00838f' },
  { name: 'Acidity & Digestion',   icon: <FlaskConical size={28} />, search: 'antacid',      color: '#fff3e0', accent: '#e65100' },
  { name: 'Allergy',               icon: <Sun size={28} />,          search: 'allergy',      color: '#f9fbe7', accent: '#558b2f' },
  { name: 'Heart Care',            icon: <Heart size={28} />,        search: 'cardiac',      color: '#fce4ec', accent: '#ad1457' },
  { name: 'Thyroid',               icon: <Pill size={28} />,         search: 'thyroid',      color: '#e8eaf6', accent: '#283593' },
  { name: 'Asthma & Breathing',    icon: <Wind size={28} />,         search: 'asthma',       color: '#e0f2f1', accent: '#004d40' },
  { name: 'Eye Care',              icon: <Eye size={28} />,          search: 'eye drop',     color: '#e1f5fe', accent: '#0277bd' },
  { name: 'Ear Care',              icon: <Ear size={28} />,         search: 'ear drop',     color: '#fafbe7', accent: '#827717' },
  { name: 'Skin Infections',       icon: <Leaf size={28} />,         search: 'antifungal',   color: '#f1f8e9', accent: '#33691e' },
  { name: 'Bone & Joint Pain',     icon: <Bone size={28} />,         search: 'calcium',      color: '#efebe9', accent: '#4e342e' },
  { name: 'Anxiety & Stress',      icon: <Brain size={28} />,        search: 'anxiety',      color: '#ede7f6', accent: '#512da8' },
  { name: 'Child Health',          icon: <Baby size={28} />,         search: 'pediatric',    color: '#fce4ec', accent: '#c62828' },
  { name: 'Injections & IV',       icon: <Syringe size={28} />,      search: 'injection',    color: '#e3f2fd', accent: '#1565c0' },
  { name: 'Surgical & Wound',      icon: <Scissors size={28} />,     search: 'surgical',     color: '#eceff1', accent: '#455a64' },
  { name: 'Sleep & Insomnia',      icon: <Moon size={28} />,         search: 'sleep',        color: '#ede7f6', accent: '#4527a0' },
  { name: 'Liver Care',            icon: <Activity size={28} />,     search: 'liver',        color: '#fff8e1', accent: '#f9a825' },
  { name: 'Kidney & Urinary',      icon: <Droplets size={28} />,     search: 'kidney',       color: '#e0f7fa', accent: '#006064' },
];

export default function Diseases() {
  const navigate = useNavigate();

  return (
    <div className="diseases-page">
      <div className="diseases-hero">
        <Search size={22} />
        <h1>Search Medicines by Disease</h1>
        <p>Find the right medicines for your condition from our pharmacy catalogue</p>
      </div>

      <div className="diseases-grid">
        {DISEASES.map((d) => (
          <button
            key={d.search}
            className="disease-card"
            style={{ '--card-bg': d.color, '--card-accent': d.accent }}
            onClick={() => navigate(`/products?search=${encodeURIComponent(d.search)}`)}
          >
            <span className="disease-card__icon">{d.icon}</span>
            <span className="disease-card__name">{d.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
