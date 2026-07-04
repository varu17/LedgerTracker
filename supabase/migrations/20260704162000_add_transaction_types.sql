create table if not exists public.transaction_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  dashboard_effect text not null default 'Neutral'
    check (dashboard_effect in ('Spent', 'Received', 'Capital Added', 'Neutral')),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.transaction_types (name, dashboard_effect)
values
  ('Spent', 'Spent'),
  ('Received', 'Received'),
  ('Capital Added', 'Capital Added'),
  ('Transfer', 'Neutral')
on conflict (name) do update
set dashboard_effect = excluded.dashboard_effect;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'transactions'
      and column_name = 'type'
      and udt_name = 'transaction_type'
  ) then
    alter table public.transactions
    alter column type type text
    using type::text;
  end if;
end $$;

create index if not exists transaction_types_archived_idx
on public.transaction_types(archived);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_transaction_types_updated_at'
  ) then
    create trigger set_transaction_types_updated_at
    before update on public.transaction_types
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.transaction_types enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'transaction_types'
      and policyname = 'Allow shared read access to transaction types'
  ) then
    create policy "Allow shared read access to transaction types"
    on public.transaction_types for select
    using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'transaction_types'
      and policyname = 'Allow shared write access to transaction types'
  ) then
    create policy "Allow shared write access to transaction types"
    on public.transaction_types for all
    using (true)
    with check (true);
  end if;
end $$;
