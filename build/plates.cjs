// Screenshot galleries, one per project: the real screens in pixel-style browser / phone frames on a
// dotted panel. Rendered to JPEG with Playwright (day + night, desktop + phone).
// Output: assets/{day,night}/shots-<project>.jpg and assets/{day,night}/m/shots-<project>.jpg
// A gallery whose screenshots are not in site/shots/ yet is skipped. Run: node build/plates.cjs
const fs = require('fs');
const path = require('path');
const { chromium } = require('/Users/apple/steven/_local-run/backup-home/node_modules/playwright');
const { THEMES, root } = require('./lib.cjs');

const SHOTS = path.join(root, 'site', 'shots');
const font = (pkg, file) => `file://${path.join(root, 'node_modules/@fontsource', pkg, 'files', file)}`;

// x, y, w in desktop px (1000 wide). kind: 'web' (browser frame), 'mac' (window bar), 'plain' (no bar), 'phone', 'window' (a chat window)
const PLATES = [
  { key: 'ai-receptionist', caption: 'The owner dashboard (calls, one call, costs) and the website chat, all with sample data.', h: 846, items: [
    { kind: 'web', img: 'recep-01-calls.jpg', x: 36, y: 36, w: 660 },
    { kind: 'window', img: 'recep-chat.jpg', x: 724, y: 36, w: 240 },
    { kind: 'web', img: 'recep-02-call-detail.jpg', x: 36, y: 500, w: 452 },
    { kind: 'web', img: 'recep-05-costs.jpg', x: 512, y: 500, w: 452 },
  ] },
  { key: 'delivery-platform', caption: 'The dispatch web app and the mobile app (driver and admin screens), with sample data.', h: 846, items: [
    { kind: 'web', img: 'deliv-01-dispatch.jpg', x: 36, y: 36, w: 560 },
    { kind: 'web', img: 'deliv-02-order-detail.jpg', x: 36, y: 432, w: 560 },
    { kind: 'phone', img: 'delivm-01-driver-deliveries.jpg', x: 622, y: 36, w: 164 },
    { kind: 'phone', img: 'delivm-03-admin-dashboard.jpg', x: 800, y: 36, w: 164 },
    { kind: 'phone', img: 'delivm-02-delivery-detail.jpg', x: 622, y: 432, w: 164 },
    { kind: 'phone', img: 'delivm-04-admin-orders.jpg', x: 800, y: 432, w: 164 },
  ] },
  { key: 'sulehri', caption: 'Sulehri teaching binary search on a sample lesson page: marks and a sketch drawn on the screen, and the lesson board.', h: 782, items: [
    { kind: 'plain', img: 'sulehri-01-pencil.jpg', x: 36, y: 36, w: 928 },
    { kind: 'mac', img: 'sulehri-03-board.jpg', x: 494, y: 422, w: 470 },
  ] },
  { key: 'solarkon', caption: 'The SolarKon website on desktop and phone, and the admin panel.', h: 820, items: [
    { kind: 'web', img: 'solarkon-01-home.jpg', x: 36, y: 36, w: 700 },
    { kind: 'phone', img: 'solarkon-09-phone-home.jpg', x: 764, y: 36, w: 200 },
    { kind: 'web', img: 'solarkon-12-admin.jpg', x: 36, y: 520, w: 452 },
    { kind: 'web', img: 'solarkon-04-projects.jpg', x: 512, y: 520, w: 452 },
  ] },
  { key: 'telemetry-pro', caption: 'The telemetry dashboard, with demo data.', h: 682, items: [
    { kind: 'web', img: 'telemetry.jpg', x: 36, y: 36, w: 928 },
  ] },
];

function css(T) {
  const night = T.name === 'night';
  return `
@font-face { font-family: Pix; src: url(${font('pixelify-sans', 'pixelify-sans-latin-600-normal.woff2')}); }
@font-face { font-family: Geist; src: url(${font('geist-sans', 'geist-sans-latin-400-normal.woff2')}); }
* { box-sizing: border-box; margin: 0; }
body { background: ${T.page}; }
.plate { position: relative; background: ${T.page}; }
.panel { position: relative; background-color: ${T.panel};
  background-image: radial-gradient(circle at 3.5px 3.5px, ${T.panelDot} 2.6px, transparent 3px); background-size: 7px 7px; }
.f { position: absolute; border: 2px solid ${night ? '#4A5682' : T.ink}; background: ${night ? '#0B101C' : '#fff'};
  box-shadow: 8px 8px 0 ${night ? '#05070D' : T.panelDot2}; }
.f img { display: block; width: 100%; height: auto; }
.web .bar { height: 24px; display: flex; gap: 6px; align-items: center; padding: 0 9px; border-bottom: 2px solid ${night ? '#4A5682' : T.ink};
  background: ${night ? '#1A2236' : '#FFFFFF'}; }
.web .bar i, .mac .bar i { width: 8px; height: 8px; display: block; }
.mac .bar { height: 20px; display: flex; gap: 6px; align-items: center; padding: 0 8px; background: ${night ? '#1A2236' : '#E9EDF7'}; border-bottom: 2px solid ${night ? '#4A5682' : T.ink}; }
.phone { border-radius: 26px; padding: 7px; background: ${night ? '#05070D' : T.ink}; }
.phone img { border-radius: 19px; }
.window { border-radius: 14px; overflow: hidden; }
.cap { display: flex; gap: 12px; align-items: baseline; padding: 16px 2px 4px; }
.cap b { font: 600 12px/1 Pix; letter-spacing: .08em; color: ${T.accent}; }
.cap span { font: 400 15px/1.4 Geist; color: ${T.muted}; }
`;
}
const dots = '<i style="background:#E2473B"></i><i style="background:#F2A81D"></i><i style="background:#0E9F6E"></i>';
function frame(it, style) {
  const src = `file://${path.join(SHOTS, it.img)}`;
  if (it.kind === 'web') return `<div class="f web" style="${style}"><div class="bar">${dots}</div><img src="${src}"></div>`;
  if (it.kind === 'mac') return `<div class="f mac" style="${style}"><div class="bar">${dots}</div><img src="${src}"></div>`;
  return `<div class="f ${it.kind}" style="${style}"><img src="${src}"></div>`;
}
function html(T, p, mobile) {
  let inner, W, H;
  if (!mobile) {
    W = 1000; H = p.h;
    inner = p.items.map((it) => frame(it, `left:${it.x}px;top:${it.y}px;width:${it.w}px`)).join('');
  } else {
    // phones: browsers and Mac screens stacked full width, phones and windows two per row
    W = 480; let y = 22; inner = '';
    const isBig = (it) => ['web', 'mac', 'plain'].includes(it.kind);
    const big = p.items.filter(isBig), small = p.items.filter((it) => !isBig(it));
    big.forEach((it) => { inner += frame(it, `left:20px;top:${y}px;width:432px`); y += it.h_m + 30; });
    for (let k = 0; k < small.length; k += 2) {
      const row = small.slice(k, k + 2);
      const w = row.length === 1 && row[0].kind === 'window' ? 300 : 206;
      let rowH = 0;
      row.forEach((it, n) => { const x = row.length === 1 ? (W - w) / 2 - 4 : 20 + n * (w + 20); inner += frame(it, `left:${x}px;top:${y}px;width:${w}px`); rowH = Math.max(rowH, it.ar * w + 18); });
      y += rowH + 26;
    }
    H = y;
  }
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css(T)}</style></head><body>
<div class="plate" id="plate" style="width:${W}px"><div class="panel" style="width:${W}px;height:${H}px">${inner}</div>
<div class="cap" style="padding-left:${mobile ? 20 : 36}px;padding-right:${mobile ? 20 : 36}px"><b>SHOWN</b><span>${p.caption}</span></div></div></body></html>`;
}

(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const tmp = path.join(root, 'build', '.plate.html');
  for (const p of PLATES) {
    const missing = p.items.filter((it) => !fs.existsSync(path.join(SHOTS, it.img)));
    if (missing.length) { console.log(`skip ${p.key} (missing ${missing.map((m) => m.img).join(', ')})`); continue; }
    // natural sizes, for the phone layout
    const pg = await b.newPage();
    for (const it of p.items) {
      await pg.goto(`file://${path.join(SHOTS, it.img)}`);
      const [nw, nh] = await pg.evaluate(() => [document.images[0].naturalWidth, document.images[0].naturalHeight]);
      it.ar = nh / nw; it.h_m = 432 * it.ar + (it.kind === 'web' ? 26 : it.kind === 'mac' ? 22 : 0);
    }
    await pg.close();
    for (const T of Object.values(THEMES)) {
      for (const mobile of [false, true]) {
        fs.writeFileSync(tmp, html(T, p, mobile));
        const page = await b.newPage({ viewport: { width: mobile ? 480 : 1000, height: 900 }, deviceScaleFactor: mobile ? 2.5 : 2 });
        await page.route('**/*', (r) => (r.request().url().startsWith('file://') ? r.continue() : r.abort()));
        await page.goto(`file://${tmp}`); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(150);
        const rel = `assets/${T.name}/${mobile ? 'm/' : ''}shots-${p.key}.jpg`;
        await page.locator('#plate').screenshot({ path: path.join(root, rel), type: 'jpeg', quality: 86 });
        console.log(rel.padEnd(42), Math.round(fs.statSync(path.join(root, rel)).size / 1024) + ' KB');
        await page.close();
      }
    }
  }
  fs.rmSync(tmp, { force: true });
  await b.close();
})();
