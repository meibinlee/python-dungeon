-- CODE QUEST shared TOP 10 leaderboard (v1.7.0; TOP 5 in v1.5.0). Table name kept as code_quest_top5.
-- Run once in the Supabase SQL Editor. Safe to run again.
-- Players (anon key) may only read the table and call submit_score(); the function keeps
-- the table at 10 rows by deleting every record outside the top 10 in the same transaction.

create table if not exists public.code_quest_top5 (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 17),
  score integer not null check (score between 0 and 30000),
  players smallint not null check (players in (1, 2)),
  created_at timestamptz not null default now()
);

alter table public.code_quest_top5 enable row level security;

drop policy if exists "Anyone can read the top 5" on public.code_quest_top5;
create policy "Anyone can read the top 5" on public.code_quest_top5
  for select to anon, authenticated using (true);

-- No direct writes from the game page: only the function below can change rows.
revoke insert, update, delete, truncate on public.code_quest_top5 from anon, authenticated;
grant select on public.code_quest_top5 to anon, authenticated;

create or replace function public.code_quest_submit_score(p_name text, p_score integer, p_players smallint)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id bigint;
  clean_name text := btrim(p_name);
begin
  if clean_name is null or char_length(clean_name) < 1 or char_length(clean_name) > 17 then
    raise exception 'invalid name';
  end if;
  if p_score is null or p_score < 0 or p_score > 30000 then
    raise exception 'invalid score';
  end if;
  if p_players not in (1, 2) then
    raise exception 'invalid players';
  end if;

  -- Serialize submissions so two classes finishing at once cannot leave more than 10 rows.
  lock table public.code_quest_top5 in share row exclusive mode;

  insert into public.code_quest_top5 (name, score, players)
  values (clean_name, p_score, p_players)
  returning id into new_id;

  delete from public.code_quest_top5
  where id not in (
    select id from public.code_quest_top5 order by score desc, created_at asc limit 10
  );

  return json_build_object(
    'id', (select id from public.code_quest_top5 where id = new_id),
    'top', coalesce((
      select json_agg(row_to_json(t))
      from (
        select id, name, score, players
        from public.code_quest_top5
        order by score desc, created_at asc
        limit 10
      ) t
    ), '[]'::json)
  );
end;
$$;

revoke all on function public.code_quest_submit_score(text, integer, smallint) from public;
grant execute on function public.code_quest_submit_score(text, integer, smallint) to anon, authenticated;
