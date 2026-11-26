// Writes README.md from the built pictures. Every picture has four versions: light or dark GitHub
// theme, desktop or phone width. A project's screenshot gallery is included only once it exists.
const fs = require('fs');
const path = require('path');
const { root } = require('./lib.cjs');
const { PROJECTS } = require('./sections.cjs');

const RAW = 'https://raw.githubusercontent.com/sheraz7355/sheraz7355/main/';
const EMAIL = 'muhammadsheraz7355@gmail.com';
// WolfDrivers has no link on purpose (it was removed by hand on GitHub on 23 Nov 2026).
const LINKS = {
  sulehri: 'https://github.com/sheraz7355/Sulehri',
  solarkon: 'http://solarkon.org',
  'telemetry-pro': 'https://github.com/sheraz7355/TELEMETRY-PRO',
};
const exists = (rel) => fs.existsSync(path.join(root, rel));
/** The accessible name of a picture = its SVG title (kept in one place, the build scripts). */
function altOf(file, fallback) {
  if (!file.endsWith('.svg')) return fallback;
  const m = fs.readFileSync(path.join(root, 'assets/day', file), 'utf8').match(/aria-label="([^"]*)"/);
  return m ? m[1].replace(/&quot;/g, "'") : fallback;
}
function picture(file, { alt, width = '100%', phone = true } = {}) {
  const a = (alt || altOf(file, file)).replace(/"/g, '&quot;');
  const src = [];
  if (phone) {
    src.push(`  <source media="(max-width: 600px) and (prefers-color-scheme: dark)" srcset="${RAW}assets/night/m/${file}">`);
    src.push(`  <source media="(max-width: 600px)" srcset="${RAW}assets/day/m/${file}">`);
  }
  src.push(`  <source media="(prefers-color-scheme: dark)" srcset="${RAW}assets/night/${file}">`);
  return `<picture>\n${src.join('\n')}\n  <img src="assets/day/${file}"${width ? ` width="${width}"` : ''} alt="${a}">\n</picture>`;
}
const block = (inner, href) => `<p>\n${href ? `<a href="${href}">\n${inner}\n</a>` : inner}\n</p>`;

const parts = [
  '<!--\n  Built by `npm run build` from build/*.cjs. Every picture comes in four versions (light/dark theme, desktop/phone).\n  The moving dots are CSS animations inside the SVGs; screenshots are in site/shots/ (sample data only).\n-->',
  block(picture('hero.svg')),
  `<p align="center">\n<a href="mailto:${EMAIL}">${picture('btn-email.svg', { alt: 'Email me', width: '', phone: false }).replace(/\n/g, '')}</a>&nbsp;&nbsp;\n<a href="https://github.com/sheraz7355?tab=repositories">${picture('btn-repos.svg', { alt: 'My repositories', width: '', phone: false }).replace(/\n/g, '')}</a>\n</p>`,
  block(picture('about.svg')),
  block(picture('work.svg')),
];
for (const p of PROJECTS) {
  parts.push(block(picture(`${p.key}.svg`), LINKS[p.key]));
  const shots = `shots-${p.key}.jpg`;
  if (exists(`assets/day/${shots}`)) {
    const cap = { 'always-answer': 'Always Answer screenshots: the owner dashboard (calls list, one call, costs) and the website chat, with sample data.',
      wolfdrivers: 'WolfDrivers screenshots: the dispatch web app and the mobile app, driver and admin screens, with sample data.',
      sulehri: 'Sulehri screenshots: marks and a sketch drawn on the screen during a binary search lesson, and the lesson board.',
      solarkon: 'SolarKon screenshots: the website on desktop and phone, and the admin panel.',
      'telemetry-pro': 'Telemetry Pro screenshot: the telemetry dashboard with demo data.' }[p.key];
    parts.push(block(picture(shots, { alt: cap }), LINKS[p.key]));
  }
}
parts.push(block(picture('process.svg')));
parts.push(block(picture('toolbox.svg')));
parts.push(block(picture('contact.svg'), `mailto:${EMAIL}`));
parts.push(`<p align="center"><sub><a href="mailto:${EMAIL}">${EMAIL}</a> &nbsp;·&nbsp; Lahore, Pakistan</sub></p>`);

fs.writeFileSync(path.join(root, 'README.md'), parts.join('\n\n') + '\n');
console.log('README.md', parts.length, 'blocks');
