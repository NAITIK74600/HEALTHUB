/**
 * OrbitalGlobe v3 — Three.js 3D globe for Batla Medicos
 *
 * Layers (world units, FOV=55°, cam z=260, visible half-height ≈ 135):
 *   Inner sphere     r = 22
 *   Logo billboard   z = 26  (scale 40×40)
 *   Ring 1 green     r = 40  (equatorial)
 *   Ring 2 blue      r = 56  (tilted)
 *   Ring 3 gold      r = 72  (tilted opposite)
 *   Icon sprites     r = 94  (edge 108 << 135 — no clip)
 *   Med-term labels  r = 105-117  (edge 128 < 135 — just fits)
 *
 * All elements share an orbitGroup that auto-rotates.
 * Mouse hover tilts the camera (not scene) for smooth parallax.
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/* ── Data ──────────────────────────────────────────────────────────────── */

const ICONS = [
  { label: '💊', color: '#93C5FD' },
  { label: '🌿', color: '#4ADE80' },
  { label: '✚',  color: '#FF6B8A' },
  { label: '🧪', color: '#FDE68A' },
  { label: '💉', color: '#F9A8D4' },
  { label: '❤️', color: '#FC8181' },
  { label: '🩺', color: '#A78BFA' },
  { label: '💧', color: '#67E8F9' },
];

const MED_TERMS = [
  { t: 'Rx',     c: '#93C5FD' },
  { t: 'ECG',    c: '#4ADE80' },
  { t: 'DNA',    c: '#FDE68A' },
  { t: 'MRI',    c: '#D8B4FE' },
  { t: 'ICU',    c: '#FC8181' },
  { t: 'BP+',    c: '#67E8F9' },
  { t: 'CBC',    c: '#A78BFA' },
  { t: 'HDL',    c: '#4ADE80' },
  { t: 'BMI',    c: '#93C5FD' },
  { t: 'IVF',    c: '#FDE68A' },
  { t: 'OPD',    c: '#FC8181' },
  { t: 'O2',     c: '#67E8F9' },
  { t: 'NaCl',   c: '#4ADE80' },
  { t: 'H2O',    c: '#93C5FD' },
  { t: 'EEG',    c: '#A78BFA' },
  { t: 'INR',    c: '#FC8181' },
  { t: 'HbA1c',  c: '#4ADE80' },
  { t: 'GFR',    c: '#FDE68A' },
];

/* ── Texture helpers ───────────────────────────────────────────────────── */

function makeIconTexture(label, ringColor, sz = 120) {
  const c = document.createElement('canvas');
  c.width = sz; c.height = sz;
  const ctx = c.getContext('2d');
  const cx = sz / 2, cy = sz / 2, r = sz / 2 - 6;

  // Outer glow halo
  const grd = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r + 12);
  grd.addColorStop(0, ringColor + '45');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, r + 12, 0, Math.PI * 2);
  ctx.fillStyle = grd;
  ctx.fill();

  // Dark background disc
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(5,8,28,0.88)';
  ctx.fill();

  // Coloured border with shadow glow
  ctx.save();
  ctx.shadowColor = ringColor;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.restore();

  // Emoji / symbol
  ctx.font = `${Math.floor(sz * 0.40)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, cx, cy + 2);

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function makeMedTermTexture(term, color) {
  const W = 100, H = 30;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const rx = H / 2;

  // Pill background
  ctx.beginPath();
  ctx.moveTo(rx, 1);
  ctx.lineTo(W - rx, 1);
  ctx.quadraticCurveTo(W - 1, 1, W - 1, rx);
  ctx.quadraticCurveTo(W - 1, H - 1, W - rx, H - 1);
  ctx.lineTo(rx, H - 1);
  ctx.quadraticCurveTo(1, H - 1, 1, rx);
  ctx.quadraticCurveTo(1, 1, rx, 1);
  ctx.closePath();
  ctx.fillStyle = 'rgba(4,8,26,0.70)';
  ctx.fill();

  // Glowing pill border
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.strokeStyle = color + 'cc';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Medical term text
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(term, W / 2, H / 2 + 0.5);

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function makeLogoTexture(sz = 256) {
  return new Promise(resolve => {
    const img = new Image();
    img.src = '/logo.png?v=3';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = sz; c.height = sz;
      const ctx = c.getContext('2d');
      const pad = sz * 0.06;
      ctx.drawImage(img, pad, pad, sz - pad * 2, sz - pad * 2);
      const tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      resolve(tex);
    };
    img.onerror = () => resolve(null);
  });
}

// Even distribution on sphere surface
function fibonacciSphere(count, radius) {
  const pts = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const rxy = Math.sqrt(1 - y * y);
    const theta = golden * i;
    pts.push(new THREE.Vector3(Math.cos(theta) * rxy * radius, y * radius, Math.sin(theta) * rxy * radius));
  }
  return pts;
}

/* ── Component ─────────────────────────────────────────────────────────── */

export default function OrbitalGlobe({ size = 380 }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    /* Renderer */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    /* Scene + Camera (FOV 55°, z=260 → visible half-height ≈ 135 world units) */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);
    camera.position.set(0, 0, 260);
    camera.lookAt(0, 0, 0);

    /* Lights */
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sunLight = new THREE.DirectionalLight(0x93c5fd, 1.1);
    sunLight.position.set(6, 9, 8);
    scene.add(sunLight);
    const fillLight = new THREE.DirectionalLight(0x4ade80, 0.35);
    fillLight.position.set(-5, -4, -6);
    scene.add(fillLight);

    /* Wireframe globe shell r=55 */
    const meshGlobe = new THREE.Mesh(
      new THREE.IcosahedronGeometry(55, 3),
      new THREE.MeshBasicMaterial({
        color: 0x3451D1, wireframe: true, transparent: true, opacity: 0.18,
      }),
    );
    scene.add(meshGlobe);

    /* Inner glow sphere r=22 */
    const meshInner = new THREE.Mesh(
      new THREE.SphereGeometry(22, 48, 48),
      new THREE.MeshPhongMaterial({
        color: 0x0a1f6e, emissive: 0x3451D1, emissiveIntensity: 0.55,
        transparent: true, opacity: 0.92, shininess: 130,
      }),
    );
    scene.add(meshInner);

    /* Logo billboard Sprite at centre */
    makeLogoTexture(256).then(tex => {
      if (!tex) return;
      const logo = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 1, depthWrite: false }),
      );
      logo.scale.set(40, 40, 1);
      logo.position.set(0, 0, 26);
      scene.add(logo);
    });

    /* ─── Orbit group: rings + icon sprites spin together ──────────── */
    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);

    // Ring 1 — equatorial green (r=40)
    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(40, 0.9, 8, 120),
      new THREE.MeshBasicMaterial({ color: 0x27AE60, transparent: true, opacity: 0.65 }),
    );
    ring1.rotation.x = Math.PI / 2;
    orbitGroup.add(ring1);

    // Ring 2 — tilted blue (r=56)
    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(56, 0.75, 8, 120),
      new THREE.MeshBasicMaterial({
        color: 0x3451D1, transparent: true, opacity: 0.55,
        blending: THREE.AdditiveBlending,
      }),
    );
    ring2.rotation.x = Math.PI / 2.5;
    ring2.rotation.z = Math.PI / 6;
    orbitGroup.add(ring2);

    // Ring 3 — counter-tilted gold (r=72)
    const ring3 = new THREE.Mesh(
      new THREE.TorusGeometry(72, 0.65, 8, 140),
      new THREE.MeshBasicMaterial({
        color: 0xfde68a, transparent: true, opacity: 0.40,
        blending: THREE.AdditiveBlending,
      }),
    );
    ring3.rotation.x = Math.PI / 2.5;
    ring3.rotation.z = -Math.PI / 6;
    orbitGroup.add(ring3);

    // Icon sprites at Fibonacci sphere r=94 (edge at 94+14=108 — fits in 135 ✓)
    const spriteObjs = [];
    fibonacciSphere(ICONS.length, 94).forEach((pos, i) => {
      const { label, color } = ICONS[i];
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: makeIconTexture(label, color, 120),
          transparent: true, opacity: 0.92, depthWrite: false,
        }),
      );
      sprite.scale.set(28, 28, 1);
      sprite.position.copy(pos);
      orbitGroup.add(sprite);
      spriteObjs.push({ sprite, base: pos.clone(), phase: (Math.PI * 2 * i) / ICONS.length });
    });

    /* ─── Medical-term floating label sprites ───────────────────────── */
    // Placed in an elliptical halo (r=105–117) around the globe.
    // A separate termGroup counter-rotates for visual contrast.
    const termGroup = new THREE.Group();
    scene.add(termGroup);
    const termObjs = [];

    MED_TERMS.forEach(({ t, c }, i) => {
      const angle = (i / MED_TERMS.length) * Math.PI * 2;
      const r = 105 + (i % 4) * 4;           // 105 / 109 / 113 / 117
      const xPos = Math.cos(angle) * r;
      const yPos = Math.sin(angle) * r * 0.52; // flatten to ellipse
      const zPos = ((i % 6) - 2.5) * 16;      // z spread ≈ ±40

      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: makeMedTermTexture(t, c),
          transparent: true, opacity: 0.70, depthWrite: false,
        }),
      );
      // scale: (worldWidth, worldHeight, 1) derived from texture aspect 100:30 ≈ 3.33
      sprite.scale.set(22, 6.6, 1);
      sprite.position.set(xPos, yPos, zPos);
      termGroup.add(sprite);
      termObjs.push({ sprite, phase: (Math.PI * 2 * i) / MED_TERMS.length });
    });

    /* ─── Animation loop ────────────────────────────────────────────── */
    const mouse = { tx: 0, ty: 0 }; // target camera tilt
    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Globe wireframe — gentle slow spin
      meshGlobe.rotation.y = t * 0.10;
      meshGlobe.rotation.x = t * 0.04;
      // Inner sphere — counter-spin
      meshInner.rotation.y = -t * 0.08;

      // Orbit group rotates continuously — rings + icons as one unit
      orbitGroup.rotation.y = t * 0.28;
      // Each ring also spins on its own local axis (extra dynamism)
      ring1.rotation.z = t * 0.35;
      ring2.rotation.z = t * 0.25 + Math.PI / 6;
      ring3.rotation.z = -t * 0.18 - Math.PI / 6;

      // Term (medical label) group counter-drifts
      termGroup.rotation.y = -t * 0.09;
      termGroup.rotation.x = Math.sin(t * 0.05) * 0.08;

      // Icon sprite pulse + brightness flicker
      spriteObjs.forEach(({ sprite, base, phase }) => {
        const pulse = 1 + 0.05 * Math.sin(t * 1.4 + phase);
        sprite.position.set(base.x * pulse, base.y * pulse, base.z * pulse);
        sprite.material.opacity = 0.68 + 0.24 * Math.sin(t * 0.9 + phase);
      });

      // Med-term label fade in/out
      termObjs.forEach(({ sprite, phase }) => {
        sprite.material.opacity = 0.45 + 0.38 * Math.abs(Math.sin(t * 0.4 + phase));
      });

      // Smooth camera parallax toward mouse
      camera.position.x += (mouse.tx * 28 - camera.position.x) * 0.04;
      camera.position.y += (mouse.ty * 20 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    /* Mouse tilt */
    const onMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      mouse.tx = ((e.clientX - rect.left) / size - 0.5) * 2;
      mouse.ty = -((e.clientY - rect.top) / size - 0.5) * 2;
    };
    el.addEventListener('mousemove', onMouseMove);

    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener('mousemove', onMouseMove);
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, [size]);

  return (
    <div
      ref={mountRef}
      style={{ width: size, height: size, flexShrink: 0, cursor: 'grab' }}
      aria-hidden="true"
    />
  );
}
