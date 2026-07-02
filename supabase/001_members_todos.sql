-- メンバー(幹部)テーブル
create table members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  created_at timestamptz not null default now()
);

-- ToDoテーブル
create table todos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  memo text,
  assignee_id uuid references members(id) on delete set null,
  created_by uuid references members(id) on delete set null,
  due_date date,
  priority text not null default 'normal',   -- low / normal / high
  status text not null default 'todo',        -- todo / in_progress / done
  is_shared boolean not null default true,
  created_at timestamptz not null default now()
);

-- RLS(合言葉でログインした幹部だけが読み書きできるようにする)
alter table members enable row level security;
alter table todos enable row level security;

create policy "members: authenticated full access"
  on members for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "todos: authenticated full access"
  on todos for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
