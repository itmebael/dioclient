-- Run after diocese_announcements.sql in the Supabase SQL Editor.
-- Adds member visibility for published global posts and parish name variants.
-- Does not change publishing permissions or storage bucket permissions.
begin;

create or replace function public.announcement_parish_key(value text)
returns text language sql immutable set search_path = '' as $$
  select regexp_replace(lower(btrim(coalesce(value, ''))), '[^a-z0-9]+', '', 'g');
$$;

drop policy if exists "Members read published announcements" on public.diocese_announcements;
create policy "Members read published announcements"
on public.diocese_announcements for select to authenticated
using (
  lower(btrim(status)) = 'published'
  and (
    nullif(btrim(parish_name), '') is null
    or lower(btrim(audience)) in ('all parishes', 'all members', 'everyone', 'diocese-wide')
    or (
      public.announcement_parish_key(public.get_current_user_parish_name()) <> ''
      and public.announcement_parish_key(parish_name) =
          public.announcement_parish_key(public.get_current_user_parish_name())
    )
  )
);

commit;
