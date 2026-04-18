-- Run this in Supabase SQL editor

create table rl_nodes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  type text not null, -- project, prompt, response, summary, decision
  data jsonb,
  x float default 0,
  y float default 0,
  created_at timestamp default now()
);

create table rl_edges (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  from_node uuid,
  to_node uuid,
  created_at timestamp default now()
);

-- Optional: index for fast lookup
create index on rl_nodes(project_id);
create index on rl_nodes(project_id, type);
create index on rl_edges(project_id);

-- RLS: enable and allow all (app uses service key / anon key with no user auth)
alter table rl_nodes enable row level security;
alter table rl_edges enable row level security;

create policy "allow all" on rl_nodes for all using (true) with check (true);
create policy "allow all" on rl_edges for all using (true) with check (true);
