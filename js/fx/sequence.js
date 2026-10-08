// Scroll-scrubbed image sequence (pre-rendered Blender frames) drawn on a canvas.
// Frames load progressively: first frame, then a coarse pass, then everything else,
// so scrubbing works immediately and sharpens as frames arrive.
export function sequencePlayer(canvas, { dir, count, ext = 'webp', fit = 'contain', align = 'center' }) {
  const g = canvas.getContext('2d');
  const frames = new Array(count).fill(null);
  let current = 0, W = 0, H = 0, dpr = 1;
  const url = (i) => `${dir}/f${String(i + 1).padStart(3, '0')}.${ext}`;

  function load(i) {
    if (frames[i] !== null) return Promise.resolve();
    frames[i] = false; // loading
    return new Promise((res) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { frames[i] = img; if (Math.abs(i - current) < 3) draw(); res(); };
      img.onerror = () => { frames[i] = null; res(); };
      img.src = url(i);
    });
  }

  function nearest(i) {
    for (let d = 0; d < count; d++) {
      if (frames[i - d]) return frames[i - d];
      if (frames[i + d]) return frames[i + d];
    }
    return null;
  }

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    if (!W || !H) return;
    canvas.width = W * dpr; canvas.height = H * dpr;
    draw();
  }

  function draw() {
    const img = nearest(current);
    if (!img || !W) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const s = fit === 'cover' ? Math.max(W / img.width, H / img.height) : Math.min(W / img.width, H / img.height);
    const w = img.width * s, h = img.height * s;
    const x = (W - w) / 2;
    const y = align === 'bottom' ? H - h : (H - h) / 2;
    g.drawImage(img, x, y, w, h);
  }

  new ResizeObserver(resize).observe(canvas);
  const ready = load(0).then(async () => {
    resize();
    const coarse = [];
    for (let i = 0; i < count; i += 6) coarse.push(load(i));
    await Promise.all(coarse);
    for (let i = 0; i < count; i++) await load(i);
  });

  return {
    ready,
    setProgress(p) {
      const i = Math.max(0, Math.min(count - 1, Math.round(p * (count - 1))));
      if (i === current) return;
      current = i;
      if (!frames[i]) load(i);
      draw();
    },
  };
}
