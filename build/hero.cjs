// The opening banner: a dot-matrix landscape that is alive. A band of light keeps sweeping across the
// sky so the dots glow and dim, clouds drift, a signal tower sends out rings (calls coming in), and
// stars / flowers / windows twinkle on their own. Day and night versions, desktop and phone.
// Output: assets/{day,night}/hero.svg and assets/{day,night}/m/hero.svg
const { F, THEMES, rng, measure, outline, wrap, P, haloAttrs, dotMask, cell, twinkles, svgDoc, out } = require('./lib.cjs');

const PITCH = 7;
const NAME = ['Muhammad', 'Sheraz'];
const SUB = 'Software engineer  /  Lahore, Pakistan';
const TAG = 'I build AI agents that answer calls, chats and texts for real businesses, and the automation behind them.';

/** A smooth ridge line closed down to the bottom of the picture. */
function ridge(W, H, base, amp, waves, phase = 0, x0 = -20, x1 = W + 20) {
  let d = `M${x0} ${H}`;
  for (let x = x0; x <= x1; x += 8) {
    let y = base;
    waves.forEach(([f, a], i) => { y -= amp * a * Math.sin((x / W) * Math.PI * f + phase + i * 1.7); });
    d += `L${x} ${y.toFixed(1)}`;
  }
  return d + `L${x1} ${H}Z`;
}
/** Grid cells along a straight line, so thin things (the tower) are drawn as clean single dots. */
function lineCells(x0, y0, x1, y1) {
  const s = new Map(), n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (PITCH * 0.5));
  for (let k = 0; k <= n; k++) {
    const x = x0 + (x1 - x0) * k / n, y = y0 + (y1 - y0) * k / n, i = Math.floor(x / PITCH), j = Math.floor(y / PITCH);
    s.set(i + ',' + j, [i, j]);
  }
  return [...s.values()];
}
function cloud(cx, cy, s, fill, op) {
  const parts = [[0, 0, 60, 22], [-46, 8, 40, 16], [44, 6, 46, 18], [-12, -14, 34, 20], [22, -10, 30, 18]];
  return parts.map(([x, y, rx, ry]) => `<ellipse cx="${(cx + x * s).toFixed(1)}" cy="${(cy + y * s).toFixed(1)}" rx="${(rx * s).toFixed(1)}" ry="${(ry * s).toFixed(1)}" fill="${fill}" fill-opacity="${op}"/>`).join('');
}

const CSS = `
  .sweep { animation: sweep linear infinite; }
  @keyframes sweep { from { transform: translateX(-420px); } to { transform: translateX(1500px); } }
  .drift { animation: drift ease-in-out infinite alternate; }
  @keyframes drift { from { transform: translateX(-34px); } to { transform: translateX(34px); } }
  .glow { transform-box: fill-box; transform-origin: center; animation: glow 3.4s ease-in-out infinite alternate; }
  @keyframes glow { from { transform: scale(.93); opacity: .78; } to { transform: scale(1.07); opacity: 1; } }
  .ring { transform-box: fill-box; transform-origin: center; animation: ring 4.8s cubic-bezier(.15,.55,.35,1) infinite; opacity: 0; }
  @keyframes ring { 0% { transform: scale(.06); opacity: 0; } 6% { opacity: 1; } 70% { opacity: .55; } 100% { transform: scale(1); opacity: 0; } }
  .aur { transform-box: fill-box; transform-origin: center; animation: aur ease-in-out infinite alternate; }
  @keyframes aur { 0% { transform: translateX(-40px) skewX(-8deg); opacity: .35; } 50% { opacity: .85; } 100% { transform: translateX(40px) skewX(8deg); opacity: .5; } }
  .blink { animation: blink 1.6s steps(1) infinite; }
  @keyframes blink { 0%, 55% { opacity: 1; } 56%, 100% { opacity: .15; } }`;

function hero(T, { W, H, mobile }) {
  const R = rng(mobile ? 21 : 11);
  const s = mobile ? 0.5 : 1;                         // scene scale for the phone version
  const horizon = mobile ? 360 : 432;                 // where the hills start
  let defs = dotMask('dm', W, H, { pitch: PITCH, seed: 5 });
  defs += `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">${T.sky.map((c, i) => `<stop offset="${(i / (T.sky.length - 1)).toFixed(2)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  defs += `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.skyGap}"/><stop offset="${((H - 120) / H).toFixed(2)}" stop-color="${T.skyGap}"/><stop offset="${((H - 60) / H).toFixed(2)}" stop-color="${T.page}"/></linearGradient>`;
  defs += `<linearGradient id="mead" x1="0" y1="0" x2="0" y2="1">${T.meadow.map((c, i) => `<stop offset="${(i / (T.meadow.length - 1)).toFixed(2)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  defs += `<linearGradient id="sw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="${T.name === 'day' ? '#FFFFFF' : '#B9C8FF'}" stop-opacity="${T.name === 'day' ? 0.5 : 0.32}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
  defs += `<radialGradient id="sun"><stop offset="0" stop-color="${T.sun[0]}"/><stop offset=".72" stop-color="${T.sun[1]}"/><stop offset="1" stop-color="${T.sun[1]}" stop-opacity="0"/></radialGradient>`;
  if (T.aurora) T.aurora.forEach((c, i) => { defs += `<linearGradient id="au${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity="0"/><stop offset=".55" stop-color="${c}" stop-opacity=".9"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient>`; });

  // ---------- the scene under the dot mask ----------
  let sc = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  if (T.aurora) {
    T.aurora.forEach((c, i) => {
      const y = (mobile ? 60 : 70) + i * 34 * (mobile ? .7 : 1);
      sc += `<path class="aur" style="animation-duration:${9 + i * 3}s;animation-delay:${-i * 2.5}s" fill="url(#au${i})" d="${ridge(W, y + 120, y + 70, 26 * (mobile ? .6 : 1), [[3.2, 1], [7, .35]], i * 1.3).replace(/M-20 [\d.]+/, `M-20 ${y}`)}"/>`;
    });
  }
  // sun / moon
  const sx = mobile ? 330 : 846, sy = mobile ? 66 : 112, sr = mobile ? 34 : 58;
  sc += `<circle class="glow" cx="${sx}" cy="${sy}" r="${sr * 1.35}" fill="url(#sun)"/>`;
  if (T.name === 'night') sc += `<circle cx="${sx + sr * .38}" cy="${sy - sr * .2}" r="${sr * .62}" fill="${T.sky[1]}"/>`;
  // clouds (few, so the blue sky stays strong)
  const clouds = mobile
    ? [[60, 150, .5], [300, 190, .55], [180, 290, .42]]
    : [[140, 150, .85], [470, 64, .6], [690, 250, .95], [930, 300, .7], [330, 330, .62]];
  clouds.forEach(([x, y, k], i) => {
    sc += `<g class="drift" style="animation-duration:${18 + (i * 7) % 15}s;animation-delay:${-i * 3}s">${cloud(x, y, k, T.cloud, T.name === 'day' ? .92 : .6)}</g>`;
  });
  // light sweeping across the sky (the "live" glow)
  [[12, 0], [17, -8]].forEach(([dur, dl]) => {
    sc += `<g class="sweep" style="animation-duration:${dur}s;animation-delay:${dl}s"><rect x="0" y="-${H}" width="${mobile ? 140 : 240}" height="${H * 3}" fill="url(#sw)" transform="rotate(16)"/></g>`;
  });
  // mountains with snow, lower in the middle so the words stay clear
  const mBase = horizon + 26 * s;
  const peaks = mobile
    ? [[20, 70, 70], [120, 40, 70], [250, 34, 80], [370, 74, 80]]
    : [[50, 118, 120], [220, 74, 120], [400, 42, 110], [580, 50, 120], [770, 86, 130], [950, 126, 120]];
  peaks.forEach(([x, h, hw]) => {
    sc += `<path fill="${T.mount}" d="M${x - hw} ${mBase}L${x} ${mBase - h}L${x + hw} ${mBase}Z"/>`;
    const k = 0.3;
    sc += `<path fill="${T.snow}" d="M${x - hw * k} ${mBase - h * (1 - k)}L${x} ${mBase - h}L${x + hw * k} ${mBase - h * (1 - k)}L${x + hw * k * .45} ${mBase - h * (1 - k) + 6}L${x} ${mBase - h * (1 - k) - 2}L${x - hw * k * .5} ${mBase - h * (1 - k) + 5}Z"/>`;
  });
  sc += `<path fill="${T.hillFar}" d="${ridge(W, H, horizon + 30 * s, 16 * s, [[2.2, 1], [5.3, .35]], .6)}"/>`;
  // city on the right
  const cityX0 = mobile ? 236 : 600, cityX1 = mobile ? 400 : 975, cityBase = horizon + (mobile ? 64 : 78);
  const buildings = [];
  for (let x = cityX0; x < cityX1;) {
    const w = (mobile ? 14 : 21) + Math.floor(R() * 3) * PITCH, h = (mobile ? 30 : 44) + Math.floor(R() * (mobile ? 6 : 9)) * PITCH;
    buildings.push([x, cityBase - h, w, h]); x += w + PITCH;
  }
  buildings.forEach(([x, y, w, h]) => { sc += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${T.city}"/>`; });
  const midBase = horizon + (mobile ? 62 : 74), midAmp = 12 * (mobile ? .7 : 1), midWaves = [[1.6, 1], [4.1, .4]];
  sc += `<path fill="${T.hillMid}" d="${ridge(W, H, midBase, midAmp, midWaves, 2.1)}"/>`;
  // a line of pines along the middle hill
  const yAt = (x) => { let y = midBase; midWaves.forEach(([f, a], i) => { y -= midAmp * a * Math.sin((x / W) * Math.PI * f + 2.1 + i * 1.7); }); return y; };
  for (let x = mobile ? 150 : 300; x < (mobile ? 260 : 640); x += (mobile ? 9 : 13) + R() * (mobile ? 8 : 14)) {
    const h = (mobile ? 16 : 24) + R() * (mobile ? 14 : 26), w = h * .42, y = yAt(x) + 6;
    sc += `<path fill="${T.trees}" d="M${(x - w).toFixed(1)} ${y.toFixed(1)}L${x.toFixed(1)} ${(y - h).toFixed(1)}L${(x + w).toFixed(1)} ${y.toFixed(1)}Z"/>`;
  }
  // the near hill with the tower, on the left
  const tx = mobile ? 56 : 150, ttop = mobile ? horizon - 50 : horizon - 96, tbase = mobile ? horizon + 34 : horizon + 50;
  sc += `<path fill="${T.hillNear}" d="M-20 ${H}L-20 ${tbase + 26}Q${tx - 40 * s} ${tbase - 6} ${tx} ${tbase}Q${tx + 130 * s} ${tbase + 6} ${tx + 300 * s} ${tbase + 78 * s}L${tx + 300 * s} ${H}Z"/>`;
  // rings from the tower top
  const ringR = mobile ? 200 : 360;
  [0, 1.6, 3.2].forEach((dl) => { sc += `<circle class="ring" style="animation-delay:${-dl}s" cx="${tx}" cy="${ttop}" r="${ringR}" fill="none" stroke="${T.ring}" stroke-width="${mobile ? 16 : 22}"/>`; });
  // meadow
  const meadowTop = mobile ? horizon + 96 : horizon + 112;
  sc += `<path fill="url(#mead)" d="${ridge(W, H, meadowTop, 6, [[2.5, 1], [6, .5]], 1)}"/>`;

  let body = `<defs>${defs}</defs><rect width="${W}" height="${H}" fill="url(#bg)"/><g mask="url(#dm)">${sc}</g>`;

  // ---------- crisp single-dot sprites on the grid ----------
  const dot = ([i, j], c, extra = '') => { const [x, y] = cell(i, j, PITCH); return `<circle${extra} cx="${x}" cy="${y}" r="2.95" fill="${c}"/>`; };
  const legs = [...lineCells(tx - 22 * (mobile ? .6 : 1), tbase, tx, ttop), ...lineCells(tx + 22 * (mobile ? .6 : 1), tbase, tx, ttop)];
  const bars = [];
  for (let k = 1; k <= (mobile ? 3 : 5); k++) {
    const y = ttop + (tbase - ttop) * k / ((mobile ? 3 : 5) + 0.6), half = 22 * (mobile ? .6 : 1) * (y - ttop) / (tbase - ttop);
    bars.push(...lineCells(tx - half, y, tx + half, y));
  }
  const seen = new Set();
  body += [...legs, ...bars].filter(([i, j]) => { const k = i + ',' + j; if (seen.has(k)) return false; seen.add(k); return true; }).map((c) => dot(c, T.tower)).join('');
  const topCell = [Math.floor(tx / PITCH), Math.floor(ttop / PITCH) - 1];
  body += dot(topCell, T.red, ' class="blink"');

  // twinkles: stars (night) or bright specks (day) in the sky, windows in the city, flowers in the meadow
  const pts = [];
  const cols = Math.floor(W / PITCH), rows = Math.floor(H / PITCH);
  const nStars = T.name === 'night' ? (mobile ? 70 : 150) : (mobile ? 14 : 30);
  for (let n = 0; n < nStars; n++) {
    const i = Math.floor(R() * cols), j = Math.floor(R() * (horizon / PITCH - 4));
    pts.push([...cell(i, j, PITCH), T.name === 'night' ? (R() < .8 ? '#FFFFFF' : '#BFD3FF') : '#FFFFFF']);
  }
  buildings.forEach(([x, y, w, h]) => {
    for (let i = Math.ceil(x / PITCH); (i + 1) * PITCH <= x + w - 2; i += 1) for (let j = Math.ceil(y / PITCH) + 1; (j + 1) * PITCH < y + h - 2; j += 2) {
      if (R() < (T.name === 'night' ? .42 : .2)) pts.push([...cell(i, j, PITCH), T.window]);
    }
  });
  const mRows = [Math.ceil((meadowTop + 14) / PITCH), Math.floor((H - 70) / PITCH)];
  const nFlowers = T.name === 'night' ? (mobile ? 40 : 90) : (mobile ? 90 : 230);
  for (let n = 0; n < nFlowers; n++) {
    const i = Math.floor(R() * cols), j = mRows[0] + Math.floor(R() * (mRows[1] - mRows[0]));
    pts.push([...cell(i, j, PITCH), T.flowers[Math.floor(R() * T.flowers.length)]]);
  }
  body += `<g>${twinkles(pts, R, { min: T.name === 'night' ? .08 : .25 })}</g>`;

  // ragged, dithered bottom edge that dissolves into the page
  let holes = '';
  for (let j = Math.floor((H - 100) / PITCH); j < rows; j++) for (let i = 0; i < cols + 1; i++) {
    const [x, y] = cell(i, j, PITCH), p = Math.min(1, Math.max(0, (y - (H - 100)) / 92));
    if (R() < p * p * 1.1) holes += `<circle cx="${x}" cy="${y}" r="3.1" fill="${T.page}"/>`;
  }
  body += holes + `<rect y="${H - 12}" width="${W}" height="12" fill="${T.page}"/>`;

  // ---------- words ----------
  const nameSize = mobile ? 86 : 172, nameTrack = 0.01;
  const nameW = Math.max(...NAME.map((n) => measure(F.pixel, n, nameSize, nameTrack)));
  const capH = nameSize * 0.6;
  const y1 = (mobile ? 58 : 62) + capH, y2 = y1 + nameSize * 0.74;
  const halo = T.name === 'day' ? '#F7FAFF' : '#070B1C';
  body += `<g class="rise">${P(outline(F.pixel, NAME[0], W / 2, y1, nameSize, { anchor: 'middle', track: nameTrack }), T.ink, haloAttrs(halo, mobile ? 7 : 12))}</g>`;
  body += `<g class="rise r2">${P(outline(F.pixel, NAME[1], W / 2, y2, nameSize, { anchor: 'middle', track: nameTrack }), T.ink, haloAttrs(halo, mobile ? 7 : 12))}</g>`;
  const subSize = mobile ? 14.5 : 21, sy2 = y2 + (mobile ? 34 : 54);
  body += `<g class="rise r3">${P(outline(F.label, SUB, W / 2, sy2, subSize, { anchor: 'middle', track: 0.02 }), T.ink, haloAttrs(halo, mobile ? 5 : 7))}</g>`;
  const tagSize = mobile ? 15.5 : 22, tagLines = wrap(F.bodyM, TAG, tagSize, mobile ? W - 44 : 720);
  body += `<g class="rise r4">${tagLines.map((l, k) => P(outline(F.bodyM, l, W / 2, sy2 + (mobile ? 30 : 42) + k * tagSize * 1.42, tagSize, { anchor: 'middle' }), T.ink, haloAttrs(halo, mobile ? 5 : 7))).join('')}</g>`;
  void nameW;

  return svgDoc(W, H, `Muhammad Sheraz. ${SUB.replace(/\s+\/\s+/, ', ')}. ${TAG}`, body, CSS);
}

for (const T of Object.values(THEMES)) {
  out(`assets/${T.name}/hero.svg`, hero(T, { W: 1000, H: 660 }));
  out(`assets/${T.name}/m/hero.svg`, hero(T, { W: 400, H: 560, mobile: true }));
}
