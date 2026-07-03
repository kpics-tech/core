-- 議題への意見・コメント
create table agenda_comments (
  id uuid primary key default gen_random_uuid(),
  agenda_id uuid not null references agendas(id) on delete cascade,
  author_id uuid references members(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table agenda_comments enable row level security;

create policy "agenda_comments: authenticated full access" on agenda_comments for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
