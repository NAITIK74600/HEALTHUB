/**
 * OrbitalGlobe — Three.js 3D globe with orbiting medicine icons as sprites.
 * Logo sits in a DOM element layered on top of the canvas.
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Medicine emoji labels mapped to colour tints (used as canvas-drawn sprites)
const ICONS = [
  { label: '💊', color: '#93C5FD' },
  { label: '🌿', color: '#4ade80' },
  { label: '+',  color: '#ffffff' },
  { label: '🧪', color: '#fde68a' },
  { label: '💉', color: '#f9a8d4' },
  { label: '❤️', color: '#fc8181' },
  { label: '🩺', color: '#a78bfa' },
  { label: '💧', color: '#67e8f9' },
  { label: '⚕',  color: '#6ee7b7' },
];

/** Draw an icon onto an offscreen canvas and return a THREE.Texture */
function makeIconTexture(label, bgColor, size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Circular background
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.13)';
  ctx.fill();
  ctx.strokeStyle = bgColor;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Emoji / text
  ctx.font = `bold ${size * 0.44}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = bgColor;
  ctx.fillText(label, size / 2, size / 2 + 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/** Generate a point uniformly distributed on a sphere via Fibonacci lattice */
function fibonacciSphere(count, radius) {
  const points = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    points.push(new THREE.Vector3(
      Math.cos(theta) * r * radius,
      y * radius,
      Math.sin(theta) * r * radius,
    ));
  }
  return points;
}

export default function OrbitalGlobe({ size = 300 }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const W = size, H = size;
    const el = mountRef.current;
    if (!el) return;

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    /* ── Scene / Camera ── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    camera.position.set(0, 0, 320);

    /* ── Ambient + directional light (makes the scene feel 3-D) ── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xa0c4ff, 1.0);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    /* ── Wispy globe outline (IcosahedronGeometry wireframe) ── */
    const geoGlobe = new THREE.IcosahedronGeometry(88, 3);
    const matWire = new THREE.MeshBasicMaterial({
      color: 0x3451D1,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const meshGlobe = new THREE.Mesh(geoGlobe, matWire);
    scene.add(meshGlobe);

    /* ── Inner glow sphere ── */
    const geoInner = new THREE.SphereGeometry(42, 32, 32);
    const matInner = new THREE.MeshPhongMaterial({
      color: 0x0a1f6e,
      emissive: 0x3451D1,
      emissiveIntensity: 0.38,
      transparent: true,
      opacity: 0.82,
      shininess: 120,
    });
    const meshInner = new THREE.Mesh(geoInner, matInner);
    scene.add(meshInner);

    /* ── Equator ring ── */
    const geoRing = new THREE.TorusGeometry(95, 1.2, 8, 120);
    const matRing = new THREE.MeshBasicMaterial({ color: 0x27AE60, transparent: true, opacity: 0.4 });
    const meshRing = new THREE.Mesh(geoRing, matRing);
    meshRing.rotation.x = Math.PI / 2;
    scene.add(meshRing);

    /* ── Orbit ring 2 – tilted ── */
    const geoRing2 = new THREE.TorusGeometry(72, 0.9, 8, 100);
    const matRing2 = new THREE.MeshBasicMaterial({ color: 0x93C5FD, transparent: true, opacity: 0.35 });
    const meshRing2 = new THREE.Mesh(geoRing2, matRing2);
    meshRing2.rotation.x = Math.PI / 2.8;
    meshRing2.rotation.z = Math.PI / 5;
    scene.add(meshRing2);

    /* ── Orbit ring 3 – tilted opposite ── */
    const geoRing3 = new THREE.TorusGeometry(110, 0.8, 8, 130);
    const matRing3 = new THREE.MeshBasicMaterial({ color: 0xfde68a, transparent: true, opacity: 0.22 });
    const meshRing3 = new THREE.Mesh(geoRing3, matRing3);
    meshRing3.rotation.x = Math.PI / 2.8;
    meshRing3.rotation.z = -Math.PI / 5;
    scene.add(meshRing3);

    /* ── Floating icon sprites (Fibonacci-distributed on a sphere) ── */
    const spriteObjs = [];
    const positions = fibonacciSphere(ICONS.length, 108);
    ICONS.forEach(({ label, color }, i) => {
      const tex = makeIconTexture(label, color, 128);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.92, depthWrite: false });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(38, 38, 1);
      sprite.position.copy(positions[i]);
      scene.add(sprite);
      // store initial spherical position for pulsing
      spriteObjs.push({ sprite, base: positions[i].clone(), phase: Math.random() * Math.PI * 2 });
    });

    /* ── Floating glowing particles (random small spheres) ── */
    const particleMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.5, transparent: true, opacity: 0.5, sizeAttenuation: true });
    const particlePositions = new Float32Array(180);
    for (let i = 0; i < 180; i++) particlePositions[i] = (Math.random() - 0.5) * 260;
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    /* ── Animation loop ── */
    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Slow globe auto-rotate
      meshGlobe.rotation.y = t * 0.18;
      meshGlobe.rotation.x = t * 0.07;
      meshInner.rotation.y = t * 0.12;

      // Ring animations
      meshRing.rotation.z = t * 0.22;
      meshRing2.rotation.z = -t * 0.16 + Math.PI / 5;
      meshRing3.rotation.z = t * 0.11 - Math.PI / 5;

      // Particles slow drift
      particles.rotation.y = t * 0.04;
      particles.rotation.x = t * 0.02;

      // Sprite pulse (in/out along radial direction)
      spriteObjs.forEach(({ sprite, base, phase }) => {
        const pulse = 1 + 0.06 * Math.sin(t * 1.2 + phase);
        sprite.position.set(base.x * pulse, base.y * pulse, base.z * pulse);
        sprite.material.opacity = 0.7 + 0.25 * Math.sin(t * 0.8 + phase);
      });

      renderer.render(scene, camera);
    };
    animate();

    /* ── Mouse parallax ── */
    const onMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / W - 0.5) * 2;
      const my = -((e.clientY - rect.top) / H - 0.5) * 2;
      scene.rotation.y += (mx * 0.4 - scene.rotation.y) * 0.04;
      scene.rotation.x += (my * 0.3 - scene.rotation.x) * 0.04;
    };
    el.addEventListener('mousemove', onMouseMove);

    /* ── Cleanup ── */
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
      style={{ width: size, height: size, position: 'relative', flexShrink: 0, cursor: 'grab' }}
      aria-hidden="true"
    >
      {/* Logo layered in DOM above the canvas */}
      <img
        src="/logo.png?v=3"
        alt="Batla Medicos"
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 72, height: 72,
          objectFit: 'contain',
          pointerEvents: 'none',
          zIndex: 2,
          filter: 'drop-shadow(0 0 12px rgba(52,81,209,0.7)) drop-shadow(0 0 6px rgba(39,174,96,0.5))',
          animation: 'logo-glow 3s ease-in-out infinite',
        }}
      />
    </div>
  );
}
