/**
 * OrbitalGlobe — Three.js 3D globe with orbiting medicine icons as sprites.
 * Layout: inner sphere (r=38) → rings (r=68 / 90 / 112) → icon sprites (r=138)
 * Logo is rendered as a billboard sprite at the centre, in front of the sphere.
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ICONS = [
  { label: '💊', color: '#93C5FD' },
  { label: '🌿', color: '#4ade80' },
  { label: '✚',  color: '#ffffff' },
  { label: '🧪', color: '#fde68a' },
  { label: '💉', color: '#f9a8d4' },
  { label: '❤️', color: '#fc8181' },
  { label: '🩺', color: '#a78bfa' },
  { label: '💧', color: '#67e8f9' },
];

function makeIconTexture(label, ringColor, size = 128) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  const cx = size / 2, cy = size / 2, r = size / 2 - 4;

  // Glow halo
  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
  ctx.fillStyle = ringColor + '18';
  ctx.fill();

  // Background circle
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(8,12,36,0.75)';
  ctx.fill();

  // Border
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Icon
  ctx.font = `${Math.floor(size * 0.42)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, cx, cy + 2);

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function makeLogoTexture(size = 256) {
  return new Promise(resolve => {
    const img = new Image();
    img.src = '/logo.png?v=3';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      const ctx = c.getContext('2d');
      const pad = size * 0.08;
      ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2);
      const tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      resolve(tex);
    };
    img.onerror = () => resolve(null);
  });
}

function fibonacciSphere(count, radius) {
  const pts = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r2 = Math.sqrt(1 - y * y);
    const theta = golden * i;
    pts.push(new THREE.Vector3(Math.cos(theta) * r2 * radius, y * radius, Math.sin(theta) * r2 * radius));
  }
  return pts;
}

export default function OrbitalGlobe({ size = 300 }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const W = size, H = size;
    const el = mountRef.current;
    if (!el) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 1000);
    camera.position.set(0, 0, 340);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xa0c4ff, 0.9);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    // Wireframe globe shell r=80
    const meshGlobe = new THREE.Mesh(
      new THREE.IcosahedronGeometry(80, 3),
      new THREE.MeshBasicMaterial({ color: 0x3451D1, wireframe: true, transparent: true, opacity: 0.13 }),
    );
    scene.add(meshGlobe);

    // Inner glow sphere r=38
    const meshInner = new THREE.Mesh(
      new THREE.SphereGeometry(38, 48, 48),
      new THREE.MeshPhongMaterial({
        color: 0x0a1f6e, emissive: 0x3451D1, emissiveIntensity: 0.35,
        transparent: true, opacity: 0.88, shininess: 100,
      }),
    );
    scene.add(meshInner);

    // Logo billboard sprite at centre (in front of sphere)
    makeLogoTexture(256).then(tex => {
      if (!tex) return;
      const logo = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 1, depthWrite: false }),
      );
      logo.scale.set(58, 58, 1);
      logo.position.set(0, 0, 42);
      scene.add(logo);
    });

    // Ring 1 equator green r=68
    const meshRing1 = new THREE.Mesh(
      new THREE.TorusGeometry(68, 1.0, 8, 120),
      new THREE.MeshBasicMaterial({ color: 0x27AE60, transparent: true, opacity: 0.5 }),
    );
    meshRing1.rotation.x = Math.PI / 2;
    scene.add(meshRing1);

    // Ring 2 tilted blue r=90
    const meshRing2 = new THREE.Mesh(
      new THREE.TorusGeometry(90, 0.8, 8, 100),
      new THREE.MeshBasicMaterial({ color: 0x93C5FD, transparent: true, opacity: 0.38 }),
    );
    meshRing2.rotation.x = Math.PI / 2.6;
    meshRing2.rotation.z = Math.PI / 5;
    scene.add(meshRing2);

    // Ring 3 tilted gold r=112
    const meshRing3 = new THREE.Mesh(
      new THREE.TorusGeometry(112, 0.7, 8, 130),
      new THREE.MeshBasicMaterial({ color: 0xfde68a, transparent: true, opacity: 0.22 }),
    );
    meshRing3.rotation.x = Math.PI / 2.6;
    meshRing3.rotation.z = -Math.PI / 5;
    scene.add(meshRing3);

    // Icon sprites at r=138 — cleanly outside all rings
    const spriteObjs = [];
    const positions = fibonacciSphere(ICONS.length, 138);
    ICONS.forEach(({ label, color }, i) => {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: makeIconTexture(label, color, 128),
          transparent: true, opacity: 0.95, depthWrite: false,
        }),
      );
      sprite.scale.set(34, 34, 1);
      sprite.position.copy(positions[i]);
      scene.add(sprite);
      spriteObjs.push({ sprite, base: positions[i].clone(), phase: Math.random() * Math.PI * 2 });
    });

    // Background particles
    const pBuf = new Float32Array(240);
    for (let i = 0; i < 240; i++) pBuf[i] = (Math.random() - 0.5) * 280;
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pBuf, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 1.8, transparent: true, opacity: 0.3, sizeAttenuation: true }),
    );
    scene.add(particles);

    let animId;
    const clock = new THREE.Clock();
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      meshGlobe.rotation.y = t * 0.15;
      meshGlobe.rotation.x = t * 0.06;
      meshInner.rotation.y = t * 0.10;
      meshRing1.rotation.z = t * 0.20;
      meshRing2.rotation.z = -t * 0.14 + Math.PI / 5;
      meshRing3.rotation.z = t * 0.09 - Math.PI / 5;
      particles.rotation.y = t * 0.03;

      spriteObjs.forEach(({ sprite, base, phase }) => {
        const p = 1 + 0.04 * Math.sin(t * 1.0 + phase);
        sprite.position.set(base.x * p, base.y * p, base.z * p);
        sprite.material.opacity = 0.75 + 0.20 * Math.sin(t * 0.7 + phase);
      });

      renderer.render(scene, camera);
    };
    animate();

    const onMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / W - 0.5) * 2;
      const my = -((e.clientY - rect.top) / H - 0.5) * 2;
      scene.rotation.y += (mx * 0.35 - scene.rotation.y) * 0.05;
      scene.rotation.x += (my * 0.25 - scene.rotation.x) * 0.05;
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
      style={{ width: size, height: size, position: 'relative', flexShrink: 0, cursor: 'grab' }}
      aria-hidden="true"
    />
  );
}
