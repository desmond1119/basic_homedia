-- Fix app_users RLS policy to avoid infinite recursion when checking admin role

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT role = 'admin' INTO v_is_admin
  FROM public.app_users
  WHERE id = p_user_id;

  RETURN COALESCE(v_is_admin, false);
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;
ALTER FUNCTION public.is_admin(uuid) OWNER TO postgres;

DROP POLICY IF EXISTS "Admins can view all users" ON public.app_users;
CREATE POLICY "Admins can view all users" ON public.app_users
FOR SELECT
USING (
  public.is_admin(auth.uid())
);
