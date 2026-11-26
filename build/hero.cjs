// The opening banner: a live dot-matrix scene in space. The giant black hole TON 618 sits on the right
// and keeps throwing out bugs (SyntaxError, undefined, NaN ...). On the left a small pixel character
// (me) stands on a moon and shoots each one down before it lands. Planets float behind the name and
// the stars twinkle. Day and night versions, desktop and phone.
// Output: assets/{day,night}/hero.svg and assets/{day,night}/m/hero.svg
const { F, THEMES, rng, outline, wrap, P, haloAttrs, dotMask, cell, twinkles, svgDoc, out } = require('./lib.cjs');

const PITCH = 7;
const NAME = ['Muhammad', 'Sheraz'];
const SUB = 'Full-stack software engineer  /  Lahore, Pakistan';
const TAG = 'I build web and mobile apps end to end, and the AI agents and automation that work inside them.';
const BUGS = ['SyntaxError', 'undefined', 'NaN', '404', 'TypeError', 'null'];
const LOOP = 9; // seconds until the same bug flies out again

/** Space is dark in both themes; the light theme gets a slightly bluer, brighter sky. */
const SPACE = {
  day: { sky: ['#0C1036', '#161C55', '#222772', '#2C2C84'], gap: '#090C26', nebula: ['#8A5BFF', '#27B6C9'], ground: ['#6D74C2', '#3A3F86'], crater: '#2E3270' },
  night: { sky: ['#04060F', '#0A0F2A', '#111742', '#181B52'], gap: '#03050C', nebula: ['#6B3FE0', '#178A9C'], ground: ['#4A4F8F', '#262A5E'], crater: '#1C1F4A' },
};
const INK = '#F2F5FF', HALO = '#060818';
const BUG_COLORS = ['#FF6B6B', '#FFC44D', '#FF8FD0', '#FF6B6B', '#FFA24D', '#FF8FD0'];

// The pixel character, one letter per dot. h hair, s skin, e eye, b shirt, c cape, g blaster, p trousers, k shoes.
const HERO = [
  '..hhhh...',
  '.hhhhhh..',
  '.hssssh..',
  '.sesses..',
  '.ssssss..',
  'c.bbbb...',
  'ccbbbbsgg',
  'c.bbbb.g.',
  'c.bbbb...',
  '..pppp...',
  '..p..p...',
  '.kk..kk..',
];
const HERO_COLORS = { h: '#8A5A36', s: '#F5C7A0', e: '#141833', b: '#4F7BFF', c: '#FF5D5D', g: '#D8DEF5', p: '#7C89D8', k: '#F2F5FF' };

const CSS = `
  .sweep { animation: sweep linear infinite; }
  @keyframes sweep { from { transform: translateX(-420px); } to { transform: translateX(1500px); } }
  .bob { animation: bob ease-in-out infinite alternate; }
  @keyframes bob { from { transform: translateY(-5px); } to { transform: translateY(5px); } }
  .neb { animation: neb 26s ease-in-out infinite alternate; }
  @keyframes neb { from { transform: translateX(-30px); opacity: .7; } to { transform: translateX(30px); opacity: 1; } }
  .swirl { animation: swirl 5s linear infinite; }
  @keyframes swirl { to { stroke-dashoffset: -360; } }
  .glow { transform-box: fill-box; transform-origin: center; animation: glow 3.4s ease-in-out infinite alternate; }
  @keyframes glow { from { transform: scale(.94); opacity: .75; } to { transform: scale(1.06); opacity: 1; } }
  .fx { animation-duration: ${LOOP}s; animation-timing-function: linear; animation-iteration-count: infinite; opacity: 0; }
  .burst { transform-box: fill-box; transform-origin: center; animation: burst ${LOOP}s linear infinite; opacity: 0; }
  @keyframes burst { 0%, 37% { opacity: 0; transform: scale(.3); } 39% { opacity: 1; transform: scale(1); } 46%, 100% { opacity: 0; transform: scale(1.8); } }
  .blink { animation: blink 1.5s steps(1) infinite; }
  @keyframes blink { 0%, 55% { opacity: 1; } 56%, 100% { opacity: .25; } }`;

function hero(T, { W, H, mobile }) {
  const R = rng(mobile ? 21 : 11);
  const S = SPACE[T.name];
  const cols = Math.floor(W / PITCH), rows = Math.floor(H / PITCH);
  let css = CSS;

  // where things are (desktop / phone)
  const g = mobile
    ? { bh: [330, 372], bhR: 24, diskRx: 74, diskRy: 17, ground: [60, 557, 130], heroI: 4, heroJ: 49, px: 1,
        planets: { ring: [52, 36, 15], teal: [352, 30, 9], far: [300, 300, 5] }, bugSize: 12.5,
        meets: [[190, 380], [160, 412], [222, 350], [150, 366]] }
    : { bh: [850, 520], bhR: 46, diskRx: 150, diskRy: 34, ground: [130, 758, 205], heroI: 4, heroJ: 55, px: 2,
        planets: { ring: [118, 262, 34], teal: [872, 232, 22], far: [62, 84, 9] }, bugSize: 16.5,
        meets: [[470, 500], [380, 540], [560, 470], [330, 505], [520, 560], [420, 466]] };
  const [bx, by] = g.bh, br = g.bhR;

  let defs = dotMask('dm', W, H, { pitch: PITCH, seed: 5 });
  defs += `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">${S.sky.map((c, i) => `<stop offset="${(i / (S.sky.length - 1)).toFixed(2)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  defs += `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${S.gap}"/><stop offset="${((H - 120) / H).toFixed(2)}" stop-color="${S.gap}"/><stop offset="${((H - 40) / H).toFixed(2)}" stop-color="${T.page}"/></linearGradient>`;
  defs += `<linearGradient id="sw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#B9C8FF" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
  S.nebula.forEach((c, i) => { defs += `<radialGradient id="nb${i}"><stop offset="0" stop-color="${c}" stop-opacity=".55"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`; });
  defs += `<radialGradient id="bhg"><stop offset="0" stop-color="#FFB347" stop-opacity=".9"/><stop offset=".45" stop-color="#FF6A2B" stop-opacity=".45"/><stop offset="1" stop-color="#FF3D2B" stop-opacity="0"/></radialGradient>`;
  defs += `<linearGradient id="disk" gradientUnits="userSpaceOnUse" x1="${-g.diskRx}" y1="0" x2="${g.diskRx}" y2="0"><stop offset="0" stop-color="#FF4B2B"/><stop offset=".3" stop-color="#FF9A3D"/><stop offset=".5" stop-color="#FFE9A8"/><stop offset=".7" stop-color="#FF9A3D"/><stop offset="1" stop-color="#FF4B2B"/></linearGradient>`;
  defs += `<linearGradient id="pl1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFC27A"/><stop offset="1" stop-color="#C2553A"/></linearGradient>`;
  defs += `<linearGradient id="pl2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7BE8D6"/><stop offset="1" stop-color="#256F99"/></linearGradient>`;
  defs += `<linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${S.ground[0]}"/><stop offset=".5" stop-color="${S.ground[1]}"/></linearGradient>`;

  // ---------- the scene under the dot mask ----------
  let sc = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  // two soft clouds of gas far away
  const neb = mobile ? [[90, 190, 150, 90], [320, 110, 130, 80]] : [[230, 330, 330, 170], [760, 150, 300, 150]];
  neb.forEach(([x, y, rx, ry], i) => { sc += `<ellipse class="neb" style="animation-delay:${-i * 9}s" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#nb${i})"/>`; });
  // a faint light sweeping across, so the dots glow and dim
  sc += `<g class="sweep" style="animation-duration:15s"><rect x="0" y="-${H}" width="${mobile ? 140 : 240}" height="${H * 3}" fill="url(#sw)" transform="rotate(16)"/></g>`;

  // planets: one with a ring, a small blue-green one with a moon, and a tiny far one
  const [rx0, ry0, rr] = g.planets.ring, ringRx = rr * 1.85, ringRy = rr * 0.38;
  sc += `<g class="bob" style="animation-duration:9s"><g transform="translate(${rx0} ${ry0}) rotate(-20)">`
    + `<path fill="none" stroke="#F7D9A0" stroke-opacity=".75" stroke-width="${(rr * 0.18).toFixed(1)}" d="M${ringRx} 0A${ringRx} ${ringRy} 0 0 0 ${-ringRx} 0"/>`
    + `<circle r="${rr}" fill="url(#pl1)"/><path fill="none" stroke="#A84630" stroke-opacity=".55" stroke-width="${(rr * 0.16).toFixed(1)}" d="M${-rr * .9} ${-rr * .25}H${rr * .9}M${-rr * .8} ${rr * .4}H${rr * .8}"/>`
    + `<path fill="none" stroke="#F7D9A0" stroke-width="${(rr * 0.18).toFixed(1)}" d="M${-ringRx} 0A${ringRx} ${ringRy} 0 0 0 ${ringRx} 0"/></g></g>`;
  const [tx, ty, tr] = g.planets.teal;
  sc += `<g class="bob" style="animation-duration:12s;animation-delay:-4s"><circle cx="${tx}" cy="${ty}" r="${tr}" fill="url(#pl2)"/><circle cx="${tx + tr * 1.8}" cy="${ty - tr * 1.2}" r="${Math.max(3.5, tr * 0.28).toFixed(1)}" fill="#C9D2F5"/></g>`;
  const [fx, fy, fr] = g.planets.far;
  sc += `<circle cx="${fx}" cy="${fy}" r="${fr}" fill="#B58CFF"/>`;

  // the moon the character stands on
  const [gx, gy, gr] = g.ground;
  sc += `<circle cx="${gx}" cy="${gy}" r="${gr}" fill="url(#gr)"/>`;
  [[-0.5, 0.2, 0.13], [0.35, 0.14, 0.09], [0.05, 0.42, 0.11]].forEach(([dx, dy, k]) => {
    sc += `<ellipse cx="${(gx + dx * gr).toFixed(1)}" cy="${(gy - gr + dy * gr).toFixed(1)}" rx="${(gr * k).toFixed(1)}" ry="${(gr * k * 0.45).toFixed(1)}" fill="${S.crater}"/>`;
  });

  // TON 618: a glow, the far half of the disk, the black centre with its ring of light, then the near half of the disk
  const upper = `M${g.diskRx} 0A${g.diskRx} ${g.diskRy} 0 0 0 ${-g.diskRx} 0`, lower = `M${-g.diskRx} 0A${g.diskRx} ${g.diskRy} 0 0 0 ${g.diskRx} 0`;
  const dw = mobile ? 9 : 15;
  const disk = (d) => `<path fill="none" stroke="url(#disk)" stroke-width="${dw}" stroke-linecap="round" d="${d}"/>`
    + `<path class="swirl" fill="none" stroke="#FFFFFF" stroke-opacity=".8" stroke-width="${dw * 0.42}" stroke-linecap="round" stroke-dasharray="12 24" d="${d}"/>`;
  sc += `<circle class="glow" cx="${bx}" cy="${by}" r="${br * 3}" fill="url(#bhg)"/>`;
  sc += `<g transform="translate(${bx} ${by}) rotate(-14)">${disk(upper)}`
    + `<path fill="none" stroke="#FF9A3D" stroke-width="${mobile ? 5 : 8}" d="M${-br * 1.45} 0A${br * 1.45} ${br * 1.45} 0 0 1 ${br * 1.45} 0"/>`
    + `<circle r="${br * 1.12}" fill="#FFE9A8"/><circle r="${br}" fill="#000000"/>${disk(lower)}</g>`;

  let body = `<defs>${defs}</defs><rect width="${W}" height="${H}" fill="url(#bg)"/><g mask="url(#dm)">${sc}</g>`;

  // ---------- crisp single dots on the grid ----------
  const dot = ([i, j], c, extra = '') => { const [x, y] = cell(i, j, PITCH); return `<circle${extra} cx="${x}" cy="${y}" r="2.95" fill="${c}"/>`; };

  // stars
  const pts = [];
  const nStars = mobile ? 90 : 190;
  for (let n = 0; n < nStars; n++) {
    const i = Math.floor(R() * cols), j = Math.floor(R() * (rows - 16));
    pts.push([...cell(i, j, PITCH), R() < .78 ? '#FFFFFF' : (R() < .5 ? '#BFD3FF' : '#FFE59A')]);
  }
  body += `<g>${twinkles(pts, R, { min: .08 })}</g>`;

  // the character
  let sprite = '';
  const px = g.px;   // dots per sprite pixel (the desktop character is drawn twice as big)
  const block = (ri, rj, c, extra = '') => { let o = ''; for (let a = 0; a < px; a++) for (let b = 0; b < px; b++) o += dot([g.heroI + ri * px + a, g.heroJ + rj * px + b], c, extra); return o; };
  HERO.forEach((row, rj) => row.split('').forEach((ch, ri) => { if (ch !== '.') sprite += block(ri, rj, HERO_COLORS[ch]); }));
  sprite += block(9, 6, '#7FFFD4', ' class="blink"');     // the glowing tip of the blaster
  body += `<g>${sprite}</g>`;
  const tipX = (g.heroI + 10 * px) * PITCH + 6, tipY = (g.heroJ + 6.5 * px) * PITCH;

  // the fight: each bug flies out of the black hole, a shot leaves the blaster, they meet, and the bug pops
  const n = g.meets.length;
  let fight = '';
  g.meets.forEach(([mx, my], k) => {
    const delay = `animation-delay:${(-k * LOOP / n).toFixed(2)}s`;
    css += `\n  @keyframes bug${k} { 0% { transform: translate(${bx}px, ${by}px) scale(.15); opacity: 0; } 3% { opacity: 1; } 38% { transform: translate(${mx}px, ${my}px) scale(1); opacity: 1; } 40%, 100% { transform: translate(${mx}px, ${my}px) scale(1.6); opacity: 0; } }`;
    css += `\n  @keyframes shot${k} { 0%, 30% { transform: translate(${tipX}px, ${tipY}px); opacity: 0; } 31% { opacity: 1; } 38% { transform: translate(${mx}px, ${my}px); opacity: 1; } 39%, 100% { transform: translate(${mx}px, ${my}px); opacity: 0; } }`;
    const ang = (Math.atan2(my - tipY, mx - tipX) * 180 / Math.PI).toFixed(1);
    const len = mobile ? 11 : 16;
    fight += `<g class="fx" style="animation-name:shot${k};${delay}"><g transform="rotate(${ang})"><path stroke="#7FFFD4" stroke-opacity=".35" stroke-width="${mobile ? 7 : 9}" stroke-linecap="round" d="M${-len} 0H0"/><path stroke="#EFFFF9" stroke-width="${mobile ? 2.6 : 3.4}" stroke-linecap="round" d="M${-len} 0H0"/></g></g>`;
    const label = BUGS[k % BUGS.length], color = BUG_COLORS[k % BUG_COLORS.length];
    fight += `<g class="fx" style="animation-name:bug${k};${delay}">${P(outline(F.label, label, 0, g.bugSize * 0.34, g.bugSize, { anchor: 'middle', track: 0.03 }), color, haloAttrs(HALO, mobile ? 3.5 : 4.5))}</g>`;
    // the pop: a small ring of dots
    let pop = `<circle cx="${mx}" cy="${my}" r="${mobile ? 3 : 4}" fill="#FFFFFF"/>`;
    for (let a = 0; a < 8; a++) {
      const rad = mobile ? 10 : 14, px = mx + rad * Math.cos(a * Math.PI / 4), py = my + rad * Math.sin(a * Math.PI / 4);
      pop += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${mobile ? 2 : 2.6}" fill="${a % 2 ? '#FFE59A' : color}"/>`;
    }
    fight += `<g class="burst" style="${delay}">${pop}</g>`;
  });
  body += `<g>${fight}</g>`;

  // ragged, dithered bottom edge that dissolves into the page
  let holes = '';
  for (let j = Math.floor((H - 100) / PITCH); j < rows + 1; j++) for (let i = 0; i < cols + 1; i++) {
    const [x, y] = cell(i, j, PITCH), p = Math.min(1, Math.max(0, (y - (H - 100)) / 92));
    if (R() < p * p * 1.1) holes += `<circle cx="${x}" cy="${y}" r="3.1" fill="${T.page}"/>`;
  }
  body += holes + `<rect y="${H - 12}" width="${W}" height="12" fill="${T.page}"/>`;

  // ---------- words ----------
  const nameSize = mobile ? 86 : 172, nameTrack = 0.01;
  const capH = nameSize * 0.6;
  const y1 = (mobile ? 58 : 62) + capH, y2 = y1 + nameSize * 0.74;
  body += `<g class="rise">${P(outline(F.pixel, NAME[0], W / 2, y1, nameSize, { anchor: 'middle', track: nameTrack }), INK, haloAttrs(HALO, mobile ? 7 : 12))}</g>`;
  body += `<g class="rise r2">${P(outline(F.pixel, NAME[1], W / 2, y2, nameSize, { anchor: 'middle', track: nameTrack }), INK, haloAttrs(HALO, mobile ? 7 : 12))}</g>`;
  const subSize = mobile ? 14 : 21, sy2 = y2 + (mobile ? 34 : 54);
  body += `<g class="rise r3">${P(outline(F.label, SUB, W / 2, sy2, subSize, { anchor: 'middle', track: 0.02 }), INK, haloAttrs(HALO, mobile ? 5 : 7))}</g>`;
  const tagSize = mobile ? 15.5 : 22, tagLines = wrap(F.bodyM, TAG, tagSize, mobile ? W - 44 : 720);
  body += `<g class="rise r4">${tagLines.map((l, k) => P(outline(F.bodyM, l, W / 2, sy2 + (mobile ? 30 : 42) + k * tagSize * 1.42, tagSize, { anchor: 'middle' }), INK, haloAttrs(HALO, mobile ? 5 : 7))).join('')}</g>`;
  // the black hole's name
  body += `<g class="fade">${P(outline(F.label, 'TON 618', bx, by + br * 1.45 + (mobile ? 22 : 34), mobile ? 10.5 : 13.5, { anchor: 'middle', track: 0.08 }), '#FFD9A0', haloAttrs(HALO, mobile ? 3.5 : 4.5))}</g>`;

  return svgDoc(W, H, `Muhammad Sheraz. ${SUB.replace(/\s+\/\s+/, ', ')}. ${TAG}`, body, css);
}

for (const T of Object.values(THEMES)) {
  out(`assets/${T.name}/hero.svg`, hero(T, { W: 1000, H: 720 }));
  out(`assets/${T.name}/m/hero.svg`, hero(T, { W: 400, H: 560, mobile: true }));
}
