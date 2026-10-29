// يبني index.html من المنيو والإعدادات: node src/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const wings = [];
let wing = null, cat = null, n = 0;
for (const raw of readFileSync(join(here, 'menu.txt'), 'utf8').split('\n')) {
  const line = raw.trim();
  if (!line) continue;
  if (line.startsWith('@')) {
    const [key, name, l2] = line.slice(1).split('|').map((s) => s.trim());
    wing = { key, name, line: l2, cats: [] };
    wings.push(wing);
  } else if (line.startsWith('#')) {
    const [name, en] = line.slice(1).split('|').map((s) => s.trim());
    cat = { id: name === 'الفطار' ? 'cat-breakfast' : `cat-${wing.key}-${wing.cats.length + 1}`, name, en: en || '', items: [] };
    wing.cats.push(cat);
  } else {
    const [name, desc, prices] = line.split('|');
    n += 1;
    const it = { id: 'i' + n, n: name.trim(), p: prices.trim().split('/').map(Number) };
    if ((desc || '').trim()) it.d = desc.trim();
    cat.items.push(it);
  }
}

const s = {};
const local = String(s.wa || '').replace(/[^\d]/g, '').replace(/^20(?=1)/, '0');
const settings = { wa: local ? '20' + local.slice(1) : '', address: s.address || '', hours: s.hours || '' };

const logo = 'data:image/jpeg;base64,' + readFileSync(join(here, 'logo.jpg')).toString('base64');
const data = { rev: 0, settings, logo, wings };
const css = readFileSync(join(here, 'app.css'), 'utf8').trim();
const js = readFileSync(join(here, 'app.js'), 'utf8').trim();
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(js, sandbox);
const R = sandbox.CaesarRender;

const html = R.documentHTML(data, css, js)
  .replace('<html>', '<html lang="ar" dir="rtl">')
  .replace('<meta charset=utf8>', '<meta charset="utf-8">');
writeFileSync(join(here, '..', 'index.html'), html);
const t = R.totals(data);
console.log(`index.html: ${t.cats} قسم، ${t.items} صنف`);
