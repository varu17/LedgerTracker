create extension if not exists "pgcrypto";

create type payment_mode as enum (
  'Cash',
  'Bank Transfer',
  'UPI',
  'Card',
  'Cheque',
  'Other'
);

create table public.people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transaction_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  dashboard_effect text not null default 'Neutral'
    check (dashboard_effect in ('Spent', 'Received', 'Capital Added', 'Neutral')),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_date date not null,
  person_id uuid references public.people(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  type text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  reason text not null,
  description text,
  payment_mode payment_mode not null default 'Other',
  important boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index people_archived_idx on public.people(archived);
create index categories_archived_idx on public.categories(archived);
create index transaction_types_archived_idx on public.transaction_types(archived);
create index transactions_deleted_at_idx on public.transactions(deleted_at);
create index transactions_date_idx on public.transactions(transaction_date desc);
create index transactions_person_id_idx on public.transactions(person_id);
create index transactions_category_id_idx on public.transactions(category_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_people_updated_at
before update on public.people
for each row execute function public.set_updated_at();

create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger set_transaction_types_updated_at
before update on public.transaction_types
for each row execute function public.set_updated_at();

create trigger set_transactions_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

alter table public.people enable row level security;
alter table public.categories enable row level security;
alter table public.transaction_types enable row level security;
alter table public.transactions enable row level security;

create policy "Allow shared read access to people"
on public.people for select
using (true);

create policy "Allow shared write access to people"
on public.people for all
using (true)
with check (true);

create policy "Allow shared read access to categories"
on public.categories for select
using (true);

create policy "Allow shared write access to categories"
on public.categories for all
using (true)
with check (true);

create policy "Allow shared read access to transaction types"
on public.transaction_types for select
using (true);

create policy "Allow shared write access to transaction types"
on public.transaction_types for all
using (true)
with check (true);

create policy "Allow shared read access to transactions"
on public.transactions for select
using (true);

create policy "Allow shared write access to transactions"
on public.transactions for all
using (true)
with check (true);

insert into public.transaction_types (name, dashboard_effect)
values
  ('Spent', 'Spent'),
  ('Received', 'Received'),
  ('Capital Added', 'Capital Added'),
  ('Transfer', 'Neutral')
on conflict (name) do nothing;
