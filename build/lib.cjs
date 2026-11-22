// Shared pieces for the profile artwork: fonts (drawn as outlines, because GitHub serves repo images
// with `default-src 'none'` and an SVG there can't load fonts), the dot grid, colours and helpers.
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

const root = path.join(__dirname, '..');
const fsrc = (pkg, file) => path.join(root, 'node_modules', '@fontsource', pkg, 'files', file);
const load = (f) => { const b = fs.readFileSync(f); return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };

const F = {
  pixel: load(fsrc('jersey-25', 'jersey-25-latin-400-normal.woff')),        // display: names, titles
  label: load(fsrc('pixelify-sans', 'pixelify-sans-latin-600-normal.woff')), // labels, buttons
  labelR: load(fsrc('pixelify-sans', 'pixelify-sans-latin-500-normal.woff')),
  body: load(fsrc('geist-sans', 'geist-sans-latin-400-normal.woff')),
  bodyM: load(fsrc('geist-sans', 'geist-sans-latin-500-normal.woff')),
  bodyS: load(fsrc('geist-sans', 'geist-sans-latin-600-normal.woff')),
};

/** Day = GitHub light, night = GitHub dark. `page` equals GitHub's own page colour so text sections blend in. */
const THEMES = {
  day: {
    name: 'day', page: '#FFFFFF', ink: '#0E1324', ink2: '#343B52', muted: '#5B6480', accent: '#2B59E0', green: '#0E9F6E',
    red: '#E2473B', amber: '#F2A81D', rule: '#C3CCE4', halo: '#F7FAFF',
    panel: '#EDF1FA', panelDot: '#C5CFEA', panelDot2: '#A9B6DE', lit: '#2B59E0', lit2: '#0E9F6E', litInk: '#16203F',
    sky: ['#1E55DC', '#3B78EA', '#78A9F2', '#C4DBF8'], skyGap: '#F4F7FD',
    sun: ['#FFE68A', '#FFBE2E'], cloud: '#FFFFFF', mount: '#8693DC', snow: '#F4F7FF', hillFar: '#7C8CDB', hillMid: '#5266C4', hillNear: '#3A4FA8',
    trees: '#2C6B3F', city: '#2E3F94', window: '#DDE8FF', meadow: ['#8AD173', '#5BAF4F', '#3B8C3C'], ring: '#FFC94D', tower: '#141B3A',
    flowers: ['#FF6B8B', '#FFD34D', '#FFFFFF', '#FF9F43', '#C78BFF'], btn: '#0E1324', btnText: '#FFFFFF', btnShadow: '#9DB0E8',
    btn2: '#FFFFFF', btn2Text: '#0E1324', shot: '#DDE4F4',
  },
  night: {
    name: 'night', page: '#0D1117', ink: '#EEF2FB', ink2: '#C3CADB', muted: '#8C96AE', accent: '#7EA2FF', green: '#3DDC97',
    red: '#FF6B5E', amber: '#FFC44D', rule: '#2A3350', halo: '#0A0E1A',
    panel: '#111827', panelDot: '#222C46', panelDot2: '#34406A', lit: '#7EA2FF', lit2: '#3DDC97', litInk: '#E8EEFF',
    sky: ['#070B1C', '#0E1636', '#1B2556', '#2D3270'], skyGap: '#060913',
    sun: ['#F4F1FF', '#C9CCF5'], cloud: '#353E7A', mount: '#2B336F', snow: '#8E99D6', hillFar: '#343D88', hillMid: '#252C66', hillNear: '#1A2050',
    trees: '#0F2E2A', city: '#0D1132', window: '#FFD66B', meadow: ['#245E46', '#1A4836', '#113426'], ring: '#7FE7FF', tower: '#B4BEEB',
    flowers: ['#FFFFFF', '#BFD3FF', '#FFE59A', '#9FF0D0', '#E0C2FF'], btn: '#EEF2FB', btnText: '#0D1117', btnShadow: '#3B4C8C',
    btn2: '#0D1117', btn2Text: '#EEF2FB', shot: '#1A2236',
    aurora: ['#38E5B0', '#3BB8FF', '#9B7BFF'],
  },
};

/** Deterministic random numbers, so every build draws the same picture. */
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Width of a string in px (kerning + tracking in em). */
function measure(font, str, size, track = 0) {
  const g = font.stringToGlyphs(str), k = size / font.unitsPerEm;
  let w = 0;
  g.forEach((gl, i) => { w += gl.advanceWidth * k + (i < g.length - 1 ? track * size + font.getKerningValue(gl, g[i + 1]) * k : 0); });
  return w;
}
/** Outline path data for a string; anchor 'start' | 'middle' | 'end'. */
function outline(font, str, x, y, size, { track = 0, anchor = 'start' } = {}) {
  if (anchor === 'end') x -= measure(font, str, size, track);
  if (anchor === 'middle') x -= measure(font, str, size, track) / 2;
  const g = font.stringToGlyphs(str), k = size / font.unitsPerEm;
  let pen = x, d = '';
  g.forEach((gl, i) => {
    if (gl.index === 0 && str[i] !== ' ') throw new Error(`missing glyph "${str[i]}" in "${str}"`);
    d += gl.getPath(pen, y, size).toPathData(1);
    pen += gl.advanceWidth * k + track * size + (i < g.length - 1 ? font.getKerningValue(gl, g[i + 1]) * k : 0);
  });
  return d;
}
function wrap(font, text, size, maxW, track = 0) {
  const words = text.split(' '), lines = [];
  let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (measure(font, t, size, track) > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}
const P = (d, fill, extra = '') => `<path fill="${fill}"${extra} d="${d}"/>`;
/** Text with a soft outline ("halo") so it reads on top of the dot scenes. */
const haloAttrs = (color, w) => ` stroke="${color}" stroke-width="${w}" stroke-linejoin="round" paint-order="stroke"`;

/**
 * The dot grid: a 7x7 tile of dots with slightly different brightness each, used as a mask, so anything
 * drawn under it shows up as dots, and a light moving underneath makes the dots glow and dim.
 */
function dotMask(id, W, H, { pitch = 7, r = 2.95, vary = 0.3, seed = 7, ox = 0, oy = 0 } = {}) {
  const N = 7, R = rng(seed);
  let c = '';
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    c += `<circle cx="${((x + 0.5) * pitch).toFixed(2)}" cy="${((y + 0.5) * pitch).toFixed(2)}" r="${r}" fill="#fff" fill-opacity="${(1 - R() * vary).toFixed(2)}"/>`;
  }
  return `<pattern id="${id}p" x="${ox}" y="${oy}" width="${N * pitch}" height="${N * pitch}" patternUnits="userSpaceOnUse">${c}</pattern>`
    + `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#${id}p)"/></mask>`;
}
/** Centre of grid cell (i, j). */
const cell = (i, j, pitch = 7, ox = 0, oy = 0) => [ox + (i + 0.5) * pitch, oy + (j + 0.5) * pitch];

/** Twinkling dots: individual grid dots that glow and dim at their own pace. */
function twinkles(points, R, { r = 2.95, min = 0.12, minDur = 1.6, maxDur = 4.6 } = {}) {
  return points.map(([x, y, color]) => {
    const d = (minDur + R() * (maxDur - minDur)).toFixed(2), dl = (-R() * 6).toFixed(2);
    return `<circle class="tw" style="animation-duration:${d}s;animation-delay:${dl}s;--min:${min}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${color}"/>`;
  }).join('');
}

/** CSS shared by every animated picture. Everything stops for people who ask for less motion. */
const BASE_CSS = `
  .tw { animation-name: tw; animation-timing-function: ease-in-out; animation-iteration-count: infinite; animation-direction: alternate; }
  @keyframes tw { from { opacity: var(--min, .12); } to { opacity: 1; } }
  .rise { animation: rise .9s cubic-bezier(.2,.7,0,1) both; }
  .r2 { animation-delay: .12s; } .r3 { animation-delay: .3s; } .r4 { animation-delay: .45s; }
  @keyframes rise { from { transform: translateY(16px); } to { transform: none; } }
  .fade { animation: fade 1s ease .5s both; }
  @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`;

function svgDoc(W, H, label, body, css = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${label.replace(/"/g, '&quot;')}">
<title>${label.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</title>
<style>${BASE_CSS}${css}
</style>
${body}
</svg>
`;
}
function out(rel, svg) {
  const f = path.join(root, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, svg);
  console.log(rel.padEnd(42), Math.round(svg.length / 1024) + ' KB');
}

module.exports = { F, THEMES, rng, measure, outline, wrap, P, haloAttrs, dotMask, cell, twinkles, svgDoc, out, root };
