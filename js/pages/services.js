import { $, $$, bootInnerPage } from '../common.js';
import { drawDotMap } from '../fx/dotmap.js';

const { ScrollTrigger } = window;

// Sticky service list follows the block in view
function serviceNav() {
  const links = $$('#svcNav a[href^="#"]');
  links.forEach((a) => {
    const block = $(a.getAttribute('href'));
    ScrollTrigger.create({
      trigger: block, start: 'top 55%', end: 'bottom 55%',
      onToggle: (s) => { if (s.isActive) links.forEach((l) => l.classList.toggle('on', l === a)); },
    });
  });
}

bootInnerPage(async () => {
  drawDotMap($('#heroMap'), {
    gap: 9, dot: 2.4, color: 'rgba(255,255,255,.28)', flicker: true,
    markers: [{ lat: 21.17, lon: 72.83, color: '#ffb36b' }, { lat: 23.13, lon: 113.26, color: '#7a6bff' }, { lat: 29.31, lon: 120.08, color: '#7a6bff' }],
  }).catch(() => {});
  drawDotMap($('#routeMap'), { gap: 6, dot: 2, color: '#3a3a3a' }).catch(() => {});
  serviceNav();
});
