-- ============================================================
--  Chaties – Supabase databázové schéma
--  Spusť celý tento soubor v Supabase SQL Editoru
-- ============================================================

-- UUID extension
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────────────────
--  TABULKY
-- ────────────────────────────────────────────────────────────

-- Profily uživatelů (rozšíření auth.users)
create table public.profiles (
  id                 uuid references auth.users(id) on delete cascade primary key,
  email              text unique not null,
  full_name          text default '',
  tokens_balance     integer default 0 not null,
  plan               text default 'free' not null,
  stripe_customer_id text unique,
  created_at         timestamptz default now() not null,
  updated_at         timestamptz default now() not null
);

-- Předplatná (Stripe)
create table public.subscriptions (
  id                       uuid default uuid_generate_v4() primary key,
  user_id                  uuid references public.profiles(id) on delete cascade not null,
  stripe_customer_id       text,
  stripe_subscription_id   text unique,
  stripe_price_id          text,
  plan_name                text not null,
  status                   text default 'active' not null,
  tokens_per_period        integer default 0,
  current_period_start     timestamptz,
  current_period_end       timestamptz,
  created_at               timestamptz default now() not null,
  updated_at               timestamptz default now() not null
);

-- Pohyby tokenů (přidání / spotřeba)
create table public.token_transactions (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  amount      integer not null,
  type        text not null check (type in ('purchase','usage','bonus','refund','subscription')),
  description text,
  created_at  timestamptz default now() not null
);

-- Šablony – CMS
create table public.templates (
  id          uuid default uuid_generate_v4() primary key,
  slug        text unique not null,
  name        text not null,
  description text,
  fields      jsonb default '[]'::jsonb,
  category    text,
  is_active   boolean default true,
  sort_order  integer default 0,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

-- Historie generování
create table public.history (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  type        text not null check (type in ('chat','template','translate','image','document')),
  title       text,
  content     text,
  tokens_used integer default 0,
  metadata    jsonb default '{}'::jsonb,
  created_at  timestamptz default now() not null
);

-- Tým – pozvánky členů
create table public.team_members (
  id           uuid default uuid_generate_v4() primary key,
  owner_id     uuid references public.profiles(id) on delete cascade not null,
  member_email text not null,
  member_id    uuid references public.profiles(id) on delete set null,
  status       text default 'pending' check (status in ('pending','active','removed')),
  amount_paid  numeric(10,2),
  invited_at   timestamptz default now() not null,
  accepted_at  timestamptz
);

-- ────────────────────────────────────────────────────────────
--  TRIGGERY
-- ────────────────────────────────────────────────────────────

-- Auto-vytvoření profilu při registraci
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-aktualizace updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.handle_updated_at();

-- ────────────────────────────────────────────────────────────
--  ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

alter table public.profiles          enable row level security;
alter table public.subscriptions     enable row level security;
alter table public.token_transactions enable row level security;
alter table public.templates         enable row level security;
alter table public.history           enable row level security;
alter table public.team_members      enable row level security;

-- Profiles
create policy "select_own_profile"  on public.profiles for select using (auth.uid() = id);
create policy "update_own_profile"  on public.profiles for update using (auth.uid() = id);

-- Subscriptions
create policy "select_own_sub" on public.subscriptions for select using (auth.uid() = user_id);

-- Token transactions
create policy "select_own_tx" on public.token_transactions for select using (auth.uid() = user_id);

-- Templates – čtení pro všechny přihlášené
create policy "select_active_templates" on public.templates for select using (is_active = true);

-- History
create policy "select_own_history" on public.history for select using (auth.uid() = user_id);
create policy "insert_own_history" on public.history for insert with check (auth.uid() = user_id);
create policy "delete_own_history" on public.history for delete using (auth.uid() = user_id);

-- Team
create policy "owner_sees_team"  on public.team_members for select using (auth.uid() = owner_id);
create policy "member_sees_self" on public.team_members for select using (auth.uid() = member_id);

-- ────────────────────────────────────────────────────────────
--  VÝCHOZÍ DATA – Šablony
-- ────────────────────────────────────────────────────────────

insert into public.templates (slug, name, description, fields, category, sort_order) values
(
  'marketing',
  'Marketingový plán',
  'Komplexní marketingový plán pro vaši firmu',
  '[{"label":"Popis firmy","max":100000,"placeholder":"Popište svou firmu, produkty a služby..."},{"label":"Cíl","max":5000,"placeholder":"Jaký je váš marketingový cíl?"},{"label":"Aktuální situace","max":5000,"placeholder":"Popište aktuální situaci na trhu..."}]',
  'marketing', 1
),
(
  'google-ads',
  'Google Ads',
  'Texty pro Google reklamní kampaně',
  '[{"label":"Produkt nebo služba","max":5000,"placeholder":"Co inzerujete?"},{"label":"Cílová skupina","max":5000,"placeholder":"Kdo jsou vaši zákazníci?"},{"label":"Hlavní výhody","max":5000,"placeholder":"Proč si vybrat vás?"}]',
  'advertising', 2
),
(
  'facebook-ads',
  'Facebook Ads',
  'Texty pro Facebook a Instagram reklamy',
  '[{"label":"Produkt nebo služba","max":5000,"placeholder":"Co inzerujete?"},{"label":"Cílová skupina","max":5000,"placeholder":"Kdo jsou vaši zákazníci?"},{"label":"Hlavní sdělení","max":5000,"placeholder":"Co chcete zákazníkům říci?"}]',
  'advertising', 3
),
(
  'sklik-ads',
  'Sklik Ads',
  'Texty pro Sklik reklamní kampaně',
  '[{"label":"Produkt nebo služba","max":5000,"placeholder":"Co inzerujete?"},{"label":"Klíčová slova","max":5000,"placeholder":"Na jaká klíčová slova cílíte?"}]',
  'advertising', 4
),
(
  'youtube-ads',
  'YouTube Ads',
  'Scénáře pro YouTube video reklamy',
  '[{"label":"Produkt nebo služba","max":5000,"placeholder":"Co inzerujete?"},{"label":"Cílová skupina","max":5000,"placeholder":"Pro koho je reklama?"},{"label":"Tón komunikace","max":5000,"placeholder":"Formální, přátelský, humorný..."}]',
  'advertising', 5
),
(
  'webinar',
  'Webinář',
  'Obsah a struktura webináře',
  '[{"label":"Téma webináře","max":5000,"placeholder":"O čem bude webinář?"},{"label":"Cílová skupina","max":5000,"placeholder":"Pro koho je webinář určen?"}]',
  'content', 6
);
