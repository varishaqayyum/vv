-- Minimal analytics events table. Deliberately does NOT store personal
-- statement content, names, or emails — just an anonymous visitor id, an
-- event name, an optional page path, and small non-identifying metadata
-- (e.g. which check number was just used).
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  path TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes to keep aggregate/funnel queries fast as the table grows.
CREATE INDEX analytics_events_event_name_idx ON public.analytics_events (event_name);
CREATE INDEX analytics_events_created_at_idx ON public.analytics_events (created_at);
CREATE INDEX analytics_events_visitor_id_idx ON public.analytics_events (visitor_id);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone (including guests, who are never authenticated) can record an
-- event — this is what lets analytics work without requiring an account.
GRANT INSERT ON public.analytics_events TO anon, authenticated;
CREATE POLICY "anyone can record an event" ON public.analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only signed-in users can read the aggregate data (there is no separate
-- "admin" role in this project yet — this is the simplest available gate,
-- keeping the dashboard invisible to anonymous students while not requiring
-- any change to the student-facing checker itself).
GRANT SELECT ON public.analytics_events TO authenticated;
CREATE POLICY "authenticated users can read events" ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (true);

GRANT ALL ON public.analytics_events TO service_role;
