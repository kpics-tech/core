-- 周知したいこと(仕事ではないが共有したい情報)
create table announcements (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  created_at timestamptz not null default now()
);

alter table announcements enable row level security;

create policy "announcements: authenticated full access" on announcements for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
