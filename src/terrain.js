// Ridged-multifractal terrain background (valley layout), ported from the
// "Ridged Terrain Map" sketch. Draws a full-viewport map into #terrain,
// behind the stamp canvas. The seed is picked once per page load, so resizing
// or toggling the theme redraws the same map.

const SETTINGS = {
  cell: 28,
  scale: 0.10,
  octaves: 5,
  lacunarity: 2.0,
  gain: 0.55,
  thresholds: [0.32, 0.40, 0.64, 0.80, 0.94],
  jitter: 0.35,
  showGrid: true,
};

const BANDS = [
  { name: 'Water',     color: '#8FCDB9' },
  { name: 'Shore',     color: '#97B264' },
  { name: 'Fields',    color: '#7EAA62' },
  { name: 'Hills',     color: '#5C8858' },
  { name: 'Mountains', color: '#6F928C' },
  { name: 'Snow',      color: '#AEC4C1' },
].map((b, i) => ({ ...b, max: SETTINGS.thresholds[i] ?? 1.01 }));

// --- seeded PRNG ---
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// --- seeded gradient (Perlin-style) noise, returns roughly -1..1 ---
function makePerlin2D(seedValue) {
  const rand = mulberry32(seedValue);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = p[i]; p[i] = p[j]; p[j] = t;
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + t * (b - a);
  const grad = (hash, x, y) => {
    const angle = (hash & 7) * (Math.PI / 4);
    return Math.cos(angle) * x + Math.sin(angle) * y;
  };
  return function perlin2D(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = fade(xf), v = fade(yf);
    const aa = perm[perm[X] + Y], ba = perm[perm[X + 1] + Y];
    const ab = perm[perm[X] + Y + 1], bb = perm[perm[X + 1] + Y + 1];
    const x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
    const x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);
    return lerp(x1, x2, v);
  };
}

// --- ridged multifractal: signed noise in, height 0..1 out ---
function makeRidgedMF(perlin, { octaves, lacunarity, gain, offset = 1.0 }) {
  return function ridged(x, y) {
    let frequency = 1, amplitude = 0.5, prev = 1, sum = 0, ampSum = 0;
    for (let o = 0; o < octaves; o++) {
      let n = perlin(x * frequency, y * frequency);
      n = offset - Math.abs(n);
      n = n * n * prev;
      sum += n * amplitude;
      ampSum += amplitude;
      prev = n;
      frequency *= lacunarity;
      amplitude *= gain;
    }
    return ampSum > 0 ? sum / ampSum : 0;
  };
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Meandering canyon centerline: a main stem plus one tributary that joins
// it, each bent by sine harmonics and noise, plus one peanut-shaped lake
// placed clear of the river.
function makeValleyPath(cols, rows, seed) {
  const rng = mulberry32(seed + 909);
  const warp = makePerlin2D(seed + 411);

  function bendFn(ampBase, freqBase, warpSeed) {
    const h1 = { a: ampBase * (0.7 + rng() * 0.6), f: freqBase * (0.6 + rng() * 0.8), p: rng() * Math.PI * 2 };
    const h2 = { a: ampBase * (0.3 + rng() * 0.4), f: freqBase * (1.8 + rng() * 1.4), p: rng() * Math.PI * 2 };
    return (t) =>
      Math.sin(t * Math.PI * 2 * h1.f + h1.p) * h1.a
      + Math.sin(t * Math.PI * 2 * h2.f + h2.p) * h2.a
      + warp(t * 2.2 + warpSeed, warpSeed * 0.7) * ampBase * 0.5;
  }

  const mainAmp = rows * (0.14 + rng() * 0.06);
  const mainBend = bendFn(mainAmp, 1.1, rng() * 50);
  const mainBase = rows * (0.35 + rng() * 0.3);
  const mainJ = (i) => mainBase + mainBend(i / cols);

  const splitAt = Math.floor(cols * (0.3 + rng() * 0.25));
  const dir = rng() < 0.5 ? -1 : 1;
  const tribAmp = rows * (0.08 + rng() * 0.05);
  const tribBend = bendFn(tribAmp, 1.6, rng() * 50);
  const spread = rows * (0.22 + rng() * 0.16) * dir;
  const tribJ = (i) => {
    const t = (i - splitAt) / Math.max(1, cols - splitAt);
    return mainJ(splitAt) + spread * t + tribBend(t) * (0.4 + t * 0.6);
  };

  const riverDist = (i, j) => {
    let d = Math.abs(j - mainJ(i));
    if (i >= splitAt) d = Math.min(d, Math.abs(j - tribJ(i)));
    return d;
  };

  const halfWidth = rows * 0.16;
  const lakeR = Math.max(1.7, rows * 0.052);
  const riverThread = halfWidth * 0.3;
  const lakeAngle = rng() * Math.PI;
  const lobes = [
    { off: -0.625 * lakeR, r: 0.85 * lakeR },
    { off:  0.625 * lakeR, r: 0.65 * lakeR },
  ];
  const reach = 0.625 * lakeR + 0.85 * lakeR;
  const needed = reach * 1.2 + riverThread + 1;
  let lake = null, bestClear = -Infinity;
  for (let n = 0; n < 240; n++) {
    const ci = 4 + rng() * Math.max(1, cols - 8);
    const cj = 4 + rng() * Math.max(1, rows - 8);
    const d = riverDist(ci, cj);
    if (d > halfWidth * 2.1) continue;
    const clear = d - needed;
    if (clear > bestClear) { bestClear = clear; lake = { ci, cj }; }
    if (clear >= 0) { lake = { ci, cj }; break; }
  }
  if (!lake) lake = { ci: cols * 0.5, cj: rows * 0.5 };
  lake.ax = Math.cos(lakeAngle);
  lake.ay = Math.sin(lakeAngle);
  lake.lobes = lobes;
  lake.noise = makePerlin2D(seed + 733);

  return { mainJ, tribJ, splitAt, lake };
}

function valleyHeight(rawHeight, i, j, rows, path) {
  const halfWidth = rows * 0.16;
  let dist = Math.abs(j - path.mainJ(i));
  if (i >= path.splitAt) dist = Math.min(dist, Math.abs(j - path.tribJ(i)));
  const edgeFactor = smoothstep(0, 1, Math.max(0, Math.min(1, dist / halfWidth)));
  const centerHeight = rawHeight * 0.55;
  const edgeHeight = 0.8 + rawHeight * 0.15;
  let h = centerHeight * (1 - edgeFactor) + edgeHeight * edgeFactor;

  const riverCore = 1 - smoothstep(0, halfWidth * 0.3, dist);
  h = h * (1 - riverCore) + (rawHeight * 0.12) * riverCore;

  const L = path.lake;
  const wobble = 1 + 0.12 * L.noise(i * 0.45 + 17, j * 0.45 + 17);
  let ld = Infinity;
  for (const lobe of L.lobes) {
    const lx = L.ci + L.ax * lobe.off, ly = L.cj + L.ay * lobe.off;
    ld = Math.min(ld, Math.hypot(i - lx, j - ly) / (lobe.r * wobble));
  }
  const lakeCore = 1 - smoothstep(0.75, 1.0, ld);
  return h * (1 - lakeCore) + (rawHeight * 0.12) * lakeCore;
}

function bandFor(h) {
  for (const b of BANDS) if (h < b.max) return b;
  return BANDS[BANDS.length - 1];
}

function shade(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  const f = 1 + factor;
  const cl = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${cl((n >> 16) & 255)},${cl((n >> 8) & 255)},${cl(n & 255)})`;
}

function generateGrid(width, height, cellSize, jitter, noiseX, noiseY) {
  const margin = cellSize * 1.5;
  const cols = Math.ceil((width + margin * 2) / cellSize);
  const rows = Math.ceil((height + margin * 2) / cellSize);
  const points = [];
  for (let j = 0; j <= rows; j++) {
    const row = [];
    for (let i = 0; i <= cols; i++) {
      row.push({
        x: -margin + i * cellSize + noiseX(i * 0.9, j * 0.9) * cellSize * jitter,
        y: -margin + j * cellSize + noiseY(i * 0.9, j * 0.9) * cellSize * jitter,
      });
    }
    points.push(row);
  }
  return { points, cols, rows };
}

const canvas = document.getElementById('terrain');
const ctx = canvas.getContext('2d');
const seed = Math.floor(Math.random() * 1e9);

function draw() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const { cell, scale, octaves, lacunarity, gain, jitter, showGrid } = SETTINGS;
  const perlinTerrain = makePerlin2D(seed);
  const perlinJX = makePerlin2D(seed + 101);
  const perlinJY = makePerlin2D(seed + 202);
  const ridged = makeRidgedMF(perlinTerrain, { octaves, lacunarity, gain });

  const { points, cols, rows } = generateGrid(w, h, cell, jitter, perlinJX, perlinJY);
  const path = makeValleyPath(cols, rows, seed);

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const rawH = ridged((i + 0.5) * scale, (j + 0.5) * scale);
      const band = bandFor(valleyHeight(rawH, i, j, rows, path));
      ctx.fillStyle = shade(band.color, perlinJX(i * 3.1 + 40, j * 3.1 + 40) * 0.05);

      const p00 = points[j][i], p10 = points[j][i + 1];
      const p11 = points[j + 1][i + 1], p01 = points[j + 1][i];
      ctx.beginPath();
      ctx.moveTo(p00.x, p00.y);
      ctx.lineTo(p10.x, p10.y);
      ctx.lineTo(p11.x, p11.y);
      ctx.lineTo(p01.x, p01.y);
      ctx.closePath();
      ctx.fill();
    }
  }

  if (showGrid) {
    ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--ink').trim() || '#2A2823';
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (const row of points) {
      ctx.moveTo(row[0].x, row[0].y);
      for (let i = 1; i < row.length; i++) ctx.lineTo(row[i].x, row[i].y);
    }
    for (let i = 0; i < points[0].length; i++) {
      ctx.moveTo(points[0][i].x, points[0][i].y);
      for (let j = 1; j < points.length; j++) ctx.lineTo(points[j][i].x, points[j][i].y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

let raf = null;
function scheduleDraw() {
  if (raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(draw);
}

window.addEventListener('resize', scheduleDraw);
// grid lines follow the day/night theme, which toggles a class on <body>
new MutationObserver(scheduleDraw).observe(document.body, { attributes: true, attributeFilter: ['class'] });
draw();
