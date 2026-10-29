// Hero 3D: the Caesar logo struck as a gold medallion, in Three.js.
// Build: npm run build:3d  →  vendor/hero3d.js (loaded lazily by app.js on capable devices).
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, InstancedMesh, Points, Object3D,
  PlaneGeometry, CircleGeometry, CylinderGeometry, TorusGeometry, SphereGeometry, BufferGeometry, BufferAttribute,
  MeshStandardMaterial, MeshPhysicalMaterial, PointsMaterial,
  CanvasTexture, SRGBColorSpace, NoColorSpace, ACESFilmicToneMapping, AdditiveBlending, Color,
  PointLight, DirectionalLight, AmbientLight, PMREMGenerator, MathUtils, Clock,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const GOLD = new Color('#d9a94a');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);

const loadImage = (src) => new Promise((ok, bad) => {
  const im = new Image();
  im.decoding = 'async';
  im.onload = () => ok(im);
  im.onerror = bad;
  im.src = src;
});

const canvas2d = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d', { willReadFrequently: true })];
};

// Height, normal and metal/rough maps derived from the logo itself, so the bust stands out in relief.
function reliefMaps(img, size) {
  const [hc, hx] = canvas2d(size, size);
  hx.filter = `blur(${Math.round(size / 220)}px) grayscale(1)`;
  hx.drawImage(img, 0, 0, size, size);
  hx.filter = 'none';
  const hd = hx.getImageData(0, 0, size, size);
  const H = new Float32Array(size * size);
  for (let i = 0; i < H.length; i++) {
    const l = hd.data[i * 4] / 255;
    H[i] = smooth(clamp((l - 0.12) / 0.75, 0, 1));
    const v = Math.round(H[i] * 255);
    hd.data[i * 4] = hd.data[i * 4 + 1] = hd.data[i * 4 + 2] = v;
  }
  hx.putImageData(hd, 0, 0);

  const [nc, nx] = canvas2d(size, size);
  const nd = nx.createImageData(size, size);
  const [mc, mx] = canvas2d(size, size);
  const md = mx.createImageData(size, size);
  const at = (x, y) => H[clamp(y, 0, size - 1) * size + clamp(x, 0, size - 1)];
  const k = size / 70;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const du = at(x + 1, y) - at(x - 1, y);
      const dv = at(x, y - 1) - at(x, y + 1);
      let nxv = -du * k, nyv = -dv * k, nz = 1;
      const len = Math.hypot(nxv, nyv, nz);
      nxv /= len; nyv /= len; nz /= len;
      nd.data[i] = (nxv * 0.5 + 0.5) * 255;
      nd.data[i + 1] = (nyv * 0.5 + 0.5) * 255;
      nd.data[i + 2] = (nz * 0.5 + 0.5) * 255;
      nd.data[i + 3] = 255;
      const h = H[y * size + x];
      md.data[i] = 255;
      md.data[i + 1] = (0.62 - h * 0.4) * 255; // roughness: gold polished, enamel satin
      md.data[i + 2] = (0.08 + h * 0.92) * 255; // metalness: gold is metal, the black ground is enamel
      md.data[i + 3] = 255;
    }
  }
  nx.putImageData(nd, 0, 0);
  mx.putImageData(md, 0, 0);
  return { height: hc, normal: nc, orm: mc };
}

function circleAlpha(size, r) {
  const [c, x] = canvas2d(size, size);
  x.fillStyle = '#000'; x.fillRect(0, 0, size, size);
  x.fillStyle = '#fff'; x.beginPath(); x.arc(size / 2, size / 2, (size / 2) * r, 0, Math.PI * 2); x.fill();
  return c;
}

async function backFace(size) {
  try { await Promise.race([document.fonts.load('600 120px "El Messiri"'), new Promise((r) => setTimeout(r, 1500))]); } catch (_) {}
  const [c, x] = canvas2d(size, size);
  const g = x.createRadialGradient(size * 0.42, size * 0.38, size * 0.05, size / 2, size / 2, size * 0.55);
  g.addColorStop(0, '#f2cf7c'); g.addColorStop(0.55, '#b9822e'); g.addColorStop(1, '#5a3a12');
  x.fillStyle = g; x.fillRect(0, 0, size, size);
  x.strokeStyle = 'rgba(60,35,8,.55)'; x.lineWidth = size * 0.012;
  for (const r of [0.44, 0.405]) { x.beginPath(); x.arc(size / 2, size / 2, size * r, 0, Math.PI * 2); x.stroke(); }
  x.fillStyle = 'rgba(48,28,6,.85)';
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.direction = 'rtl';
  x.font = `600 ${size * 0.2}px "El Messiri", serif`;
  x.fillText('سيزر', size / 2, size * 0.47);
  x.direction = 'ltr';
  x.font = `500 ${size * 0.05}px Georgia, serif`;
  x.fillText('CAFE · & · RESTAURANT', size / 2, size * 0.63);
  x.font = `500 ${size * 0.045}px Georgia, serif`;
  x.fillText('MMXXVI', size / 2, size * 0.3);
  return c;
}

// A laurel wreath: two branches rising from the bottom, leaves in pairs along a thin stem.
function laurel(material, lite) {
  const group = new Group();
  const per = lite ? 18 : 26;
  const from = -80, to = 62, r = 1.16;
  const leaf = new SphereGeometry(1, 12, 8);
  const mesh = new InstancedMesh(leaf, material, per * 2 * 2 + 2);
  const o = new Object3D();
  let n = 0;
  for (const side of [1, -1]) {
    const stem = new Mesh(new TorusGeometry(r, 0.008, 6, 90, MathUtils.degToRad(to - from)), material);
    stem.rotation.z = side === 1 ? MathUtils.degToRad(from) : Math.PI - MathUtils.degToRad(to);
    group.add(stem);
    for (let i = 0; i < per; i++) {
      const t = i / (per - 1);
      const deg = from + t * (to - from);
      const a = MathUtils.degToRad(side === 1 ? deg : 180 - deg);
      const grow = side === 1 ? a + Math.PI / 2 : a - Math.PI / 2; // direction the branch grows
      const sz = 1 - t * 0.5;
      for (const out of [1, -1]) {
        const lean = grow + out * side * 0.75;
        const len = 0.075 * sz;
        o.position.set(Math.cos(a) * r + Math.cos(lean) * len, Math.sin(a) * r + Math.sin(lean) * len, 0.01 + out * 0.004);
        o.rotation.set(0, out * 0.35, lean);
        o.scale.set(len, 0.027 * sz, 0.014);
        o.updateMatrix();
        mesh.setMatrixAt(n++, o.matrix);
      }
    }
    // a top leaf at each tip
    const a = MathUtils.degToRad(side === 1 ? to + 3 : 177 - to);
    const grow = side === 1 ? a + Math.PI / 2 : a - Math.PI / 2;
    o.position.set(Math.cos(a) * r + Math.cos(grow) * 0.04, Math.sin(a) * r + Math.sin(grow) * 0.04, 0.012);
    o.rotation.set(0, 0, grow);
    o.scale.set(0.05, 0.016, 0.012);
    o.updateMatrix();
    mesh.setMatrixAt(n++, o.matrix);
  }
  mesh.count = n;
  group.add(mesh);
  return group;
}

function dust(count, tex) {
  const g = new BufferGeometry();
  const p = new Float32Array(count * 3);
  const sp = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    p[i * 3] = (Math.random() - 0.5) * 6.5;
    p[i * 3 + 1] = (Math.random() - 0.5) * 5;
    p[i * 3 + 2] = -2.4 + Math.random() * 3.6;
    sp[i] = 0.05 + Math.random() * 0.16;
  }
  g.setAttribute('position', new BufferAttribute(p, 3));
  const m = new PointsMaterial({ size: 0.045, map: tex, color: GOLD, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending, sizeAttenuation: true });
  const pts = new Points(g, m);
  pts.userData.speed = sp;
  return pts;
}

function softDot() {
  const [c, x] = canvas2d(64, 64);
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(0.35, 'rgba(255,205,120,.6)'); g.addColorStop(1, 'rgba(255,190,90,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

async function create(logoSrc) {
  const mobile = matchMedia('(max-width: 60rem), (pointer: coarse)').matches;
  const lite = mobile || (navigator.hardwareConcurrency || 8) <= 4;

  const renderer = new WebGLRenderer({ antialias: !lite, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 1.85));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = 'hero3d';
  canvas.setAttribute('aria-hidden', 'true');

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const camera = new PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 5.6);

  scene.add(new AmbientLight(0xfff1dc, 0.15));
  const key = new PointLight(0xffd89a, 26, 12, 1.6);
  key.position.set(1.6, 1.4, 2.6);
  scene.add(key);
  const rim = new DirectionalLight(0xffb45c, 1.6);
  rim.position.set(-3, 2, -2.5);
  scene.add(rim);
  const fill = new DirectionalLight(0x9fb6ff, 0.25);
  fill.position.set(-2, -1.5, 3);
  scene.add(fill);

  const raw = await loadImage(logoSrc);
  const size = lite ? 512 : 768;
  // Inset the logo so its wordmark sits inside the round rim.
  const [img, ix] = canvas2d(size, size);
  const inset = 0.84, off = (size * (1 - inset)) / 2, ls = size * inset;
  // fill with the logo's own ground colour, sampled beside the wordmark
  const [sc, sx] = canvas2d(32, 32);
  sx.drawImage(raw, raw.width * 0.02, raw.height * 0.8, raw.width * 0.12, raw.height * 0.18, 0, 0, 32, 32);
  const sd = sx.getImageData(0, 0, 32, 32).data;
  let rr = 0, gg = 0, bb = 0;
  for (let i = 0; i < sd.length; i += 4) { rr += sd[i]; gg += sd[i + 1]; bb += sd[i + 2]; }
  const px = sd.length / 4;
  ix.fillStyle = `rgb(${rr / px | 0},${gg / px | 0},${bb / px | 0})`; ix.fillRect(0, 0, size, size);
  const [fc, fx] = canvas2d(ls, ls);
  fx.drawImage(raw, 0, 0, ls, ls);
  const [mk, mx] = canvas2d(ls, ls); // mask: soft round edge, wordmark kept whole
  const fade = mx.createRadialGradient(ls / 2, ls / 2, ls * 0.36, ls / 2, ls / 2, ls * 0.5);
  fade.addColorStop(0, '#000'); fade.addColorStop(1, 'rgba(0,0,0,0)');
  mx.fillStyle = fade; mx.fillRect(0, 0, ls, ls);
  const word = mx.createLinearGradient(0, ls * 0.62, 0, ls * 0.98);
  word.addColorStop(0, 'rgba(0,0,0,0)'); word.addColorStop(0.2, '#000'); word.addColorStop(0.92, '#000'); word.addColorStop(1, 'rgba(0,0,0,0)');
  mx.fillStyle = word; mx.fillRect(ls * 0.14, ls * 0.62, ls * 0.72, ls * 0.36);
  fx.globalCompositeOperation = 'destination-in';
  fx.drawImage(mk, 0, 0);
  ix.drawImage(fc, off, off * 0.7);
  const maps = reliefMaps(img, size);
  const [lc, lx] = canvas2d(size, size);
  lx.drawImage(img, 0, 0, size, size);

  const tex = (c, srgb) => { const t = new CanvasTexture(c); t.colorSpace = srgb ? SRGBColorSpace : NoColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t; };

  const goldMetal = new MeshPhysicalMaterial({ color: 0xd8a650, metalness: 1, roughness: 0.28, clearcoat: 0.4, clearcoatRoughness: 0.25 });
  const darkGold = new MeshStandardMaterial({ color: 0x8a5a1c, metalness: 1, roughness: 0.42 });

  const medal = new Group();
  const segs = lite ? 200 : 320;
  const faceGeo = new PlaneGeometry(2, 2, segs, segs);
  const face = new Mesh(faceGeo, new MeshStandardMaterial({
    map: tex(lc, true),
    normalMap: tex(maps.normal, false),
    displacementMap: tex(maps.height, false),
    displacementScale: 0.1,
    displacementBias: -0.005,
    roughnessMap: tex(maps.orm, false),
    metalnessMap: tex(maps.orm, false),
    metalness: 1,
    roughness: 1,
    alphaMap: tex(circleAlpha(512, 0.975), false),
    alphaTest: 0.5,
  }));
  face.material.normalScale.set(1.15, 1.15);
  medal.add(face);

  const ring = new Mesh(new TorusGeometry(1, 0.05, 24, 160), goldMetal);
  medal.add(ring);
  const ringBack = new Mesh(new TorusGeometry(1, 0.045, 16, 160), goldMetal);
  ringBack.position.z = -0.09;
  medal.add(ringBack);
  const side = new Mesh(new CylinderGeometry(1.02, 1.02, 0.09, 160, 1, true), darkGold);
  side.rotation.x = Math.PI / 2;
  side.position.z = -0.045;
  medal.add(side);
  const back = new Mesh(new CircleGeometry(1, 160), new MeshStandardMaterial({ map: tex(await backFace(lite ? 512 : 768), true), metalness: 0.95, roughness: 0.38 }));
  back.rotation.y = Math.PI;
  back.position.z = -0.09;
  medal.add(back);

  const wreath = laurel(goldMetal, lite);
  const stage = new Group();
  stage.add(medal);
  stage.add(wreath);
  scene.add(stage);

  const motes = dust(lite ? 220 : 560, softDot());
  scene.add(motes);
  try { await renderer.compileAsync(scene, camera); } catch (_) {}

  // ---------- interaction ----------
  const state = {
    tx: 0, ty: 0, x: 0, y: 0,           // pointer tilt target / current
    spin: 0, vel: 0, dragging: false,    // free spin from dragging
    idleAt: 0, scroll: 0, intro: 0,
  };
  let host = null;
  let hero = null;
  let visible = false;
  let raf = 0;
  const clock = new Clock();

  const onPointer = (e) => {
    if (!host || e.pointerType === 'touch') return;
    const r = host.getBoundingClientRect();
    state.tx = clamp(((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)), -1, 1);
    state.ty = clamp(((e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)), -1, 1);
  };
  window.addEventListener('pointermove', onPointer, { passive: true });

  let lastTilt = 0;
  window.addEventListener('deviceorientation', (e) => {
    if (e.gamma == null || e.beta == null) return;
    lastTilt = performance.now();
    state.tx = clamp(e.gamma / 30, -1, 1);
    state.ty = clamp((e.beta - 45) / 30, -1, 1);
  }, { passive: true });

  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY, t: performance.now(), on: false, id: e.pointerId };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.on) {
      if (Math.abs(e.clientY - drag.y) > Math.abs(dx) && Math.abs(e.clientY - drag.y) > 8) { drag = null; return; }
      if (Math.abs(dx) < 5) return;
      drag.on = true;
      state.dragging = true;
      canvas.classList.add('is-drag');
      try { canvas.setPointerCapture(drag.id); } catch (_) {}
    }
    const now = performance.now();
    const d = (e.clientX - drag.x) * 0.012;
    state.spin += d;
    state.vel = d / Math.max(16, now - drag.t) * 16;
    drag.x = e.clientX; drag.t = now;
    wake();
  });
  const endDrag = () => {
    if (!drag) return;
    drag = null;
    state.dragging = false;
    state.idleAt = performance.now();
    canvas.classList.remove('is-drag');
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('lostpointercapture', endDrag);

  const resize = () => {
    if (!host) return;
    const w = host.clientWidth, h = host.clientHeight || w;
    if (!w) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = 5.6 / Math.min(1, camera.aspect * 1.02);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) wake(); }, { rootMargin: '80px' });

  const frame = () => {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.1);
    const t = clock.elapsedTime;

    state.intro = Math.min(1, state.intro + dt / 1.8);
    const intro = 1 - Math.pow(1 - state.intro, 3);

    if (performance.now() - lastTilt > 1200 && !matchMedia('(hover: hover)').matches) {
      state.tx = Math.sin(t * 0.35) * 0.45;
      state.ty = Math.sin(t * 0.27) * 0.25;
    }
    state.x += (state.tx - state.x) * Math.min(1, dt * 3.2);
    state.y += (state.ty - state.y) * Math.min(1, dt * 3.2);

    if (!state.dragging) {
      state.spin += state.vel;
      state.vel *= Math.pow(0.04, dt);
      if (Math.abs(state.vel) < 0.002 && performance.now() - state.idleAt > 900) {
        const home = Math.round(state.spin / (Math.PI * 2)) * Math.PI * 2;
        state.spin += (home - state.spin) * Math.min(1, dt * 2.2);
      }
    }

    if (hero) {
      const r = hero.getBoundingClientRect();
      state.scroll = clamp(-r.top / Math.max(1, r.height), 0, 1);
    }
    const sc = state.scroll;

    stage.position.y = sc * 0.9 + Math.sin(t * 0.9) * 0.035;
    stage.position.z = -sc * 1.4 - (1 - intro) * 6;
    stage.rotation.x = state.y * 0.32 + sc * 0.55;
    stage.rotation.z = Math.sin(t * 0.5) * 0.015;
    medal.rotation.y = state.x * 0.5 + state.spin + (1 - intro) * Math.PI * 2.5 + Math.sin(t * 0.6) * 0.06;
    wreath.rotation.y = state.x * 0.35 + Math.sin(t * 0.6 + 0.6) * 0.05;
    wreath.rotation.z = Math.sin(t * 0.4) * 0.02;

    key.position.x = 0.8 + state.x * 2.6;
    key.position.y = 0.9 - state.y * 2.2;
    key.intensity = 26 * intro;

    const pos = motes.geometry.attributes.position;
    const sp = motes.userData.speed;
    for (let i = 0; i < sp.length; i++) {
      let y = pos.array[i * 3 + 1] + sp[i] * dt;
      if (y > 2.6) y = -2.6;
      pos.array[i * 3 + 1] = y;
      pos.array[i * 3] += Math.sin(t * 0.6 + i) * 0.0009;
    }
    pos.needsUpdate = true;
    motes.material.opacity = 0.75 * intro;
    motes.rotation.y = state.x * 0.12;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };
  const wake = () => { if (!raf && visible && !document.hidden) { clock.getDelta(); raf = requestAnimationFrame(frame); } };
  document.addEventListener('visibilitychange', wake);
  window.addEventListener('scroll', wake, { passive: true });

  const mount = (figure) => {
    if (!figure) return;
    if (host) { ro.unobserve(host); io.unobserve(host); }
    host = figure;
    hero = figure.closest('.hero') || figure;
    figure.append(canvas);
    ro.observe(figure);
    io.observe(figure);
    resize();
    renderer.render(scene, camera);
    requestAnimationFrame(() => figure.classList.add('is-3d'));
    wake();
  };

  return { mount };
}

let api = null;
export async function start(figure) {
  if (!api) {
    const src = figure.querySelector('img')?.currentSrc || figure.querySelector('img')?.src;
    if (!src) return null;
    api = await create(src);
  }
  api.mount(figure);
  return api;
}
