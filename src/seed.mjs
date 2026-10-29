// يكتب supabase/seed.sql من src/menu.txt: node src/seed.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const wings = [], cats = [], items = [];
let wing = null, cat = null, n = 0;
for (const raw of readFileSync(join(here, 'menu.txt'), 'utf8').split('\n')) {
  const line = raw.trim();
  if (!line) continue;
  if (line.startsWith('@')) {
    const [key, name, l2] = line.slice(1).split('|').map((s) => s.trim());
    wing = { key, name, line: l2, sort: wings.length + 1, count: 0 };
    wings.push(wing);
  } else if (line.startsWith('#')) {
    const [name, en] = line.slice(1).split('|').map((s) => s.trim());
    wing.count += 1;
    cat = { id: name === 'الفطار' ? 'cat-breakfast' : `cat-${wing.key}-${wing.count}`, wing: wing.key, name, en: en || '', sort: wing.count, count: 0 };
    cats.push(cat);
  } else {
    const [name, desc, prices] = line.split('|');
    n += 1; cat.count += 1;
    items.push({ id: 'i' + n, cat: cat.id, name: name.trim(), desc: (desc || '').trim(), prices: prices.trim().split('/').map(Number), sort: cat.count });
  }
}
const sql = [
  '-- المنيو الحالي لسيزر. شغّله بعد schema.sql مرة واحدة.',
  'begin;',
  `insert into public.wings (key, name, line, sort) values\n${wings.map((w) => `  (${q(w.key)}, ${q(w.name)}, ${q(w.line)}, ${w.sort})`).join(',\n')}\non conflict (key) do nothing;`,
  `insert into public.categories (id, wing_key, name, en, sort) values\n${cats.map((c) => `  (${q(c.id)}, ${q(c.wing)}, ${q(c.name)}, ${q(c.en)}, ${c.sort})`).join(',\n')}\non conflict (id) do nothing;`,
  `insert into public.items (id, category_id, name, description, prices, sort) values\n${items.map((i) => `  (${q(i.id)}, ${q(i.cat)}, ${q(i.name)}, ${q(i.desc)}, '{${i.prices.join(',')}}', ${i.sort})`).join(',\n')}\non conflict (id) do nothing;`,
  'commit;',
  '',
].join('\n\n');
writeFileSync(join(here, '..', 'supabase', 'seed.sql'), sql);
console.log(`seed.sql: ${wings.length} أجنحة، ${cats.length} قسم، ${items.length} صنف`);
