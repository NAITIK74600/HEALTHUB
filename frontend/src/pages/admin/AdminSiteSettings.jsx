import { useState, useEffect } from 'react';
import { Sparkles, RotateCcw, Eye, MousePointerClick } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ANIMATION_OPTIONS = [
  { value: 'fadeUp',     label: 'Fade Up',       desc: 'Elements fade in from below'      },
  { value: 'fadeDown',   label: 'Fade Down',     desc: 'Elements fade in from above'      },
  { value: 'fadeIn',     label: 'Fade In',        desc: 'Simple opacity fade'              },
  { value: 'slideLeft',  label: 'Slide Left',     desc: 'Slide in from the left'           },
  { value: 'slideRight', label: 'Slide Right',    desc: 'Slide in from the right'          },
  { value: 'slideUp',    label: 'Slide Up',      desc: 'Slide in from below'              },
  { value: 'slideDown',  label: 'Slide Down',    desc: 'Slide in from above'              },
  { value: 'zoomIn',     label: 'Zoom In',        desc: 'Scale up from smaller'            },
  { value: 'flipUp',     label: 'Flip Up',        desc: '3D flip perspective effect'       },
  { value: 'rotateIn',   label: 'Rotate In',     desc: 'Rotate + scale into place'        },
  { value: 'bounceIn',   label: 'Bounce In',      desc: 'Bouncy spring entrance'           },
  { value: 'glowIn',     label: 'Glow In',        desc: 'Fade with subtle glow'            },
  { value: 'none',       label: 'No Animation',   desc: 'Sections appear instantly'        },
];

const SECTIONS = [
  { key: 'trustStrip',     label: 'Trust Strip',              default: 'fadeUp'    },
  { key: 'personalCare',   label: 'Personal Care',            default: 'zoomIn'    },
  { key: 'featuredBrands',  label: 'Featured Brands',          default: 'slideLeft' },
  { key: 'shopByCategory', label: 'Shop by Category',         default: 'fadeUp'    },
  { key: 'newArrivals',    label: 'New Arrivals',             default: 'fadeUp'    },
  { key: 'ayurvedaBrands', label: 'Ayurveda Brands',          default: 'slideRight' },
  { key: 'bestValue',      label: 'Best Value Medicines',     default: 'fadeUp'    },
  { key: 'dealOfDay',      label: 'Deal of the Day',          default: 'bounceIn'  },
  { key: 'labTests',       label: 'Pathology Tests',          default: 'flipUp'    },
  { key: 'whyChoose',      label: 'Why Choose Us',            default: 'fadeUp'    },
  { key: 'mapStrip',       label: 'Store Location',           default: 'glowIn'    },
];

const CLICK_EFFECTS = [
  { value: 'ripple',    label: 'Ripple',       desc: 'Material-style ripple wave'       },
  { value: 'pulse',     label: 'Pulse',        desc: 'Quick scale pulse on click'       },
  { value: 'none',      label: 'No Effect',    desc: 'Standard click behavior'          },
];

const STORAGE_KEY = 'batla_animation_settings';

function getSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return null;
}

function getDefaults() {
  const sections = {};
  SECTIONS.forEach(s => { sections[s.key] = s.default; });
  return { sections, clickEffect: 'ripple', globalEnabled: true };
}

export function getAnimationSetting(sectionKey) {
  const settings = getSettings() || getDefaults();
  if (!settings.globalEnabled) return 'none';
  return settings.sections?.[sectionKey] || 'fadeUp';
}

export function getClickEffect() {
  const settings = getSettings() || getDefaults();
  return settings.clickEffect || 'ripple';
}

export default function AdminSiteSettings() {
  const defaults = getDefaults();
  const [settings, setSettings] = useState(() => getSettings() || defaults);
  const [previewAnim, setPreviewAnim] = useState(null);

  const updateSection = (key, value) => {
    setSettings(prev => ({
      ...prev,
      sections: { ...prev.sections, [key]: value }
    }));
  };

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    toast.success('Animation settings saved!');
  };

  const reset = () => {
    setSettings(getDefaults());
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Reset to default animations.');
  };

  const preview = (anim) => {
    setPreviewAnim(null);
    setTimeout(() => setPreviewAnim(anim), 50);
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1><Sparkles size={22} /> Site Animation Settings</h1>
      </div>

      {/* Global toggle */}
      <div className="settings-card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Enable Animations</h3>
            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.82rem' }}>Turn off to disable all scroll animations site-wide</p>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={settings.globalEnabled} onChange={e => setSettings(prev => ({ ...prev, globalEnabled: e.target.checked }))} />
            <span className="toggle-switch__slider" />
          </label>
        </div>
      </div>

      {/* Click Effect */}
      <div className="settings-card" style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '1rem' }}><MousePointerClick size={16} /> Click Effect</h3>
        <div className="anim-option-grid">
          {CLICK_EFFECTS.map(opt => (
            <label key={opt.value} className={`anim-option-card ${settings.clickEffect === opt.value ? 'anim-option-card--active' : ''}`}>
              <input type="radio" name="clickEffect" value={opt.value}
                checked={settings.clickEffect === opt.value}
                onChange={() => setSettings(prev => ({ ...prev, clickEffect: opt.value }))} />
              <strong>{opt.label}</strong>
              <span>{opt.desc}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Per-section animation */}
      <div className="settings-card" style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '1rem' }}><Eye size={16} /> Section Animations</h3>
        <div className="section-anim-list">
          {SECTIONS.map(sec => (
            <div key={sec.key} className="section-anim-row">
              <span className="section-anim-row__label">{sec.label}</span>
              <select
                className="section-anim-row__select"
                value={settings.sections?.[sec.key] || sec.default}
                onChange={e => updateSection(sec.key, e.target.value)}
              >
                {ANIMATION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button type="button" className="btn btn--sm btn--outline" onClick={() => preview(settings.sections?.[sec.key] || sec.default)}>
                Preview
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Preview box */}
      {previewAnim && (
        <div className="settings-card" style={{ marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '1rem' }}>Preview: {ANIMATION_OPTIONS.find(a => a.value === previewAnim)?.label}</h3>
          <div
            key={Date.now()}
            className={`anim-preview-box anim-section anim--${previewAnim === 'none' ? 'fade-in' : previewAnim.replace(/([A-Z])/g, '-$1').toLowerCase()} anim--visible`}
          >
            <Sparkles size={24} /> This is how the animation looks
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button className="btn btn--primary" onClick={save}>Save Settings</button>
        <button className="btn btn--outline" onClick={reset}><RotateCcw size={14} /> Reset to Defaults</button>
      </div>
    </div>
  );
}
