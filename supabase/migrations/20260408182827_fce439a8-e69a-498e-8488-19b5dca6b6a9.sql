
-- Tighten INSERT policy for convites_cadastro
DROP POLICY "Authenticated users can create convites" ON public.convites_cadastro;
CREATE POLICY "HR can create convites"
  ON public.convites_cadastro
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'gestor_rh')
  );

-- Tighten DELETE policy
DROP POLICY "Authenticated users can delete convites" ON public.convites_cadastro;
CREATE POLICY "HR can delete convites"
  ON public.convites_cadastro
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'gestor_rh')
  );
