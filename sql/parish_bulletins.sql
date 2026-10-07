-- Run in the Supabase SQL Editor after the existing parishes and
-- registered_users tables are installed. Safe to re-run.
-- Parish publishing accounts must have a verified login email matching
-- public.parishes.email. Members are linked by registered_users.parish_id.
begin;

create table if not exists public.parish_bulletins (
  id uuid primary key default gen_random_uuid(),
  parish_id uuid not null references public.parishes(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  content text not null check (char_length(btrim(content)) between 1 and 20000),
  category text not null default 'Parish matters' check (category in (
    'Project transparency', 'Donations & contributions', 'Visiting priests',
    'Fundraising', 'Parish matters'
  )),
  status text not null default 'Draft' check (status in ('Draft', 'Published', 'Archived')),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parish_bulletin_publication_date check (status <> 'Published' or published_at is not null)
);

create index if not exists parish_bulletins_feed_idx
  on public.parish_bulletins(parish_id, status, published_at desc);

-- Optional photos use the same format as announcement uploads.
alter table public.parish_bulletins
  add column if not exists photo_urls jsonb not null default '[]'::jsonb;

-- Do not use user-editable JWT user_metadata to authorize publishers.
create or replace function public.can_publish_parish_bulletin(target_parish uuid)
returns boolean language sql stable security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.parishes p
    join auth.users u on u.id = auth.uid()
    where p.id = target_parish and u.email_confirmed_at is not null
      and lower(btrim(p.email)) = lower(btrim(u.email))
  );
$$;

create or replace function public.can_read_parish_bulletin(target_parish uuid)
returns boolean language sql stable security definer
set search_path = ''
as $$
  select public.can_publish_parish_bulletin(target_parish) or exists (
    select 1 from public.registered_users r
    join auth.users u on u.id = auth.uid()
    where r.parish_id = target_parish
      and lower(btrim(r.email)) = lower(btrim(u.email))
  );
$$;

revoke all on function public.can_publish_parish_bulletin(uuid) from public;
revoke all on function public.can_read_parish_bulletin(uuid) from public;
grant execute on function public.can_publish_parish_bulletin(uuid) to authenticated;
grant execute on function public.can_read_parish_bulletin(uuid) to authenticated;

create or replace function public.set_parish_bulletin_dates()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if new.status = 'Published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists parish_bulletin_dates on public.parish_bulletins;
create trigger parish_bulletin_dates before insert or update
on public.parish_bulletins for each row execute function public.set_parish_bulletin_dates();

alter table public.parish_bulletins enable row level security;
revoke all on public.parish_bulletins from anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.parish_bulletins to authenticated;

drop policy if exists bulletin_read on public.parish_bulletins;
create policy bulletin_read on public.parish_bulletins for select to authenticated
using (
  public.can_publish_parish_bulletin(parish_id)
  or (status = 'Published' and public.can_read_parish_bulletin(parish_id))
);
drop policy if exists bulletin_insert on public.parish_bulletins;
create policy bulletin_insert on public.parish_bulletins for insert to authenticated
with check (public.can_publish_parish_bulletin(parish_id) and created_by = auth.uid());
drop policy if exists bulletin_update on public.parish_bulletins;
create policy bulletin_update on public.parish_bulletins for update to authenticated
using (public.can_publish_parish_bulletin(parish_id))
with check (public.can_publish_parish_bulletin(parish_id));
drop policy if exists bulletin_delete on public.parish_bulletins;
create policy bulletin_delete on public.parish_bulletins for delete to authenticated
using (public.can_publish_parish_bulletin(parish_id));

commit;

-- Publishing example: replace the values below, then run separately.
-- No sample posts are inserted by this migration.
-- insert into public.parish_bulletins
--   (parish_id, title, content, category, status)
-- values
--   ('YOUR-PARISH-UUID', 'Parish project update',
--    'Write the parish-approved report here.', 'Project transparency', 'Published');
-- A signed-in parish app can INSERT the same fields through Supabase REST.
-- published_at is set automatically. Use Draft to prepare a post or Archived
-- to remove it from the member feed without deleting it.
