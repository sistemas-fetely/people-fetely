
-- Dashboard view for both CLT and PJ colaboradores
INSERT INTO public.role_permissions (role_name, module, permission, granted, colaborador_tipo)
VALUES
  ('colaborador', 'dashboard', 'view', true, 'clt'),
  ('colaborador', 'dashboard', 'view', true, 'pj'),
  -- PJ-specific modules for colaborador
  ('colaborador', 'contratos_pj', 'view', true, 'pj'),
  ('colaborador', 'notas_fiscais', 'view', true, 'pj'),
  ('colaborador', 'pagamentos_pj', 'view', true, 'pj'),
  ('colaborador', 'ferias', 'view', true, 'pj')
ON CONFLICT DO NOTHING;

-- Remove the old dashboard false entry that conflicts
DELETE FROM public.role_permissions
WHERE role_name = 'colaborador'
  AND module = 'dashboard'
  AND permission = 'view'
  AND granted = false;
