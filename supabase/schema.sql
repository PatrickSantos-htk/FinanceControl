-- FinanceControl · schema do banco (Supabase / Postgres)
-- Rode este arquivo inteiro no SQL Editor do Supabase (uma vez).

-- ---------------------------------------------------------------
-- Gastos e ganhos fixos (recorrentes)
-- ---------------------------------------------------------------
create table if not exists public.recurrences (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  description  text not null check (char_length(description) between 1 and 120),
  type         text not null check (type in ('income', 'outcome')),
  category     text not null check (char_length(category) between 1 and 60),
  amount       numeric(12, 2) not null check (amount > 0),
  day_of_month smallint not null check (day_of_month between 1 and 31),
  start_month  date not null,              -- sempre o dia 1 do mês inicial
  end_month    date,                       -- opcional: último mês (dia 1)
  active       boolean not null default true,
  last_generated_month date,               -- último mês já lançado automaticamente
  created_at   timestamptz not null default now()
);

create index if not exists recurrences_user_idx on public.recurrences (user_id);

-- ---------------------------------------------------------------
-- Lançamentos (entradas e saídas)
-- ---------------------------------------------------------------
create table if not exists public.transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  description   text not null check (char_length(description) between 1 and 120),
  type          text not null check (type in ('income', 'outcome')),
  category      text not null check (char_length(category) between 1 and 60),
  amount        numeric(12, 2) not null check (amount > 0),
  date          date not null,
  paid          boolean not null default true,
  recurrence_id uuid references public.recurrences (id) on delete set null,
  ref_month     date,                       -- mês de referência do lançamento fixo
  notes         text check (notes is null or char_length(notes) <= 500),
  created_at    timestamptz not null default now()
);

create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc);

-- Impede que o mesmo gasto fixo seja lançado duas vezes no mesmo mês
-- (ex.: app aberto no celular e no PC ao mesmo tempo).
-- (NULL não conflita com NULL, então lançamentos avulsos não são afetados.)
alter table public.transactions
  drop constraint if exists transactions_recurrence_month_key;
alter table public.transactions
  add constraint transactions_recurrence_month_key unique (recurrence_id, ref_month);

-- ---------------------------------------------------------------
-- Segurança: cada usuário só enxerga e altera os próprios dados
-- ---------------------------------------------------------------
alter table public.recurrences  enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "recurrences: dono" on public.recurrences;
create policy "recurrences: dono" on public.recurrences
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "transactions: dono" on public.transactions;
create policy "transactions: dono" on public.transactions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
