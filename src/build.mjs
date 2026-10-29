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

let settings = { wa: '', address: '', hours: '' };
let liveWings = null;

// Pull the current menu and settings from Supabase, so the page ships with what the admin last saved.
// If Supabase can't be reached, fall back to src/menu.txt.
try {
  const box = { window: {} };
  vm.createContext(box);
  vm.runInContext(readFileSync(join(here, '..', 'config.js'), 'utf8'), box);
  const cfg = box.window.CAESAR_CONFIG || {};
  if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
    const api = async (path) => {
      const r = await fetch(`${cfg.supabaseUrl.replace(/\/$/, '')}/rest/v1/${path}`, { headers: { apikey: cfg.supabaseAnonKey, Authorization: `Bearer ${cfg.supabaseAnonKey}` }, signal: AbortSignal.timeout(15000) });
      if (!r.ok) throw new Error(`${path}: ${r.status}`);
      return r.json();
    };
    const [ws, cs, its, st] = await Promise.all([
      api('wings?select=key,name,line,sort&order=sort.asc,key.asc'),
      api('categories?select=id,wing_key,name,en,sort&order=sort.asc,id.asc'),
      api('items?select=id,category_id,name,description,prices,sort&active=eq.true&order=sort.asc,id.asc'),
      api('settings?select=whatsapp,address,hours&id=eq.1'),
    ]);
    if (st[0]) settings = { wa: st[0].whatsapp || '', address: st[0].address || '', hours: st[0].hours || '' };
    if (ws.length) {
      liveWings = ws.map((w) => ({
        key: w.key, name: w.name, line: w.line,
        cats: cs.filter((c) => c.wing_key === w.key).map((c) => ({
          id: c.id, name: c.name, en: c.en || '',
          items: its.filter((i) => i.category_id === c.id).map((i) => {
            const it = { id: i.id, n: i.name, p: i.prices };
            if (i.description) it.d = i.description;
            return it;
          }),
        })),
      }));
    }
    console.log('المنيو اتسحب من Supabase.');
  }
} catch (e) {
  console.warn('مقدرناش نوصل لـ Supabase، هنستخدم src/menu.txt:', e.message);
}
if (liveWings) wings.splice(0, wings.length, ...liveWings);

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
