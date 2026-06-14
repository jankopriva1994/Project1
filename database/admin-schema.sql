-- ============================================================
--  Chaties – Admin CMS rozšíření schématu
--  Spusť celý tento soubor v Supabase SQL Editoru
-- ============================================================

-- ────────────────────────────────────────────────────────────
--  ROZŠÍŘENÍ TABULKY PROFILES
-- ────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists is_admin boolean default false;

-- ────────────────────────────────────────────────────────────
--  TABULKA POSTS (Blog)
-- ────────────────────────────────────────────────────────────

create table if not exists public.posts (
  id           uuid default uuid_generate_v4() primary key,
  title        text not null,
  slug         text unique not null,
  excerpt      text,
  content      text,
  is_published boolean default false not null,
  published_at timestamptz,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);

-- ────────────────────────────────────────────────────────────
--  TABULKA CONTENT_BLOCKS (Textový CMS)
-- ────────────────────────────────────────────────────────────

create table if not exists public.content_blocks (
  id          uuid default uuid_generate_v4() primary key,
  key         text unique not null,
  value       text,
  description text,
  updated_at  timestamptz default now() not null
);

-- ────────────────────────────────────────────────────────────
--  TRIGGERY pro updated_at
-- ────────────────────────────────────────────────────────────

create trigger posts_updated_at
  before update on public.posts
  for each row execute procedure public.handle_updated_at();

create trigger content_blocks_updated_at
  before update on public.content_blocks
  for each row execute procedure public.handle_updated_at();

-- ────────────────────────────────────────────────────────────
--  ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

alter table public.posts          enable row level security;
alter table public.content_blocks enable row level security;

-- Posts – veřejné čtení publikovaných článků
create policy "public_read_published_posts"
  on public.posts for select
  using (is_published = true);

-- Posts – admin může vše
create policy "admin_all_posts"
  on public.posts for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Content blocks – přihlášení uživatelé mohou číst
create policy "auth_read_content_blocks"
  on public.content_blocks for select
  using (auth.role() = 'authenticated');

-- Content blocks – admin může vše
create policy "admin_all_content_blocks"
  on public.content_blocks for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Templates – admin může vše (INSERT, UPDATE, DELETE)
create policy "admin_insert_templates"
  on public.templates for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "admin_update_templates"
  on public.templates for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "admin_delete_templates"
  on public.templates for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Profiles – admin může číst vše
create policy "admin_read_all_profiles"
  on public.profiles for select
  using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p2
      where p2.id = auth.uid() and p2.is_admin = true
    )
  );

-- ────────────────────────────────────────────────────────────
--  VÝCHOZÍ DATA – Content blocks
-- ────────────────────────────────────────────────────────────

insert into public.content_blocks (key, value, description) values
(
  'homepage_hero_title',
  'AI nástroje pro váš marketing',
  'Hlavní nadpis na úvodní stránce (hero sekce)'
),
(
  'homepage_hero_subtitle',
  'Generujte texty, reklamy a obsah pomocí umělé inteligence. Ušetřete čas a peníze.',
  'Podnadpis na úvodní stránce (hero sekce)'
),
(
  'pricing_starter_desc',
  'Ideální pro jednotlivce a freelancery, kteří chtějí vyzkoušet sílu AI.',
  'Popis tarifu Starter na stránce ceník'
),
(
  'pricing_popular_desc',
  'Nejoblíbenější volba pro malé firmy a marketingové týmy.',
  'Popis tarifu Popular na stránce ceník'
),
(
  'pricing_pro_desc',
  'Pro profesionály a agentury, kteří potřebují maximum výkonu.',
  'Popis tarifu Pro na stránce ceník'
),
(
  'pricing_enterprise_desc',
  'Řešení na míru pro velké firmy s pokročilými požadavky.',
  'Popis tarifu Enterprise na stránce ceník'
)
on conflict (key) do nothing;
