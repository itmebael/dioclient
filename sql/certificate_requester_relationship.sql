-- Save the requester's relationship to the certificate holder. Safe to re-run.
alter table public.diocese_service_bookings
  add column if not exists requester_relationship text;

notify pgrst, 'reload schema';
