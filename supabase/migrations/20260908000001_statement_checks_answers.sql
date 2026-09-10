-- Extends the existing statement_checks table (not a new table) so each
-- saved check keeps a snapshot of exactly what was submitted for it. This is
-- what lets "My Account" show a real history of versions over time rather
-- than only the single, overwritable draft in personal_statements.
ALTER TABLE public.statement_checks
  ADD COLUMN answer_one TEXT,
  ADD COLUMN answer_two TEXT,
  ADD COLUMN answer_three TEXT;

-- Speeds up "this user's checks, most recent first" queries used by the
-- account dashboard's history list.
CREATE INDEX statement_checks_user_id_created_at_idx
  ON public.statement_checks (user_id, created_at DESC);
