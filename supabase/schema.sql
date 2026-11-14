-- ============================================================
-- METRODOC CI — Schéma PostgreSQL (Supabase)
-- À exécuter dans le SQL Editor de votre projet Supabase.
-- ============================================================

-- Extensions ---------------------------------------------------
create extension if not exists "pgcrypto";

-- Types énumérés -----------------------------------------------
do $$ begin
  create type app_role as enum ('client', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('pending', 'paid', 'failed', 'cancelled');
exception when duplicate_object then null; end $$;

-- Profils (1 ligne par compte auth.users) ----------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  role app_role not null default 'client',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Catégories ----------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- Produits ------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  price_fcfa integer not null check (price_fcfa >= 0),
  promo_price_fcfa integer check (promo_price_fcfa >= 0),
  format text not null default 'PDF',
  file_path text,
  preview_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_published_idx on public.products (is_published);
create index if not exists products_category_idx on public.products (category_id);

-- Commandes ------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status order_status not null default 'pending',
  amount_fcfa integer not null check (amount_fcfa >= 0),
  currency text not null default 'XOF',
  cinetpay_transaction_id text unique,
  cinetpay_payment_token text,
  cinetpay_payment_method text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders (user_id);
create index if not exists orders_status_idx on public.orders (status);

-- Lignes de commande (prix figés au moment de l'achat) -----------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  product_title text not null,
  unit_price_fcfa integer not null check (unit_price_fcfa >= 0),
  quantity integer not null default 1 check (quantity > 0)
);

create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_product_idx on public.order_items (product_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Profils : chacun lit / met à jour son profil uniquement.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- Catégories : lecture publique, écriture réservée au service_role (aucune policy).
drop policy if exists "categories_select_public" on public.categories;
create policy "categories_select_public" on public.categories
  for select using (true);

-- Produits : lecture publique des produits publiés uniquement.
-- Les écritures passent par la clé service_role (aucune policy d'écriture).
drop policy if exists "products_select_published" on public.products;
create policy "products_select_published" on public.products
  for select using (is_published = true);

-- Commandes : le client voit uniquement ses commandes.
-- Aucune policy d'insertion / mise à jour : créées et validées
-- côté serveur avec la clé service_role (montants calculés serveur).
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id);

drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

-- ============================================================
-- Déclencheurs
-- ============================================================

-- Création automatique du profil à l'inscription.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at automatique.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ============================================================
-- Storage privé : bucket "documents"
-- Les fichiers vendus ne sont JAMAIS publics ; l'accès se fait
-- via URLs signées générées côté serveur après vérification du
-- droit de téléchargement.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;
