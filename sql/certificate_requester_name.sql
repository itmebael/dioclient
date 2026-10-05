-- Save the person requesting a certificate separately from its record owner.
alter table public.diocese_service_bookings
  add column if not exists requester_name text;
notify pgrst, 'reload schema';
