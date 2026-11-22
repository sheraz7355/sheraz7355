// Every section after the banner, drawn as animated dot-matrix SVG (day + night, desktop + phone):
// buttons, about, work header, one card per project (with a live dot illustration), how it works,
// toolbox and contact. Text is outlined (GitHub blocks fonts inside images). Run: node build/sections.cjs
const { F, THEMES, rng, measure, outline, wrap, P, dotMask, twinkles, svgDoc, out } = require('./lib.cjs');

const PITCH = 7;
const g = (i) => 3.5 + PITCH * i;             // centre of grid cell i
const EMAIL = 'muhammadsheraz7355@gmail.com';

// ---------------------------------------------------------------- text helpers
function para(font, text, x, y, size, lead, maxW, fill, { anchor = 'start', track = 0, cls = '' } = {}) {
  const lines = wrap(font, text, size, maxW, track);
  const d = lines.map((l, k) => outline(font, l, x, y + k * lead, size, { anchor, track })).join('');
  return { svg: `<path${cls ? ` class="${cls}"` : ''} fill="${fill}" d="${d}"/>`, h: (lines.length - 1) * lead, n: lines.length };
}
const label = (T, str, x, y, size, color, anchor = 'start') => P(outline(F.label, str, x, y, size, { track: 0.06, anchor }), color || T.accent);
function arrow(x, y, s, color, w = 2.2) {
  return `<path fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="square" d="M${x} ${y + s}L${x + s} ${y}M${x + s * .3} ${y}H${x + s}V${y + s * .7}"/>`;
}

// ---------------------------------------------------------------- animation helpers (per document)
function Anim(loop) {
  const css = new Map();
  return {
    /** visible between from% and to% of the loop */
    show(from, to = 92) {
      const n = `s${from}_${to}`.replace(/\./g, '_');
      css.set(n, `.${n}{animation:${n} ${loop}s infinite}@keyframes ${n}{0%,${from - 0.1}%{opacity:0}${from}%,${to}%{opacity:1}${Math.min(to + 3, 100)}%,100%{opacity:0}}`);
      return n;
    },
    /** a path with pathLength=1 drawn between from% and to% */
    draw(from, to, end = 92) {
      const n = `d${from}_${to}_${end}`.replace(/\./g, '_');
      css.set(n, `.${n}{stroke-dasharray:1;animation:${n} ${loop}s infinite}@keyframes ${n}{0%,${from}%{stroke-dashoffset:1;opacity:1}${to}%,${end}%{stroke-dashoffset:0;opacity:1}${Math.min(end + 3, 100)}%,100%{stroke-dashoffset:0;opacity:0}}`);
      return n;
    },
    /** blink while visible */
    blink(from, to = 92) {
      const n = `b${from}_${to}`;
      css.set(n, `.${n}{animation:${n} ${loop}s infinite}@keyframes ${n}{0%,${from - 0.1}%{opacity:0}${from}%{opacity:1}${from + 3}%{opacity:.25}${from + 6}%{opacity:1}${from + 9}%{opacity:.25}${from + 12}%,${to}%{opacity:1}${Math.min(to + 3, 100)}%,100%{opacity:0}}`);
      return n;
    },
    css: () => [...css.values()].join('\n'),
  };
}
const SHARED_CSS = `
  .flow { animation: flow .7s steps(2) infinite; }
  .flowr { animation: flowr .7s steps(2) infinite; }
  @keyframes flow { to { stroke-dashoffset: -14; } }
  @keyframes flowr { to { stroke-dashoffset: 14; } }
  .ring { transform-box: fill-box; transform-origin: center; animation: ring 2.6s ease-out infinite; }
  @keyframes ring { from { transform: scale(.15); opacity: 1; } to { transform: scale(1); opacity: 0; } }
  .bar { transform-box: fill-box; transform-origin: center; animation: bar .9s ease-in-out infinite alternate; }
  @keyframes bar { from { transform: scaleY(.25); } to { transform: scaleY(1); } }
  .spin { transform-box: fill-box; transform-origin: center; animation: spin 14s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .breathe { animation: breathe 2.8s ease-in-out infinite alternate; }
  @keyframes breathe { from { opacity: .55; } to { opacity: 1; } }`;

// ---------------------------------------------------------------- grid drawing (cells)
const rectC = (i0, j0, i1, j1, c, cls = '') => `<rect${cls ? ` class="${cls}"` : ''} x="${g(i0) - 3.4}" y="${g(j0) - 3.4}" width="${(i1 - i0) * PITCH + 6.8}" height="${(j1 - j0) * PITCH + 6.8}" fill="${c}"/>`;
const boxC = (i0, j0, i1, j1, c, cls = '') => `<g${cls ? ` class="${cls}"` : ''}>${rectC(i0, j0, i1, j0, c)}${rectC(i0, j1, i1, j1, c)}${rectC(i0, j0, i0, j1, c)}${rectC(i1, j0, i1, j1, c)}</g>`;
const pathC = (pts, c, extra = '') => `<path fill="none" stroke="${c}" stroke-width="6.4" stroke-linecap="square" stroke-linejoin="miter"${extra} d="M${pts.map(([i, j]) => `${g(i)} ${g(j)}`).join('L')}"/>`;
const flowC = (pts, c, cls = 'flow', extra = '') => pathC(pts, c, ` class="${cls}" stroke-dasharray="1 13"${extra}`);
const dotC = (i, j, c, r = 3.2, cls = '') => `<circle${cls ? ` class="${cls}"` : ''} cx="${g(i)}" cy="${g(j)}" r="${r}" fill="${c}"/>`;

// ---------------------------------------------------------------- the illustration panel (63 x 48 cells)
const PW = 63 * PITCH, PH = 48 * PITCH;
function panel(T, id, illo, seed) {
  const R = rng(seed);
  let defs = dotMask(id, PW, PH, { pitch: PITCH, seed });
  defs += `<linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${T.panelDot2}" stop-opacity="0"/><stop offset=".5" stop-color="${T.panelDot2}" stop-opacity=".95"/><stop offset="1" stop-color="${T.panelDot2}" stop-opacity="0"/></linearGradient>`;
  const tw = [];
  for (let n = 0; n < 26; n++) tw.push([g(Math.floor(R() * 63)), g(Math.floor(R() * 48)), R() < .7 ? T.panelDot2 : T.lit]);
  return `<defs>${defs}</defs><rect width="${PW}" height="${PH}" fill="${T.panel}"/>
<g mask="url(#${id})"><rect width="${PW}" height="${PH}" fill="${T.panelDot}"/>
<g class="psweep"><rect x="0" y="-${PH}" width="150" height="${PH * 3}" fill="url(#${id}s)" transform="rotate(14)"/></g>
${illo}</g>${twinkles(tw, R, { r: 2.95, min: 0 })}`;
}
const PANEL_CSS = `.psweep { animation: psweep 7s linear infinite; } @keyframes psweep { from { transform: translateX(-260px); } to { transform: translateX(${PW + 120}px); } }`;

// ---------------------------------------------------------------- the five illustrations
const ILLOS = {
  alwaysAnswer(T, A) {
    const ink = T.litInk, muted = T.panelDot2;
    let s = '';
    // the caller's phone, with a voice inside
    s += boxC(4, 12, 14, 35, ink) + rectC(8, 14, 10, 14, ink) + dotC(9, 33, ink);
    [6, 7, 8, 9, 10, 11, 12].forEach((i, k) => { const h = [2, 4, 6, 7, 5, 3, 2][k]; s += `<g class="bar" style="animation-delay:${-k * .13}s">${rectC(i, 23 - h, i, 23 + h, T.lit)}</g>`; });
    s += `<circle class="ring" cx="${g(9)}" cy="${g(23)}" r="70" fill="none" stroke="${T.lit}" stroke-width="6.4"/>`;
    s += `<circle class="ring" style="animation-delay:-1.3s" cx="${g(9)}" cy="${g(23)}" r="70" fill="none" stroke="${T.lit}" stroke-width="6.4"/>`;
    // into the chat
    s += flowC([[16, 23], [21, 23]], T.lit);
    s += boxC(23, 8, 42, 40, ink) + rectC(23, 12, 42, 12, ink) + rectC(25, 10, 27, 10, T.lit2);
    s += rectC(25, 15, 34, 17, muted, A.show(6));
    s += rectC(30, 20, 40, 23, T.lit, A.show(20));
    s += rectC(25, 26, 32, 28, muted, A.show(38));
    ['48', '52', '56'].forEach((p, k) => { s += dotC(30 + k * 2, 32, ink, 3.2, A.show(46 + k * 2, 60)); });
    s += rectC(28, 31, 40, 35, T.lit, A.show(62));
    // and out to the team
    s += `<g class="${A.show(68)}">${flowC([[43, 23], [48, 23]], T.lit2)}</g>`;
    s += boxC(49, 14, 58, 32, ink) + rectC(52, 16, 55, 16, ink);
    s += rectC(51, 20, 56, 22, T.lit2, A.blink(72)) + rectC(51, 24, 54, 24, T.lit2, A.show(76));
    s += dotC(58, 13, T.red, 3.4, A.blink(72));
    return s;
  },
  sulehri(T, A) {
    const ink = T.litInk, code = T.panelDot2;
    let s = '';
    s += boxC(5, 4, 57, 37, ink) + rectC(30, 38, 32, 41, ink) + rectC(24, 42, 38, 42, ink);
    const lines = [[9, 30], [11, 38], [11, 26], [13, 40], [11, 33], [9, 21], [11, 36], [13, 31], [9, 17]];
    lines.forEach(([a, b], k) => { s += rectC(a, 8 + k * 3, Math.min(b, k >= 4 ? 38 : 52), 8 + k * 3, code); });
    // the pencil circles one line, underlines another, writes a note
    s += `<ellipse class="${A.draw(8, 22)}" pathLength="1" cx="${g(25)}" cy="${g(17)}" rx="122" ry="17" fill="none" stroke="${T.red}" stroke-width="6.4"/>`;
    s += `<path class="${A.draw(28, 36)}" pathLength="1" fill="none" stroke="${T.amber}" stroke-width="6.4" d="M${g(11)} ${g(24)}H${g(33)}"/>`;
    s += `<path class="${A.draw(38, 50)}" pathLength="1" fill="none" stroke="${T.red}" stroke-width="6.4" stroke-linejoin="round" d="M${g(44)} ${g(13)}l7 -7 7 7 7 -7 7 7 7 -7 7 7 7 -7"/>`;
    // and sketches a little tree
    const nodes = [[48, 21], [44, 28], [52, 28], [41, 34], [47, 34]];
    const edges = [[0, 1], [0, 2], [1, 3], [1, 4]];
    edges.forEach(([a, b], k) => { s += `<path class="${A.draw(54 + k * 5, 58 + k * 5)}" pathLength="1" fill="none" stroke="${T.lit}" stroke-width="6.4" d="M${g(nodes[a][0])} ${g(nodes[a][1])}L${g(nodes[b][0])} ${g(nodes[b][1])}"/>`; });
    nodes.forEach(([i, j], k) => { s += `<g class="${A.show(52 + k * 5)}">${rectC(i - 1, j - 1, i + 1, j + 1, T.lit2)}</g>`; });
    // the cursor, pointing while it talks
    s += `<path fill="${ink}" d="M${g(38)} ${g(15)}l0 30 8 -8 6 13 6 -3 -6 -12 11 0z"/>`;
    [0, 1, 2].forEach((k) => { s += `<g class="bar" style="animation-delay:${-k * .25}s">${rectC(43 + k * 2, 44, 43 + k * 2, 46, T.lit)}</g>`; });
    return s;
  },
  wolfDrivers(T, A) {
    const street = T.panelDot2;
    let s = '';
    [6, 18, 30, 42].forEach((j) => { s += rectC(2, j, 60, j, street); });
    [5, 19, 33, 47, 59].forEach((i) => { s += rectC(i, 2, i, 45, street); });
    s += rectC(8, 9, 12, 14, T.amber) + rectC(9, 10, 11, 10, T.panel);              // the store
    const route = [[5, 6], [19, 6], [19, 18], [33, 18], [33, 30], [47, 30], [47, 42], [59, 42]];
    const route2 = [[59, 6], [47, 6], [47, 18], [33, 18], [33, 42], [19, 42], [19, 30], [5, 30]];
    s += `<g opacity=".5">${pathC(route, T.lit)}</g>` + flowC(route, T.lit);
    s += `<g opacity=".4">${pathC(route2, T.lit2)}</g>` + flowC(route2, T.lit2, 'flowr');
    [[33, 18], [47, 30], [59, 42], [19, 42], [5, 30]].forEach(([i, j], k) => {
      s += rectC(i - 1, j - 1, i + 1, j + 1, k < 3 ? T.lit : T.lit2);
      s += `<circle class="ring" style="animation-delay:${-k * .5}s" cx="${g(i)}" cy="${g(j)}" r="30" fill="none" stroke="${k < 3 ? T.lit : T.lit2}" stroke-width="6"/>`;
    });
    const mp = (pts) => 'M' + pts.map(([i, j]) => `${g(i)} ${g(j)}`).join('L');
    [[route, T.amber, 9], [route2, T.red, 11]].forEach(([pts, c, dur]) => {
      [0, .18, .36].forEach((lag, k) => {
        s += `<circle r="${[11, 7, 5][k]}" fill="${c}" opacity="${[1, .7, .4][k]}"><animateMotion dur="${dur}s" begin="-${lag}s" repeatCount="indefinite" path="${mp(pts)}"/></circle>`;
      });
    });
    return s;
  },
  solarKon(T, A) {
    const ink = T.litInk;
    let s = '';
    // the sun
    s += `<circle class="breathe" cx="${g(52)}" cy="${g(9)}" r="27" fill="${T.amber}"/>`;
    let rays = '';
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4, x1 = g(52) + Math.cos(a) * 42, y1 = g(9) + Math.sin(a) * 42, x2 = g(52) + Math.cos(a) * 62, y2 = g(9) + Math.sin(a) * 62;
      rays += `<path stroke="${T.amber}" stroke-width="6.4" d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}"/>`;
    }
    s += `<g class="spin">${rays}</g>`;
    // light falling on the panels
    s += flowC([[46, 14], [30, 24]], T.amber, 'flow', ' stroke-opacity=".9"');
    s += flowC([[42, 9], [20, 22]], T.amber, 'flow', ' stroke-opacity=".6"');
    // solar panels
    s += boxC(4, 25, 30, 37, T.lit);
    [10, 16, 23].forEach((i) => { s += rectC(i, 25, i, 37, T.lit); });
    s += rectC(4, 31, 30, 31, T.lit);
    s += rectC(9, 38, 9, 42, ink) + rectC(25, 38, 25, 42, ink);
    s += `<clipPath id="pc"><rect x="${g(4)}" y="${g(25)}" width="${26 * PITCH}" height="${12 * PITCH}"/></clipPath>`;
    s += `<g clip-path="url(#pc)"><rect class="${A.show(10, 30)}" x="${g(4)}" y="${g(25)}" width="${26 * PITCH}" height="${12 * PITCH}" fill="${T.lit}" opacity=".55"/></g>`;
    // power to the house
    s += flowC([[31, 34], [36, 34], [36, 38], [40, 38]], T.amber);
    s += boxC(40, 30, 55, 42, ink);
    s += pathC([[38, 31], [47, 22], [57, 31]], ink);
    s += rectC(47, 37, 48, 42, ink);
    s += rectC(42, 33, 44, 35, T.amber, A.show(34)) + rectC(51, 33, 53, 35, T.amber, A.show(44));
    s += rectC(0, 43, 62, 43, T.lit2);
    return s;
  },
  telemetry(T, A) {
    const ink = T.litInk;
    let s = '';
    // live telemetry trace
    const trace = [[3, 10], [9, 10], [11, 7], [13, 13], [15, 10], [20, 10], [22, 4], [24, 15], [26, 10], [33, 10]];
    s += `<path class="${A.draw(0, 30, 95)}" pathLength="1" fill="none" stroke="${T.lit2}" stroke-width="6.4" stroke-linejoin="miter" d="M${trace.map(([i, j]) => `${g(i)} ${g(j)}`).join('L')}"/>`;
    // the road, moving
    s += rectC(0, 31, 62, 31, ink) + rectC(0, 46, 62, 46, ink);
    s += pathC([[0, 39], [62, 39]], T.panelDot2, ' stroke-dasharray="21 21" class="road"');
    // the car
    s += `<g class="car">${rectC(12, 35, 25, 38, T.lit)}${rectC(15, 33, 21, 34, T.lit)}${rectC(14, 39, 15, 40, ink)}${rectC(22, 39, 23, 40, ink)}</g>`;
    // crash
    s += `<g class="${A.show(30, 70)}">${rectC(12, 35, 25, 38, T.red)}</g>`;
    [0, 4, 8].forEach((d) => { s += `<circle class="${A.show(30 + d, 62)} ring" cx="${g(26)}" cy="${g(36)}" r="60" fill="none" stroke="${T.red}" stroke-width="6.4"/>`; });
    // the alert travels to the hospital
    s += `<g class="${A.show(40)}">${flowC([[19, 31], [19, 21], [40, 21], [40, 10], [42, 10]], T.amber)}</g>`;
    s += boxC(43, 4, 56, 17, ink);
    s += `<g class="${A.blink(58)}">${rectC(48, 7, 50, 14, T.red)}${rectC(46, 9, 52, 12, T.red)}</g>`;
    s += `<g class="${A.show(66)}">${flowC([[56, 17], [56, 25], [60, 25]], T.lit2)}</g>`;
    return s;
  },
};
const ROAD_CSS = `.road { animation: road .9s linear infinite; } @keyframes road { to { stroke-dashoffset: 42; } }
  .car { animation: car 8s infinite; } @keyframes car { 0%, 28% { transform: translateX(-90px); } 30%, 92% { transform: none; } 100% { transform: translateX(-90px); } }`;

// ---------------------------------------------------------------- projects
const PROJECTS = [
  { key: 'always-answer', illo: 'alwaysAnswer', no: '01', status: 'In production', title: 'Always Answer',
    desc: 'AI agents that answer phone calls, website chats and text messages for businesses in Canada, around the clock. When a customer needs the team, the agent sends them a short summary by text and email.',
    meta: [['Role', 'Software engineer'], ['Built', 'Voice agents, website chat, team alerts, owner dashboard'], ['Stack', 'TypeScript, Node.js, OpenAI Realtime, Claude, Next.js, NestJS, Firebase']] },
  { key: 'sulehri', illo: 'sulehri', no: '02', status: 'My own project', title: 'Sulehri', link: 'View the code',
    desc: 'An AI tutor that lives next to your mouse on the Mac. Hold two keys and ask out loud: it explains in simple words, by voice, while it points, underlines and draws on your actual screen.',
    meta: [['Role', 'Designer and developer'], ['Built', 'Mac app, live drawing on the screen, voice in and out, lesson board'], ['Stack', 'Swift, AppKit, Speech, WebKit, Claude, Kokoro voice']] },
  { key: 'wolfdrivers', illo: 'wolfDrivers', no: '03', status: 'Ran in production', title: 'WolfDrivers', link: 'wolfdrivers.com',
    desc: 'The platform a delivery business ran on: a web app for dispatch, a mobile app for drivers, managers and stores, and an AI phone agent that took customer orders.',
    meta: [['Role', 'Software engineer'], ['Built', 'Dispatch web app, mobile app, AI phone ordering, automations'], ['Stack', 'React, React Native (Expo), Supabase, Firebase, PostgreSQL']] },
  { key: 'solarkon', illo: 'solarKon', no: '04', status: 'Live', title: 'SolarKon', link: 'solarkon.org',
    desc: 'The website of a solar energy company: its services, projects, a product store and financing, with an admin panel where the team edits every page themselves.',
    meta: [['Role', 'Web developer, freelance'], ['Built', 'Company website, product store, admin panel'], ['Stack', 'Laravel, PHP, Inertia, React, Tailwind CSS']] },
  { key: 'telemetry-pro', illo: 'telemetry', no: '05', status: 'Project', title: 'Telemetry Pro', link: 'View the code',
    desc: 'A vehicle safety system that detects crashes and automatically alerts hospitals and ambulances, with a live telemetry dashboard.',
    meta: [['Built', 'Crash detection, emergency alerts, telemetry dashboard'], ['Code', 'github.com/sheraz7355/TELEMETRY-PRO']] },
];

function card(T, p, idx, mobile) {
  const A = Anim(8);
  const flip = idx % 2 === 1;
  const W = mobile ? 480 : 1000;
  const sz = mobile
    ? { lab: 17, title: 66, desc: 22.5, lead: 33, mlab: 15, mval: 19.5, mlead: 27, link: 19, tw: 440 }
    : { lab: 15, title: 62, desc: 18.5, lead: 28.5, mlab: 13, mval: 16, mlead: 23, link: 16, tw: 430 };
  const px = mobile ? (W - PW) / 2 : (flip ? 40 : W - 40 - PW), py = mobile ? 16 : 0;
  const tx = mobile ? 20 : (flip ? 40 + PW + 50 : 40);
  let y = mobile ? py + PH + 46 : 0;
  let t = '';
  // number + status
  t += label(T, p.no, tx, y + sz.lab, sz.lab, T.accent);
  t += label(T, p.status.toUpperCase(), tx + measure(F.label, p.no, sz.lab, .06) + 14, y + sz.lab, sz.lab, T.muted);
  y += sz.lab + sz.title * .92;
  t += P(outline(F.pixel, p.title, tx - 2, y, sz.title, { track: .01 }), T.ink);
  y += sz.desc * 1.9;
  const d = para(F.body, p.desc, tx, y, sz.desc, sz.lead, sz.tw, T.ink2); t += d.svg; y += d.h + sz.desc * 1.9;
  const mlw = mobile ? 64 : 56;
  p.meta.forEach(([k, v]) => {
    t += label(T, k.toUpperCase(), tx, y, sz.mlab, T.accent);
    const m = para(F.bodyM, v, tx + mlw, y, sz.mval, sz.mlead, sz.tw - mlw, T.ink); t += m.svg; y += m.h + sz.mlead + 6;
  });
  if (p.link) {
    y += 8;
    const lw = measure(F.label, p.link, sz.link, .02);
    t += P(outline(F.label, p.link, tx, y, sz.link, { track: .02 }), T.ink) + arrow(tx + lw + 8, y - sz.link * .72, sz.link * .62, T.ink);
    t += `<rect x="${tx}" y="${y + 7}" width="${lw + 8 + sz.link * .7}" height="2.2" fill="${T.ink}"/>`;
    y += 10;
  }
  const textH = y;
  let H, ty;
  if (mobile) { H = Math.ceil(textH + 36); ty = 0; }
  else { H = Math.ceil(Math.max(textH, PH) + 60); ty = Math.round((H - textH) / 2); }
  const pyy = mobile ? py : Math.round((H - PH) / 2);
  const illo = ILLOS[p.illo](T, A);
  const body = `<rect width="${W}" height="${H}" fill="${T.page}"/>
<g transform="translate(${px} ${pyy})">${panel(T, 'pm', illo, 30 + idx)}</g>
<g transform="translate(0 ${ty})"><g class="rise">${t}</g></g>`;
  const alt = `${p.no}. ${p.title}. ${p.status}. ${p.desc} ${p.meta.map(([k, v]) => `${k}: ${v}.`).join(' ')}`;
  return svgDoc(W, H, alt, body, SHARED_CSS + PANEL_CSS + ROAD_CSS + A.css());
}

// ---------------------------------------------------------------- section header (label + big title + intro)
function header(T, lab, title, intro, mobile, { id = 'h' } = {}) {
  const W = mobile ? 480 : 1000, x = mobile ? 20 : 40;
  const ls = mobile ? 17 : 15, ts = mobile ? 54 : 64, is = mobile ? 21.5 : 19;
  let y = 30, s = '';
  s += label(T, lab.toUpperCase(), x, y + ls, ls); y += ls + 14;
  // a short dotted rule under the label, which glows
  for (let k = 0; k < 10; k++) s += `<circle class="tw" style="animation-duration:1.4s;animation-delay:${-k * .14}s;--min:.25" cx="${x + 3 + k * 9}" cy="${y}" r="2.9" fill="${T.accent}"/>`;
  y += ts * .95;
  const tl = wrap(F.pixel, title, ts, W - 2 * x);
  tl.forEach((l, k) => { s += P(outline(F.pixel, l, x - 2, y + k * ts * .86, ts, { track: .01 }), T.ink); });
  y += (tl.length - 1) * ts * .86;
  if (intro) { y += is * 2; const p = para(F.body, intro, x, y, is, is * 1.55, mobile ? W - 2 * x : 700, T.ink2); s += p.svg; y += p.h; }
  const H = Math.ceil(y + (mobile ? 26 : 30));
  void id;
  return svgDoc(W, H, `${lab}. ${title}. ${intro || ''}`, `<rect width="${W}" height="${H}" fill="${T.page}"/><g class="rise">${s}</g>`);
}

// ---------------------------------------------------------------- about
const ABOUT_TITLE = 'I build AI agents, and the systems that put them to work.';
const ABOUT = [
  "I'm a software engineer in Lahore. Most of my work is AI agents that talk to customers for real businesses: voice agents that answer the phone, assistants that reply on websites and by text, and the automation that turns each conversation into an order, a request or a task for the team.",
  'I also build the operations software those businesses run on, and my own tools, like Sulehri, an AI tutor for the Mac. What I care about is simple: systems that work in production, every day.',
];
const FOCUS = [
  ['Voice agents', 'Answer phone calls, take orders and requests, and hand off to a person when needed.'],
  ['Chat and text assistants', 'Reply on websites and by text, collect the details, and alert the team.'],
  ['Customer automation', 'Summaries, follow-up texts, emails and records after every conversation.'],
  ['Operations software', 'Dispatch, delivery and admin tools that a business runs on daily.'],
];
function icon(T, x, y, k, R) {
  // a 4x4 block of dots that shimmers, a different pattern per item
  const pats = ['0110100110010110', '1111100110011111', '0100111001001110', '1010010110100101'];
  let s = '';
  pats[k].split('').forEach((b, n) => {
    const cx = x + (n % 4) * 7 + 3.5, cy = y + Math.floor(n / 4) * 7 + 3.5;
    s += b === '1'
      ? `<circle class="tw" style="animation-duration:${(1.2 + R() * 1.8).toFixed(2)}s;animation-delay:${(-R() * 3).toFixed(2)}s;--min:.35" cx="${cx}" cy="${cy}" r="2.9" fill="${[T.accent, T.green, T.amber, T.red][k]}"/>`
      : `<circle cx="${cx}" cy="${cy}" r="2.9" fill="${T.panelDot}"/>`;
  });
  return s;
}
function about(T, mobile) {
  const W = mobile ? 480 : 1000, x = mobile ? 20 : 40, R = rng(3);
  const ls = mobile ? 17 : 15, ts = mobile ? 50 : 56, bs = mobile ? 21.5 : 18.5, bl = bs * 1.58;
  let y = 30, s = '';
  s += label(T, 'ABOUT', x, y + ls, ls); y += ls + 14;
  for (let k = 0; k < 10; k++) s += `<circle class="tw" style="animation-duration:1.4s;animation-delay:${-k * .14}s;--min:.25" cx="${x + 3 + k * 9}" cy="${y}" r="2.9" fill="${T.accent}"/>`;
  y += ts * .95;
  const tl = wrap(F.pixel, ABOUT_TITLE, ts, mobile ? W - 2 * x : 860);
  tl.forEach((l, k) => { s += P(outline(F.pixel, l, x - 2, y + k * ts * .86, ts), T.ink); });
  y += (tl.length - 1) * ts * .86 + bs * 2.4;
  const colW = mobile ? W - 2 * x : 520;
  let yl = y;
  ABOUT.forEach((t) => { const p = para(F.body, t, x, yl, bs, bl, colW, T.ink2); s += p.svg; yl += p.h + bl * 1.6; });
  let yr = mobile ? yl + 6 : y - bs * .8;
  const rx = mobile ? x : 620, rw = mobile ? W - 2 * x - 48 : 340;
  FOCUS.forEach(([h, d], k) => {
    s += icon(T, rx, yr - 4, k, R);
    s += P(outline(F.label, h, rx + 46, yr + 12, mobile ? 19 : 16.5, { track: .02 }), T.ink);
    const p = para(F.body, d, rx + 46, yr + 12 + (mobile ? 27 : 24), mobile ? 18.5 : 15.5, mobile ? 26 : 22.5, rw, T.muted);
    s += p.svg; yr += p.h + (mobile ? 76 : 66);
  });
  const H = Math.ceil(Math.max(yl - bl * 1.6, yr - 40) + (mobile ? 20 : 30));
  return svgDoc(W, H, `About. ${ABOUT_TITLE} ${ABOUT.join(' ')} ${FOCUS.map(([a, b]) => `${a}: ${b}`).join(' ')}`,
    `<rect width="${W}" height="${H}" fill="${T.page}"/><g class="rise">${s}</g>`);
}

// ---------------------------------------------------------------- how it works (a live flow)
const STEPS = [
  ['The customer', 'calls, writes on the website, or sends a text.'],
  ['The AI agent', "understands, answers from the business's own information, and collects the details."],
  ['The systems', 'create and save the order, booking or request.'],
  ['The team', 'gets a short summary by text and email, and follows up.'],
];
function process_(T, mobile) {
  const W = mobile ? 480 : 1000, x = mobile ? 20 : 40, R = rng(9);
  const ls = mobile ? 17 : 15, ts = mobile ? 50 : 56;
  let y = 30, s = '';
  s += label(T, 'HOW IT WORKS', x, y + ls, ls); y += ls + 14;
  for (let k = 0; k < 10; k++) s += `<circle class="tw" style="animation-duration:1.4s;animation-delay:${-k * .14}s;--min:.25" cx="${x + 3 + k * 9}" cy="${y}" r="2.9" fill="${T.accent}"/>`;
  y += ts * .95;
  const tl = wrap(F.pixel, 'From a question to work done.', ts, W - 2 * x);
  tl.forEach((l, k) => { s += P(outline(F.pixel, l, x - 2, y + k * ts * .86, ts), T.ink); });
  y += (tl.length - 1) * ts * .86 + 34;
  // the strip of dots with four stations and light flowing between them
  const cols = mobile ? 63 : 131, rows = mobile ? 0 : 15;
  let strip = '', H;
  const colors = [T.accent, T.green, T.amber, T.red];
  if (!mobile) {
    const sw = cols * PITCH, sh = rows * PITCH, sx = (W - sw) / 2, sy = y;
    let defs = dotMask('fm', sw, sh, { pitch: PITCH, seed: 4 });
    const st = [10, 46, 84, 120];
    let inner = `<rect width="${sw}" height="${sh}" fill="${T.panelDot}"/>`;
    for (let k = 0; k < 3; k++) inner += flowC([[st[k] + 5, 7], [st[k + 1] - 5, 7]], colors[k + 1]);
    st.forEach((c, k) => { inner += boxC(c - 4, 3, c + 4, 11, colors[k]) + `<g class="breathe" style="animation-delay:${-k * .7}s">${rectC(c - 2, 5, c + 2, 9, colors[k])}</g>`; });
    inner += `<g class="psweep"><rect x="0" y="-${sh}" width="120" height="${sh * 3}" fill="${T.panelDot2}" opacity=".6" transform="rotate(14)"/></g>`;
    strip = `<g transform="translate(${sx} ${sy})"><defs>${defs}</defs><rect width="${sw}" height="${sh}" fill="${T.panel}"/><g mask="url(#fm)">${inner}</g></g>`;
    y += sh + 40;
    st.forEach((c, k) => {
      const cx = sx + (c + .5) * PITCH;
      s += label(T, `0${k + 1}`, cx, y, 14, colors[k], 'middle');
      s += P(outline(F.label, STEPS[k][0], cx, y + 26, 17, { anchor: 'middle', track: .02 }), T.ink);
      const lines = wrap(F.body, STEPS[k][1], 15.5, 200);
      lines.forEach((l, n) => { s += P(outline(F.body, l, cx, y + 52 + n * 22, 15.5, { anchor: 'middle' }), T.muted); });
    });
    y += 52 + 3 * 22 + 30;
    s += P(outline(F.bodyM, 'The agent handles the conversation, the systems keep the record, and people stay in control.', W / 2, y, 17, { anchor: 'middle' }), T.ink2);
    H = Math.ceil(y + 34);
  } else {
    const sw = 9 * PITCH, sh = 4 * 18 * PITCH - 8 * PITCH;
    const sx = x, sy = y;
    let defs = dotMask('fm', sw, sh, { pitch: PITCH, seed: 4 });
    let inner = `<rect width="${sw}" height="${sh}" fill="${T.panelDot}"/>`;
    const st = [4, 22, 40, 58];
    for (let k = 0; k < 3; k++) inner += flowC([[4, st[k] + 5], [4, st[k + 1] - 5]], colors[k + 1]);
    st.forEach((c, k) => { inner += boxC(0, c - 4, 8, c + 4, colors[k]) + `<g class="breathe" style="animation-delay:${-k * .7}s">${rectC(2, c - 2, 6, c + 2, colors[k])}</g>`; });
    strip = `<g transform="translate(${sx} ${sy})"><defs>${defs}</defs><rect width="${sw}" height="${sh}" fill="${T.panel}"/><g mask="url(#fm)">${inner}</g></g>`;
    st.forEach((c, k) => {
      const ty = sy + (c + .5) * PITCH, tx = sx + sw + 22;
      s += label(T, `0${k + 1}`, tx, ty - 22, 15, colors[k]);
      s += P(outline(F.label, STEPS[k][0], tx, ty + 2, 20, { track: .02 }), T.ink);
      const p = para(F.body, STEPS[k][1], tx, ty + 28, 18, 25, W - tx - 20, T.muted); s += p.svg;
    });
    y = sy + sh + 40;
    const p = para(F.bodyM, 'The agent handles the conversation, the systems keep the record, and people stay in control.', x, y, 19.5, 28, W - 2 * x, T.ink2);
    s += p.svg; H = Math.ceil(y + p.h + 30);
  }
  void R;
  return svgDoc(W, H, `How it works. From a question to work done. ${STEPS.map(([a, b], k) => `${k + 1}. ${a} ${b}`).join(' ')} The agent handles the conversation, the systems keep the record, and people stay in control.`,
    `<rect width="${W}" height="${H}" fill="${T.page}"/>${strip}<g class="rise">${s}</g>`, SHARED_CSS + PANEL_CSS);
}

// ---------------------------------------------------------------- toolbox + now
const NOW = ['Building faster, more natural AI phone agents.', 'Automating the day-to-day work of small businesses.', 'BS Computer Science, ARID University, Lahore. CGPA 3.83 / 4.'];
const STACK = [
  ['AI and voice', ['OpenAI', 'Claude', 'Gemini', 'Realtime voice', 'Twilio', 'Deepgram', 'ElevenLabs', 'Tool calling', 'Prompt design']],
  ['Engineering', ['TypeScript', 'JavaScript', 'Node.js', 'NestJS', 'React', 'Next.js', 'React Native', 'Laravel', 'PHP', 'Swift', 'C++']],
  ['Data and infrastructure', ['PostgreSQL', 'Supabase', 'Firebase', 'SQLite', 'Linux', 'Nginx', 'Webhooks', 'Scheduled jobs', 'Git']],
];
function toolbox(T, mobile) {
  const W = mobile ? 480 : 1000, x = mobile ? 20 : 40;
  const ls = mobile ? 17 : 15, ts = mobile ? 50 : 56;
  let y = 30, s = '';
  s += label(T, 'NOW', x, y + ls, ls); y += ls + 14;
  for (let k = 0; k < 10; k++) s += `<circle class="tw" style="animation-duration:1.4s;animation-delay:${-k * .14}s;--min:.25" cx="${x + 3 + k * 9}" cy="${y}" r="2.9" fill="${T.accent}"/>`;
  y += ts * .95;
  s += P(outline(F.pixel, 'Currently', x - 2, y, ts), T.ink); y += mobile ? 44 : 46;
  NOW.forEach((t, k) => {
    s += label(T, `0${k + 1}`, x, y, mobile ? 16 : 14, T.accent);
    const p = para(F.bodyM, t, x + (mobile ? 40 : 36), y, mobile ? 20 : 18, mobile ? 28 : 26, W - 2 * x - 40, T.ink); s += p.svg; y += p.h + (mobile ? 40 : 36);
  });
  y += 24;
  s += P(outline(F.pixel, 'Toolbox', x - 2, y + 20, ts), T.ink); y += mobile ? 70 : 72;
  const colW = mobile ? W - 2 * x : (W - 2 * x - 60) / 3;
  let maxY = y;
  STACK.forEach(([h, items], k) => {
    const cx = mobile ? x : x + k * (colW + 30), cy0 = mobile ? maxY : y;
    let cy = cy0;
    s += label(T, h.toUpperCase(), cx, cy, mobile ? 16 : 14, [T.accent, T.green, T.amber][k]);
    // a dotted rule under each column heading
    for (let n = 0; n < Math.floor(colW / 9); n++) s += `<circle cx="${cx + 3 + n * 9}" cy="${cy + 14}" r="2.4" fill="${T.panelDot}"/>`;
    cy += 44;
    const text = items.join('  /  ');
    const p = para(F.body, text, cx, cy, mobile ? 19 : 16.5, mobile ? 28 : 26, colW, T.ink2); s += p.svg; cy += p.h;
    maxY = Math.max(maxY, cy + (mobile ? 50 : 0));
  });
  const H = Math.ceil(maxY + (mobile ? 0 : 36));
  return svgDoc(W, H, `Currently: ${NOW.join(' ')} Toolbox. ${STACK.map(([h, i]) => `${h}: ${i.join(', ')}.`).join(' ')}`,
    `<rect width="${W}" height="${H}" fill="${T.page}"/><g class="rise">${s}</g>`);
}

// ---------------------------------------------------------------- contact: a small living landscape
function contact(T, mobile) {
  const W = mobile ? 480 : 1000, H = mobile ? 470 : 400, R = rng(14);
  let defs = dotMask('cm', W, H, { pitch: PITCH, seed: 8 });
  defs += `<linearGradient id="csky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.page}"/>${T.sky.map((c, i) => `<stop offset="${(.18 + i * .2).toFixed(2)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  defs += `<linearGradient id="cbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.page}"/><stop offset=".25" stop-color="${T.skyGap}"/></linearGradient>`;
  defs += `<linearGradient id="cmd" x1="0" y1="0" x2="0" y2="1">${T.meadow.map((c, i) => `<stop offset="${(i / 2).toFixed(2)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  defs += `<linearGradient id="csw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="${T.name === 'day' ? '#FFFFFF' : '#B9C8FF'}" stop-opacity="${T.name === 'day' ? .45 : .3}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
  const ridge = (base, amp, f, ph) => { let d = `M-10 ${H}`; for (let xx = -10; xx <= W + 10; xx += 8) d += `L${xx} ${(base - amp * Math.sin(xx / W * Math.PI * f + ph)).toFixed(1)}`; return d + `L${W + 10} ${H}Z`; };
  let sc = `<rect width="${W}" height="${H}" fill="url(#csky)"/>`;
  sc += `<g class="sweep2"><rect x="0" y="-${H}" width="200" height="${H * 3}" fill="url(#csw)" transform="rotate(16)"/></g>`;
  sc += `<path fill="${T.hillFar}" d="${ridge(H - 120, 18, 2.3, .4)}"/><path fill="${T.hillMid}" d="${ridge(H - 92, 14, 1.7, 2)}"/>`;
  sc += `<path fill="url(#cmd)" d="${ridge(H - 62, 5, 3, 1)}"/>`;
  let body = `<defs>${defs}</defs><rect width="${W}" height="${H}" fill="url(#cbg)"/><g mask="url(#cm)">${sc}</g>`;
  const pts = [], cols = Math.floor(W / PITCH);
  for (let n = 0; n < (mobile ? 60 : 110); n++) { const i = Math.floor(R() * cols), j = Math.floor((H - 52) / PITCH) + Math.floor(R() * 6); pts.push([g(i), g(j), T.flowers[Math.floor(R() * T.flowers.length)]]); }
  if (T.name === 'night') for (let n = 0; n < (mobile ? 30 : 60); n++) pts.push([g(Math.floor(R() * cols)), g(12 + Math.floor(R() * ((H - 170) / PITCH - 12))), '#FFFFFF']);
  body += twinkles(pts, R, { r: 2.95, min: .15 });
  // words
  const x = mobile ? 20 : 40, ls = mobile ? 17 : 15;
  let t = label(T, 'CONTACT', x, 30 + ls, ls);
  const ts = mobile ? 58 : 72, halo = T.name === 'day' ? '#F7FAFF' : '#070B1C';
  const hl = wrap(F.pixel, "Let's build something.", ts, W - 2 * x);
  hl.forEach((l, k) => { t += P(outline(F.pixel, l, x - 2, 30 + ls + 22 + ts * .78 + k * ts * .86, ts), T.ink, ` stroke="${halo}" stroke-width="8" stroke-linejoin="round" paint-order="stroke"`); });
  let yy = 30 + ls + 22 + ts * .78 + (hl.length - 1) * ts * .86 + (mobile ? 44 : 46);
  const es = mobile ? 22 : 24;
  t += P(outline(F.bodyM, EMAIL, x, yy, es), T.ink, ` stroke="${halo}" stroke-width="6" stroke-linejoin="round" paint-order="stroke"`);
  const ew = measure(F.bodyM, EMAIL, es);
  t += `<rect x="${x}" y="${yy + 8}" width="${ew}" height="2.4" fill="${T.ink}"/>`;
  yy += mobile ? 36 : 38;
  t += P(outline(F.label, 'Lahore, Pakistan  /  Open to remote work', x, yy, mobile ? 16 : 15.5, { track: .03 }), T.ink2, ` stroke="${halo}" stroke-width="5" stroke-linejoin="round" paint-order="stroke"`);
  body += `<g class="rise">${t}</g>`;
  return svgDoc(W, H, `Contact. Let's build something. Email ${EMAIL}. Lahore, Pakistan. Open to remote work.`, body,
    `.sweep2 { animation: sweep2 13s linear infinite; } @keyframes sweep2 { from { transform: translateX(-380px); } to { transform: translateX(${W + 200}px); } }`);
}

// ---------------------------------------------------------------- pixel buttons
function button(T, text, primary) {
  const fs = 17, padX = 22, h = 46, sh = 5;
  const tw = measure(F.label, text, fs, .03), w = Math.ceil(tw + padX * 2 + 22);
  const W = w + sh + 2, H = h + sh + 2;
  const bg = primary ? T.btn : T.btn2, fg = primary ? T.btnText : T.btn2Text;
  let s = `<rect x="${sh + 1}" y="${sh + 1}" width="${w}" height="${h}" fill="${T.btnShadow}"/>`;
  s += `<rect x="1" y="1" width="${w}" height="${h}" fill="${bg}" stroke="${T.ink}" stroke-width="2"/>`;
  // pixel notches on the corners
  [[1, 1], [w - 3, 1], [1, h - 3], [w - 3, h - 3]].forEach(([x, y]) => { s += `<rect x="${x}" y="${y}" width="4" height="4" fill="${T.page}"/>`; });
  s += P(outline(F.label, text, 1 + padX, 1 + h / 2 + fs * .36, fs, { track: .03 }), fg);
  s += arrow(1 + padX + tw + 9, 1 + h / 2 - 6, 11, fg, 2);
  return svgDoc(W, H, text, s);
}

// ---------------------------------------------------------------- build everything
if (require.main === module) for (const T of Object.values(THEMES)) {
  const dir = `assets/${T.name}`;
  out(`${dir}/btn-email.svg`, button(T, 'Email me', true));
  out(`${dir}/btn-repos.svg`, button(T, 'My repositories', false));
  for (const mobile of [false, true]) {
    const d = mobile ? `${dir}/m` : dir;
    out(`${d}/about.svg`, about(T, mobile));
    out(`${d}/work.svg`, header(T, 'Work', 'Selected work', 'Five things I designed and built, from AI agents in production to my own Mac app.', mobile));
    PROJECTS.forEach((p, k) => out(`${d}/${p.key}.svg`, card(T, p, k, mobile)));
    out(`${d}/process.svg`, process_(T, mobile));
    out(`${d}/toolbox.svg`, toolbox(T, mobile));
    out(`${d}/contact.svg`, contact(T, mobile));
  }
}
module.exports = { PROJECTS };
