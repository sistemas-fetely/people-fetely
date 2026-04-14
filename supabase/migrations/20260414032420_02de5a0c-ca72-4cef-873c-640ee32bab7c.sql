CREATE POLICY "Admin RH can view non-superadmin roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin_rh')
  AND role != 'super_admin'
);