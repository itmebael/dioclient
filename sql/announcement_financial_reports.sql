-- Apply after diocese_announcements.sql. Existing parish access policies remain in force.
-- Parish publishers use category = 'Financial Report' and photo_urls containing
-- HTTPS URLs of images uploaded to their parish storage. Members view Published rows.
alter table public.diocese_announcements
  add column if not exists category text not null default 'Notice',
  add column if not exists photo_urls jsonb not null default '[]'::jsonb;

comment on column public.diocese_announcements.photo_urls is
  'Array of URLs for photos uploaded by the publishing parish.';
