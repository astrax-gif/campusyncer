CREATE TABLE IF NOT EXISTS public.portal_state (
  id TEXT PRIMARY KEY CHECK (id = 'main'),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.portal_state ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.merge_portal_state(p_patch JSONB)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.portal_state (id, data, updated_at)
  VALUES ('main', p_patch, NOW())
  ON CONFLICT (id) DO UPDATE
  SET data = public.portal_state.data || EXCLUDED.data,
      updated_at = NOW();
$$;

REVOKE ALL ON TABLE public.portal_state FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.merge_portal_state(JSONB) FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.portal_state TO service_role;
GRANT EXECUTE ON FUNCTION public.merge_portal_state(JSONB) TO service_role;
