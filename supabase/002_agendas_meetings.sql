-- 議題テーブル
create table agendas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  proposer_id uuid references members(id) on delete set null,
  assignee_id uuid references members(id) on delete set null,
  status text not null default 'undiscussed',
    -- idea / undiscussed / scheduled / discussing / pending / decided / rejected
  priority text not null default 'normal', -- low / normal / high
  estimated_minutes int,
  discussion_deadline date,
  tags text,
  created_at timestamptz not null default now()
);

-- 会議テーブル
create table meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meeting_date date not null,
  created_at timestamptz not null default now()
);

-- 会議と議題の中間テーブル
create table meeting_agendas (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  agenda_id uuid not null references agendas(id) on delete cascade,
  notes text,
  outcome text, -- decided / pending / rejected (会議での結論)
  created_at timestamptz not null default now(),
  unique (meeting_id, agenda_id)
);

-- 決定事項テーブル
create table decisions (
  id uuid primary key default gen_random_uuid(),
  agenda_id uuid references agendas(id) on delete set null,
  meeting_id uuid references meetings(id) on delete set null,
  content text not null,
  decided_at timestamptz not null default now()
);

-- ToDoが「どの決定事項から生まれたか」を辿れるようにする
alter table todos add column source_decision_id uuid references decisions(id) on delete set null;

-- RLS
alter table agendas enable row level security;
alter table meetings enable row level security;
alter table meeting_agendas enable row level security;
alter table decisions enable row level security;

create policy "agendas: authenticated full access" on agendas for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "meetings: authenticated full access" on meetings for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "meeting_agendas: authenticated full access" on meeting_agendas for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "decisions: authenticated full access" on decisions for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
