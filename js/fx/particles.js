// Footer: brand name built from a dot-matrix of particles that scatter around the cursor.
export function particleText(canvas, text = 'BALAROVERSEAS', opts = {}) {
  const { color = '#d4d4d4', hot = '#3b2cff', gap = 5, size = 2 } = opts;
  const g = canvas.getContext('2d');
  let parts = [], W = 0, H = 0, dpr = 1;
  const mouse = { x: -9999, y: -9999, on: false };

  function build() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Render the word once, then sample it on a grid.
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const o = off.getContext('2d');
    let fs = H * 0.95;
    o.font = `800 ${fs}px Saira, Arial, sans-serif`;
    const fit = W * 0.98 / o.measureText(text).width;
    fs = Math.min(fs, fs * fit);
    o.font = `800 ${fs}px Saira, Arial, sans-serif`;
    o.textAlign = 'center';
    o.textBaseline = 'middle';
    o.fillStyle = '#000';
    o.fillText(text, W / 2, H * 0.56);
    const data = o.getImageData(0, 0, W, H).data;

    const step = Math.max(3, Math.round(gap * (W / 1400) + 2));
    parts = [];
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        if (data[(y * W + x) * 4 + 3] > 128) parts.push({ hx: x, hy: y, x, y, vx: 0, vy: 0 });
      }
    }
    parts.size = Math.max(1.2, step * 0.42);
  }

  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true;
  });
  canvas.addEventListener('pointerleave', () => { mouse.on = false; mouse.x = mouse.y = -9999; });

  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    g.clearRect(0, 0, W, H);
    const R = Math.max(60, W * 0.07), s = parts.size || size;
    for (const p of parts) {
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      let heat = 0;
      if (d2 < R * R) {
        const d = Math.sqrt(d2) || 1, f = (1 - d / R);
        p.vx += (dx / d) * f * 3.2;
        p.vy += (dy / d) * f * 3.2;
        heat = f;
      }
      p.vx += (p.hx - p.x) * 0.06;
      p.vy += (p.hy - p.y) * 0.06;
      p.vx *= 0.82; p.vy *= 0.82;
      p.x += p.vx; p.y += p.vy;
      g.fillStyle = heat > 0.05 ? hot : color;
      g.fillRect(p.x, p.y, s, s);
    }
  }

  build();
  new ResizeObserver(build).observe(canvas);
  requestAnimationFrame(frame);
}
