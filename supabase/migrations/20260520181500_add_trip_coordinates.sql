alter table public.trips
  add column if not exists start_lat double precision,
  add column if not exists start_lon double precision,
  add column if not exists end_lat double precision,
  add column if not exists end_lon double precision;
