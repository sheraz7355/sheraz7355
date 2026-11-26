// The opening banner: a live dot-matrix picture of what I build. Ribbons of light flow across the sky
// behind the name, and along the bottom a small automation runs on a loop: a call, a chat and a text
// travel down the wires into the AI agent, it lights up, and the results travel out the other side.
// Day and night versions, desktop and phone.
// Output: assets/{day,night}/hero.svg and assets/{day,night}/m/hero.svg
const { F, THEMES, rng, outline, wrap, P, haloAttrs, dotMask, cell, twinkles, svgDoc, out } = require('./lib.cjs');

const PITCH = 7;
const NAME = ['Muhammad', 'Sheraz'];
const SUB = 'Software engineer  /  Lahore, Pakistan';
const TAG = 'I build AI agents that answer calls, chats and texts for real businesses, and the automation behind them.';
const INPUTS = ['CALL', 'CHAT', 'TEXT'];
const OUTPUTS = ['ANSWER', 'BOOK', 'LOG'];
const LOOP = 7; // seconds for one run of the automation

/** Colours for the new scene, on top of the shared theme. */
const SCENE = {
  day: { ribbons: ['#FFFFFF', '#BFE3FF', '#8FF0D2'], ribbonOp: 1, ribbonK: 1.6, wire: '#2E3F94', node: '#141B3A', pulse: '#FFD24D', pulseCore: '#FFFFFF', core: '#1B3FB8', coreIcon: '#FFFFFF', done: '#0E9F6E' },
  night: { ribbons: ['#38E5B0', '#3BB8FF', '#9B7BFF'], ribbonOp: .9, ribbonK: 1, wire: '#5665B0', node: '#B4BEEB', pulse: '#7FE7FF', pulseCore: '#FFFFFF', core: '#7EA2FF', coreIcon: '#0D1117', done: '#3DDC97' },
};

/** A soft band between two wavy lines. It repeats every L px, so sliding it by L loops with no jump. */
function ribbon(W, y0, amp, thick, L, phase, strength = 1) {
  const x0 = -14, x1 = W + L + 14, step = 10, k = (2 * Math.PI) / L;
  const mid = (x) => y0 + amp * Math.sin(k * x + phase) + amp * 0.35 * Math.sin(2 * k * x + phase * 1.7);
  const th = (x) => thick * (0.62 + 0.38 * Math.sin(k * x + phase + 1.3));
  let out = '';
  [[1, .2], [.6, .3], [.28, .5]].forEach(([m, op]) => {
    let top = '', bot = '';
    for (let x = x0; x <= x1; x += step) {
      top += `${top ? 'L' : 'M'}${x} ${(mid(x) - th(x) * m / 2).toFixed(1)}`;
      bot = `L${x} ${(mid(x) + th(x) * m / 2).toFixed(1)}` + bot;
    }
    out += `<path fill-opacity="${Math.min(1, op * strength).toFixed(2)}" d="${top}${bot}Z"/>`;
  });
  return out;
}

const CSS = `
  .sweep { animation: sweep linear infinite; }
  @keyframes sweep { from { transform: translateX(-420px); } to { transform: translateX(1500px); } }
  .flow { animation: flow linear infinite; }
  @keyframes flow { from { transform: translateX(var(--l)); } to { transform: translateX(0); } }
  .pulse { animation-duration: ${LOOP}s; animation-timing-function: linear; animation-iteration-count: infinite; opacity: 0; }
  .lit { animation-duration: ${LOOP}s; animation-timing-function: ease-out; animation-iteration-count: infinite; opacity: 0; }
  .cring { transform-box: fill-box; transform-origin: center; animation: cring ${LOOP}s cubic-bezier(.15,.55,.35,1) infinite; opacity: 0; }
  @keyframes cring { 0%, 40% { transform: scale(.12); opacity: 0; } 43% { opacity: 1; } 68%, 100% { transform: scale(1); opacity: 0; } }
  .think { animation: think ${LOOP}s ease-in-out infinite; }
  @keyframes think { 0%, 36% { opacity: .8; } 44%, 52% { opacity: 1; } 66%, 100% { opacity: .8; } }`;

/** Keyframes that move a dot of light along a route between `from`% and `to`% of the loop. */
function travel(name, pts, from, to) {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  const at = (p) => `transform: translate(${p[0]}px, ${p[1]}px);`;
  let k = `@keyframes ${name} { 0% { ${at(pts[0])} opacity: 0; } ${from.toFixed(2)}% { ${at(pts[0])} opacity: 0; } ${(from + 1).toFixed(2)}% { opacity: 1; } `;
  let run = 0;
  seg.forEach((s, i) => { run += s; if (i < seg.length - 1) k += `${(from + (to - from) * run / total).toFixed(2)}% { ${at(pts[i + 1])} opacity: 1; } `; });
  const end = pts[pts.length - 1];
  return k + `${to.toFixed(2)}% { ${at(end)} opacity: 1; } ${(to + 2).toFixed(2)}% { ${at(end)} opacity: 0; } 100% { ${at(end)} opacity: 0; } }`;
}

function hero(T, { W, H, mobile }) {
  const R = rng(mobile ? 21 : 11);
  const S = SCENE[T.name], night = T.name === 'night';
  const cols = Math.floor(W / PITCH), rows = Math.floor(H / PITCH);
  let css = CSS;
  let defs = dotMask('dm', W, H, { pitch: PITCH, seed: 5 });
  defs += `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">${T.sky.map((c, i) => `<stop offset="${(i / (T.sky.length - 1)).toFixed(2)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  defs += `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.skyGap}"/><stop offset="${((H - 120) / H).toFixed(2)}" stop-color="${T.skyGap}"/><stop offset="${((H - 60) / H).toFixed(2)}" stop-color="${T.page}"/></linearGradient>`;
  defs += `<linearGradient id="sw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="${night ? '#B9C8FF' : '#FFFFFF'}" stop-opacity="${night ? 0.3 : 0.45}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
  defs += `<radialGradient id="pg"><stop offset="0" stop-color="${S.pulseCore}"/><stop offset=".45" stop-color="${S.pulse}"/><stop offset="1" stop-color="${S.pulse}" stop-opacity="0"/></radialGradient>`;

  // ---------- the scene under the dot mask ----------
  let sc = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  // ribbons of light flowing left to right behind the name
  const ribbons = mobile
    ? [[70, 20, 60, 300, 0.4, 30], [150, 16, 46, 380, 2.2, 41], [222, 12, 34, 260, 4.1, 24]]
    : [[110, 34, 96, 620, 0.4, 34], [228, 26, 74, 800, 2.2, 46], [318, 18, 50, 520, 4.1, 27]];
  ribbons.forEach(([y, amp, thick, L, ph, dur], i) => {
    sc += `<g class="flow" style="--l:-${L}px;animation-duration:${dur}s;animation-delay:-${i * 9}s" fill="${S.ribbons[i]}" opacity="${S.ribbonOp}">${ribbon(W, y, amp, thick, L, ph, S.ribbonK)}</g>`;
  });
  // light sweeping across (the "live" glow)
  [[12, 0], [17, -8]].forEach(([dur, dl]) => {
    sc += `<g class="sweep" style="animation-duration:${dur}s;animation-delay:${dl}s"><rect x="0" y="-${H}" width="${mobile ? 140 : 240}" height="${H * 3}" fill="url(#sw)" transform="rotate(16)"/></g>`;
  });

  // ---------- the automation along the bottom (all on grid cells, so wires are clean rows of dots) ----------
  const g = mobile
    ? { rowJ: [47, 52, 57], inI: 3, trunkIn: 19, coreI: 28, trunkOut: 37, outI: 53, node: 3, core: 5 }
    : { rowJ: [67, 73, 79], inI: 10, trunkIn: 49, coreI: 71, trunkOut: 93, outI: 131, node: 3, core: 7 };
  const X = (i) => (i + 0.5) * PITCH, Y = (j) => (j + 0.5) * PITCH;
  const yMid = Y(g.rowJ[1]), xCore = X(g.coreI);
  const block = (i, j, n, fill, extra = '') => `<rect${extra} x="${(i - (n - 1) / 2) * PITCH}" y="${(j - (n - 1) / 2) * PITCH}" width="${n * PITCH}" height="${n * PITCH}" fill="${fill}"/>`;
  const routesIn = g.rowJ.map((j) => (j === g.rowJ[1]
    ? [[X(g.inI), Y(j)], [xCore, yMid]]
    : [[X(g.inI), Y(j)], [X(g.trunkIn), Y(j)], [X(g.trunkIn), yMid], [xCore, yMid]]));
  const routesOut = g.rowJ.map((j) => (j === g.rowJ[1]
    ? [[xCore, yMid], [X(g.outI), Y(j)]]
    : [[xCore, yMid], [X(g.trunkOut), yMid], [X(g.trunkOut), Y(j)], [X(g.outI), Y(j)]]));
  const wire = (pts) => `<path fill="none" stroke="${S.wire}" stroke-width="6.2" stroke-linecap="square" d="${pts.map((p, n) => `${n ? 'L' : 'M'}${p[0]} ${p[1]}`).join('')}"/>`;
  [...routesIn, ...routesOut].forEach((r) => { sc += wire(r); });
  // the dots of light: in to the agent, then out to the results
  const pr = mobile ? 13 : 17;
  routesIn.forEach((r, k) => {
    const from = 2 + k * 5, to = from + 28;
    css += `\n  ${travel(`in${k}`, r, from, to)}`;
    sc += `<circle class="pulse" style="animation-name:in${k}" r="${pr}" fill="url(#pg)"/>`;
  });
  routesOut.forEach((r, k) => {
    const from = 50 + k * 5, to = from + 28;
    css += `\n  ${travel(`out${k}`, r, from, to)}`;
    sc += `<circle class="pulse" style="animation-name:out${k}" r="${pr}" fill="url(#pg)"/>`;
    // the result box turns green when its dot arrives
    css += `\n  @keyframes done${k} { 0%, ${to - 1}% { opacity: 0; } ${to + 1}%, ${Math.min(to + 12, 97)}% { opacity: 1; } ${Math.min(to + 20, 99.5)}%, 100% { opacity: 0; } }`;
  });
  // boxes: inputs, results, and the agent in the middle with a ring when it fires
  g.rowJ.forEach((j, k) => {
    sc += block(g.inI, j, g.node, S.node);
    sc += block(g.outI, j, g.node, S.node) + block(g.outI, j, g.node, S.done, ` class="lit" style="animation-name:done${k}"`);
  });
  const ringR = (mobile ? 9 : 12) * PITCH;
  sc += `<circle class="cring" cx="${xCore}" cy="${yMid}" r="${ringR}" fill="none" stroke="${S.pulse}" stroke-width="${mobile ? 10 : 13}"/>`;
  sc += block(g.coreI, g.rowJ[1], g.core, S.core, ' class="think"');

  let body = `<defs>${defs}</defs><rect width="${W}" height="${H}" fill="url(#bg)"/><g mask="url(#dm)">${sc}</g>`;

  // ---------- crisp single dots on the grid ----------
  const dot = ([i, j], c, extra = '') => { const [x, y] = cell(i, j, PITCH); return `<circle${extra} cx="${x}" cy="${y}" r="2.95" fill="${c}"/>`; };
  // a spark in the middle of the agent
  const spark = mobile ? [[0, -1], [-1, 0], [0, 0], [1, 0], [0, 1]] : [[0, -2], [-1, -1], [0, -1], [1, -1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2]];
  body += spark.map(([dx, dy]) => dot([g.coreI + dx, g.rowJ[1] + dy], S.coreIcon)).join('');

  // twinkles: stars (night) or bright specks (day) across the sky
  const pts = [];
  const skyRows = g.rowJ[0] - 5;
  const nStars = night ? (mobile ? 80 : 170) : (mobile ? 22 : 46);
  for (let n = 0; n < nStars; n++) {
    const i = Math.floor(R() * cols), j = Math.floor(R() * skyRows);
    pts.push([...cell(i, j, PITCH), night ? (R() < .8 ? '#FFFFFF' : '#BFD3FF') : '#FFFFFF']);
  }
  body += `<g>${twinkles(pts, R, { min: night ? .08 : .25 })}</g>`;

  // ragged, dithered bottom edge that dissolves into the page
  let holes = '';
  for (let j = Math.floor((H - 100) / PITCH); j < rows + 1; j++) for (let i = 0; i < cols + 1; i++) {
    const [x, y] = cell(i, j, PITCH), p = Math.min(1, Math.max(0, (y - (H - 100)) / 92));
    if (R() < p * p * 1.1) holes += `<circle cx="${x}" cy="${y}" r="3.1" fill="${T.page}"/>`;
  }
  body += holes + `<rect y="${H - 12}" width="${W}" height="12" fill="${T.page}"/>`;

  // ---------- words ----------
  const halo = night ? '#070B1C' : '#F7FAFF';
  const nameSize = mobile ? 86 : 172, nameTrack = 0.01;
  const capH = nameSize * 0.6;
  const y1 = (mobile ? 58 : 62) + capH, y2 = y1 + nameSize * 0.74;
  body += `<g class="rise">${P(outline(F.pixel, NAME[0], W / 2, y1, nameSize, { anchor: 'middle', track: nameTrack }), T.ink, haloAttrs(halo, mobile ? 7 : 12))}</g>`;
  body += `<g class="rise r2">${P(outline(F.pixel, NAME[1], W / 2, y2, nameSize, { anchor: 'middle', track: nameTrack }), T.ink, haloAttrs(halo, mobile ? 7 : 12))}</g>`;
  const subSize = mobile ? 14.5 : 21, sy2 = y2 + (mobile ? 34 : 54);
  body += `<g class="rise r3">${P(outline(F.label, SUB, W / 2, sy2, subSize, { anchor: 'middle', track: 0.02 }), T.ink, haloAttrs(halo, mobile ? 5 : 7))}</g>`;
  const tagSize = mobile ? 15.5 : 22, tagLines = wrap(F.bodyM, TAG, tagSize, mobile ? W - 44 : 720);
  body += `<g class="rise r4">${tagLines.map((l, k) => P(outline(F.bodyM, l, W / 2, sy2 + (mobile ? 30 : 42) + k * tagSize * 1.42, tagSize, { anchor: 'middle' }), T.ink, haloAttrs(halo, mobile ? 5 : 7))).join('')}</g>`;

  // small labels on the automation
  const ls = mobile ? 11 : 14.5, lh = mobile ? 4 : 5, pad = (g.node / 2) * PITCH + (mobile ? 5 : 8), up = mobile ? 7 : 9;
  let labels = '';
  g.rowJ.forEach((j, k) => {
    labels += P(outline(F.label, INPUTS[k], X(g.inI) + pad, Y(j) - up, ls, { track: 0.06 }), T.ink, haloAttrs(halo, lh));
    labels += P(outline(F.label, OUTPUTS[k], X(g.outI) - pad, Y(j) - up, ls, { track: 0.06, anchor: 'end' }), T.ink, haloAttrs(halo, lh));
  });
  labels += P(outline(F.label, 'AI AGENT', xCore, yMid - (g.core / 2) * PITCH - (mobile ? 7 : 9), ls + 1, { track: 0.06, anchor: 'middle' }), T.ink, haloAttrs(halo, lh));
  body += `<g class="fade">${labels}</g>`;

  return svgDoc(W, H, `Muhammad Sheraz. ${SUB.replace(/\s+\/\s+/, ', ')}. ${TAG}`, body, css);
}

for (const T of Object.values(THEMES)) {
  out(`assets/${T.name}/hero.svg`, hero(T, { W: 1000, H: 690 }));
  out(`assets/${T.name}/m/hero.svg`, hero(T, { W: 400, H: 520, mobile: true }));
}
