
-- Add recrutador to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'recrutador';

-- RLS: recrutador can manage vagas
CREATE POLICY "recrutador_vagas"
ON public.vagas
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'recrutador'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'recrutador'::app_role));

-- RLS: recrutador can manage candidatos
CREATE POLICY "recrutador_candidatos"
ON public.candidatos
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'recrutador'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'recrutador'::app_role));

-- RLS: recrutador can manage candidato_avaliacoes
DROP POLICY IF EXISTS "Staff can manage candidato_avaliacoes" ON public.candidato_avaliacoes;
CREATE POLICY "Staff can manage candidato_avaliacoes"
ON public.candidato_avaliacoes
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_rh'::app_role) OR has_role(auth.uid(), 'gestor_rh'::app_role) OR has_role(auth.uid(), 'gestor_direto'::app_role) OR has_role(auth.uid(), 'recrutador'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_rh'::app_role) OR has_role(auth.uid(), 'gestor_rh'::app_role) OR has_role(auth.uid(), 'gestor_direto'::app_role) OR has_role(auth.uid(), 'recrutador'::app_role));

-- RLS: recrutador can manage candidato_historico
DROP POLICY IF EXISTS "Staff can manage candidato_historico" ON public.candidato_historico;
CREATE POLICY "Staff can manage candidato_historico"
ON public.candidato_historico
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_rh'::app_role) OR has_role(auth.uid(), 'gestor_rh'::app_role) OR has_role(auth.uid(), 'gestor_direto'::app_role) OR has_role(auth.uid(), 'recrutador'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_rh'::app_role) OR has_role(auth.uid(), 'gestor_rh'::app_role) OR has_role(auth.uid(), 'gestor_direto'::app_role) OR has_role(auth.uid(), 'recrutador'::app_role));

-- RLS: recrutador can manage candidato_notas
DROP POLICY IF EXISTS "Staff can manage candidato_notas" ON public.candidato_notas;
CREATE POLICY "Staff can manage candidato_notas"
ON public.candidato_notas
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_rh'::app_role) OR has_role(auth.uid(), 'gestor_rh'::app_role) OR has_role(auth.uid(), 'gestor_direto'::app_role) OR has_role(auth.uid(), 'recrutador'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'admin_rh'::app_role) OR has_role(auth.uid(), 'gestor_rh'::app_role) OR has_role(auth.uid(), 'gestor_direto'::app_role) OR has_role(auth.uid(), 'recrutador'::app_role));

-- Insert default permissions for recrutador role
INSERT INTO public.custom_roles (name, description, is_system) 
VALUES ('recrutador', 'Gestão completa de recrutamento e seleção', true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_name, module, permission, granted, colaborador_tipo) VALUES
  ('recrutador', 'recrutamento', 'view', true, 'all'),
  ('recrutador', 'recrutamento', 'create', true, 'all'),
  ('recrutador', 'recrutamento', 'edit', true, 'all'),
  ('recrutador', 'recrutamento', 'delete', false, 'all'),
  ('recrutador', 'cargos', 'view', true, 'all'),
  ('recrutador', 'cargos', 'edit', false, 'all'),
  ('recrutador', 'convites', 'view', true, 'all'),
  ('recrutador', 'convites', 'create', true, 'all'),
  ('recrutador', 'organograma', 'view', true, 'all'),
  ('recrutador', 'colaboradores', 'view', true, 'all'),
  ('recrutador', 'contratos_pj', 'view', true, 'all'),
  ('recrutador', 'folha_pagamento', 'view', false, 'all'),
  ('recrutador', 'pagamentos_pj', 'view', false, 'all'),
  ('recrutador', 'notas_fiscais', 'view', false, 'all'),
  ('recrutador', 'parametros', 'view', false, 'all'),
  ('recrutador', 'usuarios', 'view', false, 'all')
ON CONFLICT DO NOTHING;
