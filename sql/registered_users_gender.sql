-- Store gender selected during signup. Safe to re-run.
alter table public.registered_users
  add column if not exists gender text;

notify pgrst, 'reload schema';
