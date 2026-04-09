
-- Custom roles table
CREATE TABLE public.custom_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view roles"
  ON public.custom_roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admin can manage roles"
  ON public.custom_roles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_custom_roles_updated_at
  BEFORE UPDATE ON public.custom_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Role permissions table
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_name TEXT NOT NULL REFERENCES public.custom_roles(name) ON DELETE CASCADE ON UPDATE CASCADE,
  module TEXT NOT NULL,
  permission TEXT NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (role_name, module, permission)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view permissions"
  ON public.role_permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admin can manage permissions"
  ON public.role_permissions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Security definer function
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _module text, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_name = ur.role::text
    WHERE ur.user_id = _user_id
      AND rp.module = _module
      AND rp.permission = _permission
      AND rp.granted = true
  )
$$;

-- Seed system roles
INSERT INTO public.custom_roles (name, description, is_system) VALUES
  ('super_admin', 'Acesso total ao sistema, incluindo gerenciamento de usuários e configurações', true),
  ('gestor_rh', 'Gestão de pessoas, folha de pagamento, benefícios e convites', true),
  ('gestor_direto', 'Visualização de colaboradores da equipe e aprovações', true),
  ('colaborador', 'Acesso ao próprio perfil, holerites e férias', true),
  ('financeiro', 'Gestão financeira, notas fiscais, pagamentos PJ e folha', true);

-- Seed all permissions
DO $$
DECLARE
  v_modules TEXT[] := ARRAY['dashboard','colaboradores','contratos_pj','folha_pagamento','ferias','beneficios','movimentacoes','notas_fiscais','pagamentos_pj','organograma','convites','parametros','usuarios'];
  v_crud TEXT[] := ARRAY['view','create','edit','delete'];
  v_mod TEXT;
  v_perm TEXT;
  v_role TEXT;
BEGIN
  FOREACH v_role IN ARRAY ARRAY['super_admin','gestor_rh','gestor_direto','colaborador','financeiro'] LOOP
    FOREACH v_mod IN ARRAY v_modules LOOP
      FOREACH v_perm IN ARRAY v_crud LOOP
        INSERT INTO public.role_permissions (role_name, module, permission, granted) VALUES (v_role, v_mod, v_perm, false)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;

  -- Special permissions
  INSERT INTO public.role_permissions (role_name, module, permission, granted) VALUES
    ('super_admin', 'notas_fiscais', 'enviar_email', false),
    ('super_admin', 'ferias', 'aprovar', false),
    ('super_admin', 'folha_pagamento', 'fechar', false),
    ('super_admin', 'folha_pagamento', 'exportar', false),
    ('super_admin', 'convites', 'enviar', false),
    ('gestor_rh', 'notas_fiscais', 'enviar_email', false),
    ('gestor_rh', 'ferias', 'aprovar', false),
    ('gestor_rh', 'folha_pagamento', 'fechar', false),
    ('gestor_rh', 'folha_pagamento', 'exportar', false),
    ('gestor_rh', 'convites', 'enviar', false),
    ('gestor_direto', 'ferias', 'aprovar', false),
    ('financeiro', 'notas_fiscais', 'enviar_email', false),
    ('financeiro', 'folha_pagamento', 'fechar', false),
    ('financeiro', 'folha_pagamento', 'exportar', false)
  ON CONFLICT DO NOTHING;

  -- SUPER ADMIN: all granted
  UPDATE public.role_permissions SET granted = true WHERE role_name = 'super_admin';

  -- GESTOR RH: everything except usuarios.delete
  UPDATE public.role_permissions SET granted = true WHERE role_name = 'gestor_rh';
  UPDATE public.role_permissions SET granted = false WHERE role_name = 'gestor_rh' AND module = 'usuarios' AND permission = 'delete';

  -- GESTOR DIRETO: view most + aprovar ferias
  UPDATE public.role_permissions SET granted = true WHERE role_name = 'gestor_direto' AND permission = 'view';
  UPDATE public.role_permissions SET granted = true WHERE role_name = 'gestor_direto' AND module = 'ferias' AND permission = 'aprovar';
  UPDATE public.role_permissions SET granted = false WHERE role_name = 'gestor_direto' AND module IN ('parametros', 'usuarios') AND permission = 'view';

  -- COLABORADOR: view own data
  UPDATE public.role_permissions SET granted = true WHERE role_name = 'colaborador' AND module IN ('dashboard','ferias','beneficios','movimentacoes','folha_pagamento') AND permission = 'view';

  -- FINANCEIRO: financial full, others view
  UPDATE public.role_permissions SET granted = true WHERE role_name = 'financeiro' AND module IN ('notas_fiscais','pagamentos_pj','folha_pagamento','beneficios');
  UPDATE public.role_permissions SET granted = true WHERE role_name = 'financeiro' AND permission = 'view';
  UPDATE public.role_permissions SET granted = false WHERE role_name = 'financeiro' AND module IN ('parametros','usuarios') AND permission = 'view';
END $$;
