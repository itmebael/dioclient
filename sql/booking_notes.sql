alter table public.diocese_service_bookings
  add column if not exists notes text;

notify pgrst, 'reload schema';
