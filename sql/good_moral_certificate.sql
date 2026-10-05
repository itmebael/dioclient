-- Run against the existing diocese_services and diocese_service_bookings tables.
-- Certificate types are stored in service_name as text; no enum change is needed.
begin;

alter table public.diocese_service_bookings
  add column if not exists service_name text;

alter table public.diocese_service_bookings
  add column if not exists notes text;

-- Add the service to the live certificate selector. Safe to re-run.
insert into public.diocese_services
  (name, description, service_type, fee, processing_time, status)
select
  'Good Moral Certificate',
  'Certification of good moral character',
  'Certificate',
  '₱100',
  'Parish office schedule',
  'Available'
where not exists (
  select 1 from public.diocese_services
  where lower(btrim(name)) = 'good moral certificate'
);

notify pgrst, 'reload schema';
commit;
