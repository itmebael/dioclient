-- Set every existing certificate service fee to PHP 100. Safe to re-run.
begin;
update public.diocese_services
set fee = '₱100'
where lower(btrim(service_type)) = 'certificate'
   or lower(btrim(name)) like '%certificate%';
commit;
