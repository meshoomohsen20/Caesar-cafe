-- موقع سيزر: الجداول والصلاحيات
-- شغّل الملف ده مرة واحدة في Supabase: SQL Editor > New query > Run
-- وبعده شغّل seed.sql عشان المنيو الحالي يتنقل.


create table if not exists public.wings (
  key text primary key,
  name text not null,
  line text not null default '',
  sort int not null default 0
);

create table if not exists public.categories (
  id text primary key default ('cat-' || replace(gen_random_uuid()::text, '-', '')),
  wing_key text not null references public.wings(key) on update cascade,
  name text not null check (length(trim(name)) > 0),
  en text not null default '',
  sort int not null default 0
);

create table if not exists public.items (
  id text primary key default ('n' || replace(gen_random_uuid()::text, '-', '')),
  category_id text not null references public.categories(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  description text not null default '',
  prices int[] not null check (cardinality(prices) between 1 and 3 and 0 < all(prices)),
  sort int not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
create index if not exists items_category_sort on public.items (category_id, sort);

create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  whatsapp text not null default '' check (whatsapp = '' or whatsapp ~ '^201[0125][0-9]{8}$'),
  address text not null default '',
  hours text not null default '',
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- مين يقدر يدخل لوحة التحكم
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists items_touch on public.items;
create trigger items_touch before update on public.items for each row execute function public.touch_updated_at();
drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings for each row execute function public.touch_updated_at();

-- الصلاحيات: أي حد يقرا المنيو، والأدمن بس يعدّل
alter table public.wings enable row level security;
alter table public.categories enable row level security;
alter table public.items enable row level security;
alter table public.settings enable row level security;
alter table public.admins enable row level security;

drop policy if exists "wings read" on public.wings;
create policy "wings read" on public.wings for select to anon, authenticated using (true);
drop policy if exists "wings admin" on public.wings;
create policy "wings admin" on public.wings for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "categories read" on public.categories;
create policy "categories read" on public.categories for select to anon, authenticated using (true);
drop policy if exists "categories admin" on public.categories;
create policy "categories admin" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "items read" on public.items;
create policy "items read" on public.items for select to anon, authenticated using (active or public.is_admin());
drop policy if exists "items admin" on public.items;
create policy "items admin" on public.items for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "settings read" on public.settings;
create policy "settings read" on public.settings for select to anon, authenticated using (true);
drop policy if exists "settings admin" on public.settings;
create policy "settings admin" on public.settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins self" on public.admins;
create policy "admins self" on public.admins for select to authenticated using (user_id = auth.uid());

grant select on public.wings, public.categories, public.items, public.settings to anon, authenticated;
grant insert, update, delete on public.wings, public.categories, public.items to authenticated;
grant update on public.settings to authenticated;
grant select on public.admins to authenticated;

-- بعد ما تعمل حساب الأدمن من Authentication > Users، خليه أدمن بالسطر ده (غيّر الإيميل):
-- insert into public.admins (user_id) select id from auth.users where email = 'admin@example.com';
