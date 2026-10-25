-- 0013: Public, read-only summary of verified figures for the home page.
-- Only counts that have passed review are returned. A figure with nothing verified yet is returned as NULL,
-- so the page can say "Awaiting verification" instead of showing 0 or an estimate. No locations, no personal details.
CREATE OR REPLACE FUNCTION public.public_summary() RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH latest AS (
    SELECT DISTINCT ON (sc.planting_event_id) sc.planting_event_id, sc.confirmed_alive, sc.confirmed_dead
    FROM survival_checks sc
    WHERE sc.submission_status = 'verified'
    ORDER BY sc.planting_event_id, sc.inspection_date DESC, sc.created_at DESC
  ), agg AS (
    SELECT sum(pe.quantity_planted) AS planted, sum(l.confirmed_alive) AS alive, sum(l.confirmed_dead) AS dead
    FROM latest l JOIN planting_events pe ON pe.id = l.planting_event_id
  )
  SELECT jsonb_build_object(
    'mother_trees',         (SELECT NULLIF(count(*), 0) FROM mother_trees WHERE verification_status = 'verified' AND is_active),
    'seedlings_distributed',(SELECT NULLIF(sum(quantity), 0) FROM distributions WHERE status = 'received'),
    'trees_planted',        (SELECT NULLIF(planted, 0) FROM agg),
    'survival_percent',     (SELECT CASE WHEN alive + dead > 0 THEN round(100.0 * alive / (alive + dead)) END FROM agg)
  ) $$;

REVOKE ALL ON FUNCTION public.public_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_summary() TO anon, authenticated;
