import { drawDotMap } from './fx/dotmap.js';
import { particleText } from './fx/particles.js';

const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const range = (p, a, b) => clamp01((p - a) / (b - a));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
$('#yr').textContent = new Date().getFullYear();

// Scenes are loaded lazily so one failing WebGL scene never breaks the page.
async function scene(name, path, fn, ...args) {
  try {
    const mod = await import(path);
    return await mod[fn](...args);
  } catch (err) {
    console.warn(`[3D] ${name} unavailable:`, err);
    return null;
  }
}

// ---------------------------------------------------------------- content
const IMG = 'https://balaroverseas.com/wp-content/uploads/2026/02/';
const industries = [
  ['Home & Kitchenware', 'Modern household essentials & utility products.', 'home-and-kitchen-1-1200x800.png'],
  ['Health & Personal Care', 'Wellness, hygiene & healthcare solutions.', 'Health-and-Cosmetics-1200x800.png'],
  ['Baby Products', 'Safe, certified and trusted baby essentials.', 'baby-products-1200x800.png'],
  ['Beauty Products', 'Skincare, cosmetics & personal grooming.', 'beauty-and-cosmetics.png'],
  ['Home & Office Furniture', 'Functional and contemporary furniture.', 'home-and-office-furniture.png'],
  ['Mobile Accessories', 'High-demand electronic accessories.', 'mobile-accessories.png'],
  ['Sports, Fitness & Outdoors', 'Active lifestyle & performance gear.', 'sports-and-outdoor.png'],
  ['Toys & Games', 'Creative, educational & recreational.', 'toys-and-games.png'],
  ['Electronics', 'Gadgets, appliances & smart technology.', 'Electronics.png'],
];
$('#indGrid').innerHTML = industries.map(([t, d, img]) =>
  `<div class="ind-cell"><img src="${IMG}${img}" alt="${t}" loading="lazy"><h3>${t}</h3><p>${d}</p></div>`).join('');

// Split headings into words for reveal animations
function splitWords(el, cls = 'w', inner = 'wi') {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((n) => {
    const frag = document.createDocumentFragment();
    n.textContent.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) { frag.append(' '); return; }
      const w = document.createElement('span');
      w.className = cls;
      if (inner) {
        const i = document.createElement('span');
        i.className = inner;
        i.textContent = part;
        w.append(i);
      } else w.textContent = part;
      frag.append(w);
    });
    n.replaceWith(frag);
  });
}
$$('.split').forEach((el) => splitWords(el));
splitWords($('#revealText'), 'rw', null);

// ---------------------------------------------------------------- smooth scroll
let lenis = null;
if (!reduceMotion && window.Lenis) {
  lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
  window.lenis = lenis;
}
const menu = $('#menuPanel'), menuBtn = $('#menuBtn');
const setMenu = (open) => { menu.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', open); };
menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
$('#menuClose').addEventListener('click', () => setMenu(false));
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href');
  const target = id.length > 1 && $(id);
  if (!target) return;
  e.preventDefault();
  setMenu(false);
  if (lenis) lenis.scrollTo(target, { duration: 2, offset: id === '#top' ? 0 : -40 });
  else target.scrollIntoView({ behavior: 'smooth' });
}));

// Header: colour follows the section underneath, hides while scrolling down
const head = $('.site-head');
let lastY = 0;
ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate: (s) => {
    const y = s.scroll();
    head.classList.toggle('hide', y > 300 && y > lastY + 2 && !menu.classList.contains('open'));
    if (y < lastY - 2) head.classList.remove('hide');
    lastY = y;
    const probe = document.elementsFromPoint(innerWidth / 2, 80).find((el) => el.closest('[data-theme]') && !el.closest('.site-head'));
    const sec = probe && probe.closest('[data-theme]');
    if (sec) head.dataset.theme = sec.dataset.dynTheme || sec.dataset.theme;
  },
});

// ---------------------------------------------------------------- cursor
if (finePointer && !reduceMotion) {
  const c = $('.cursor');
  const qx = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3' });
  const qy = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3' });
  addEventListener('pointermove', (e) => { qx(e.clientX); qy(e.clientY); });
  document.addEventListener('pointerover', (e) => c.classList.toggle('hover', !!e.target.closest('a,button,.ind-cell,.d-card')));
}

// ---------------------------------------------------------------- FAQ
$$('.qa button').forEach((b) => b.addEventListener('click', () => {
  const qa = b.parentElement, open = qa.classList.contains('open');
  $$('.qa').forEach((q) => { q.classList.remove('open'); $('.ans', q).style.maxHeight = 0; });
  if (!open) { qa.classList.add('open'); $('.ans', qa).style.maxHeight = $('.ans', qa).scrollHeight + 'px'; }
  setTimeout(() => ScrollTrigger.refresh(), 480);
}));

// ---------------------------------------------------------------- preloader
const CITIES = ['Surat', 'Mumbai', 'Delhi', 'Ahmedabad', 'Kolkata', 'Chennai', 'Bengaluru', 'Hyderabad', 'Jaipur', 'Pune', 'Nhava Sheva', 'Mundra', 'Hazira', 'Kandla'];
const PORTS = ['Guangzhou', 'Yiwu', 'Shenzhen', 'Ningbo', 'Shanghai', 'Qingdao', 'Xiamen', 'Foshan', 'Dongguan', 'Tianjin', 'Hong Kong', 'Singapore', 'Dubai', 'Colombo'];
$('#plLeft').innerHTML = CITIES.map((c) => `<li>${c}</li>`).join('');
$('#plRight').innerHTML = PORTS.map((c) => `<li>${c}</li>`).join('');
const plItems = $$('.pl-list li');
const plMapReady = drawDotMap($('#plMap'), {
  gap: 6, dot: 2, color: '#5a5a5a', flicker: true,
  markers: [{ lat: 21.17, lon: 72.83, color: '#ff8a3d' }, { lat: 23.13, lon: 113.26, color: '#3b2cff' }],
}).catch(() => null);

const load = { v: 0 };
function paintLoad() {
  const v = Math.round(load.v);
  $('#plPct').textContent = String(v).padStart(3, '0');
  $('#plBar').style.width = v + '%';
  plItems.forEach((li, i) => li.classList.toggle('on', (i * 7 + v) % 9 === 0));
}
const fakeLoad = gsap.to(load, { v: 86, duration: 3, ease: 'power1.out', onUpdate: paintLoad });

// ---------------------------------------------------------------- reveals
function setupReveals() {
  $$('.split').forEach((el) => {
    if (el.closest('.hero')) return;
    gsap.from($$('.wi', el), {
      yPercent: 115, duration: 1.1, ease: 'power4.out', stagger: 0.05,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count, suf = el.dataset.suffix || '', o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(o, { v: end, duration: 2.2, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('en-IN') + suf; } }),
    });
  });
  const words = $$('#revealText .rw');
  ScrollTrigger.create({
    trigger: '#revealText', start: 'top 75%', end: 'bottom 35%',
    onUpdate: (s) => { const n = Math.round(s.progress * words.length); words.forEach((w, i) => w.classList.toggle('on', i < n)); },
  });
  $$('.ind-cell, .d-card, .t-row').forEach((el) => gsap.from(el, {
    y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true },
  }));
}

// ---------------------------------------------------------------- hero (globe → atmosphere)
function setupHero(globe) {
  const hero = $('.hero');
  ScrollTrigger.create({
    trigger: hero, start: 'top top', end: 'bottom bottom',
    onUpdate: (s) => {
      const p = s.progress;
      globe && globe.setScroll(p);
      hero.dataset.dynTheme = p > 0.9 ? 'light' : 'dark';
    },
  });
  gsap.to('.hero-copy', { y: -160, opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '22% top', scrub: true } });
  // the atmosphere is fully white exactly when the hero ends, so the intro follows with no gap
  gsap.fromTo('#atmo', { y: 0 }, {
    y: () => -2.85 * innerHeight, ease: 'none',
    scrollTrigger: { trigger: hero, start: '12% top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true },
  });
  gsap.to('.hero-globe', { opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: '30% top', end: '50% top', scrub: true } });
}

// ---------------------------------------------------------------- journey overlays
function setupJourney(journey) {
  const sec = $('#services');
  const giant = $('#jGiant'), panel = $('#jPanel'), cards = $('#jCards'), rel = $('#jRel'), speed = $('.j-speed');
  const feats = $$('.j-feat');
  let cardsMax = 0;
  const measure = () => { cardsMax = Math.max(0, cards.scrollWidth - innerWidth + 40); };
  measure();
  addEventListener('resize', measure);

  ScrollTrigger.create({
    trigger: sec, start: 'top top', end: 'bottom bottom',
    onUpdate: (s) => {
      const P = s.progress;
      journey && journey.setProgress(P);
      // B: services panel
      const show = range(P, 0.3, 0.37) - range(P, 0.6, 0.65);
      panel.style.transform = `translateY(${(1 - show) * 105}%)`;
      cards.style.transform = `translateX(${-range(P, 0.37, 0.59) * cardsMax}px)`;
      giant.style.opacity = range(P, 0.25, 0.3) - range(P, 0.6, 0.64);
      giant.style.transform = `translateX(${-range(P, 0.25, 0.64) * 55}%)`;
      speed.style.opacity = range(P, 0.27, 0.3);
      // C: reliability overlay
      // text only appears once the truck has turned and the junction has left the screen
      const r = range(P, 0.75, 0.79);
      rel.style.opacity = r;
      const idx = Math.min(feats.length - 1, Math.floor(range(P, 0.79, 0.99) * feats.length));
      feats.forEach((f, i) => f.classList.toggle('on', r > 0.5 && i === idx));
    },
  });
}

// ---------------------------------------------------------------- ship overlays
function setupShip(ship) {
  const sec = $('#why');
  const title = $('#whyTitle'), veil = $('#shipVeil');
  const cards = $$('.why-card');
  const layout = () => {
    const mob = innerWidth < 900;
    cards.forEach((c, i) => {
      const left = i % 2 === 0;
      c.style.left = mob ? `calc(50% - ${c.offsetWidth / 2}px)` : left ? '8vw' : 'auto';
      c.style.right = !mob && !left ? '8vw' : 'auto';
      c.style.top = '50%';
    });
  };
  layout();
  addEventListener('resize', layout);
  ScrollTrigger.create({
    trigger: sec, start: 'top top', end: 'bottom bottom',
    onUpdate: (s) => {
      const S = s.progress;
      ship && ship.setProgress(S);
      title.style.opacity = 1 - range(S, 0.1, 0.16);
      title.style.transform = `translateY(${-range(S, 0.06, 0.16) * 120}px)`;
      cards.forEach((c, i) => {
        const a = 0.14 + i * 0.105, t = range(S, a, a + 0.24);
        const y = (1 - t * 2) * innerHeight * 0.55;
        c.style.transform = `translateY(calc(-50% + ${y}px))`;
        c.style.opacity = Math.min(1, Math.sin(t * Math.PI) * 2.2);
      });
      veil.style.opacity = range(S, 0.9, 1);
      sec.dataset.dynTheme = S > 0.93 ? 'light' : 'dark';
    },
  });
}

// ---------------------------------------------------------------- plane + arc
function setupPlane(plane) {
  if (!plane) return;
  ScrollTrigger.create({ trigger: '#testimonials', start: 'top top', end: 'bottom bottom', onUpdate: (s) => plane.setProgress(s.progress) });
}

// Keep trigger positions right when late images change the page height
let refreshTimer = 0, lastH = 0;
new ResizeObserver(() => {
  const h = document.body.scrollHeight;
  if (Math.abs(h - lastH) < 2) return;
  lastH = h;
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
}).observe(document.body);

// Curved section hand-offs: the rounded top flattens as the section rises into view
function setupCurves() {
  $$('.curve').forEach((el) => {
    gsap.fromTo(el, { '--r': '16vh' }, {
      '--r': '0vh', ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'top top', scrub: true },
    });
  });
}

// ---------------------------------------------------------------- boot
async function boot() {
  await Promise.race([document.fonts.ready, wait(2500)]);
  const [globe, journey, ship, plane] = await Promise.all([
    scene('globe', './scenes/globe.js', 'initGlobe', $('#globe'), $('#globeLabels')),
    scene('journey', './scenes/journey.js', 'initJourney', $('#journeyCanvas'), (v) => { $('#jSpeed').textContent = String(v).padStart(2, '0'); }),
    scene('ship', './scenes/ship.js', 'initShip', $('#shipCanvas')),
    scene('plane', './scenes/plane.js', 'initPlane', $('#planeCanvas')),
    plMapReady,
  ]);

  setupHero(globe);
  setupJourney(journey);
  setupShip(ship);
  setupPlane(plane);
  setupCurves();
  setupReveals();
  drawDotMap($('#footMap'), { gap: 9, dot: 3, color: '#dadada', markers: [{ lat: 21.17, lon: 72.83, color: '#3b2cff' }, { lat: 23.13, lon: 113.26, color: '#3b2cff' }] }).catch(() => {});
  particleText($('#footParticles'), 'BALAROVERSEAS');

  fakeLoad.kill();
  gsap.to(load, {
    v: 100, duration: 0.6, onUpdate: paintLoad,
    onComplete: () => {
      gsap.to('#preloader', { yPercent: -100, duration: 1.1, ease: 'power4.inOut', delay: 0.15, onComplete: () => $('#preloader').remove() });
      document.body.classList.remove('loading');
      lenis && lenis.start();
      globe && globe.intro();
      gsap.from('.hero .wi', { yPercent: 115, duration: 1.3, ease: 'power4.out', stagger: 0.06, delay: 0.6 });
      gsap.from(['.hero .kicker', '.hero-copy p', '.hero .cta-row'], { y: 24, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.1, delay: 0.8 });
      ScrollTrigger.refresh();
    },
  });
}
boot();
