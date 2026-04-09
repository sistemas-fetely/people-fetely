
INSERT INTO public.role_permissions (role_name, module, permission, granted, colaborador_tipo)
VALUES
  ('super_admin', 'notas_fiscais', 'aprovar', true, 'all'),
  ('gestor_rh', 'notas_fiscais', 'aprovar', true, 'all'),
  ('financeiro', 'notas_fiscais', 'aprovar', true, 'all')
ON CONFLICT (role_name, module, permission, colaborador_tipo) DO UPDATE SET granted = true;
