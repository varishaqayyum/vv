-- Remove "year of entry" entirely: it is not relevant to the personal
-- statement checking service and should not be collected or stored anywhere.
-- This drops the column and any previously saved values with it.
ALTER TABLE public.profiles DROP COLUMN IF EXISTS entry_year;
