-- Run in the Supabase SQL editor to enable parish chat availability.
create table if not exists public.parish_presence (
  parish_id uuid primary key references public.parishes(id) on delete cascade,
  last_seen timestamptz not null
);
alter table public.parish_presence enable row level security;
revoke all on public.parish_presence from anon, authenticated;

create or replace function public.heartbeat_parish_presence()
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or coalesce(auth.jwt()->'user_metadata'->>'role','') <> 'parish' then
    raise exception 'Parish session required';
  end if;
  insert into public.parish_presence(parish_id,last_seen)
  select id, now() from public.parishes
  where lower(email) = lower(auth.jwt()->>'email')
  on conflict(parish_id) do update set last_seen = excluded.last_seen;
end;
$$;

create or replace function public.get_parish_presence(p_parish_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Member session required'; end if;
  return exists(select 1 from public.parish_presence
    where parish_id = p_parish_id and last_seen > now() - interval '90 seconds');
end;
$$;
revoke all on function public.heartbeat_parish_presence() from public, anon;
revoke all on function public.get_parish_presence(uuid) from public, anon;
grant execute on function public.heartbeat_parish_presence() to authenticated;
grant execute on function public.get_parish_presence(uuid) to authenticated;
notify pgrst, 'reload schema';
