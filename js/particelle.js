export function esplosioneParticelle(coloreHex = '#e63946') {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let canvas = document.getElementById('canvas-particelle');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'canvas-particelle';
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '200';
    document.body.appendChild(canvas);
  }
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const cx = canvas.width / 2, cy = canvas.height * 0.35;
  const particelle = Array.from({ length: 120 }, () => {
    const a = Math.random() * Math.PI * 2, v = 3 + Math.random() * 9;
    return { x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, d: 3 + Math.random() * 4, vita: 1 };
  });
  let frame = 0;
  function anima() {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let vive = false;
    particelle.forEach((p) => {
      if (p.vita <= 0) return;
      vive = true;
      p.vx *= 0.985; p.vy += 0.18; p.x += p.vx; p.y += p.vy; p.vita -= 0.012;
      ctx.globalAlpha = Math.max(p.vita, 0);
      ctx.fillStyle = coloreHex;
      ctx.fillRect(p.x, p.y, p.d, p.d);
    });
    ctx.globalAlpha = 1;
    if (vive && frame < 240) requestAnimationFrame(anima);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  anima();
}
