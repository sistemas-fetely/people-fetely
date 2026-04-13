
-- 1. Create grupos_acesso table
CREATE TABLE public.grupos_acesso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo_colaborador TEXT NOT NULL CHECK (tipo_colaborador IN ('clt', 'pj', 'ambos')),
  role_automatico app_role NOT NULL DEFAULT 'colaborador',
  is_system BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.grupos_acesso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view grupos_acesso"
ON public.grupos_acesso FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Super admin and admin_rh can insert grupos_acesso"
ON public.grupos_acesso FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_rh'));

CREATE POLICY "Super admin and admin_rh can update grupos_acesso"
ON public.grupos_acesso FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_rh'));

CREATE POLICY "Super admin and admin_rh can delete non-system grupos_acesso"
ON public.grupos_acesso FOR DELETE TO authenticated
USING (
  (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_rh'))
  AND is_system = false
);

CREATE TRIGGER update_grupos_acesso_updated_at
BEFORE UPDATE ON public.grupos_acesso
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Insert default system groups
INSERT INTO public.grupos_acesso (nome, descricao, tipo_colaborador, role_automatico, is_system) VALUES
  ('Colaborador CLT', 'Acesso padrão para colaboradores CLT', 'clt', 'colaborador', true),
  ('Colaborador PJ', 'Acesso padrão para prestadores PJ', 'pj', 'colaborador', true),
  ('Gestor Direto', 'Acesso de gestão de equipe', 'ambos', 'gestor_direto', true),
  ('Admin RH', 'Gestão completa de RH, acesso a dados sensíveis', 'ambos', 'admin_rh', true),
  ('Financeiro', 'Acesso a dados financeiros e pagamentos', 'ambos', 'financeiro', true);

-- 3. Add grupo_acesso_id to convites_cadastro
ALTER TABLE public.convites_cadastro ADD COLUMN grupo_acesso_id UUID REFERENCES public.grupos_acesso(id);

-- 4. Add revogado_em to user_roles for tracking revocation
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS revogado_em TIMESTAMPTZ;
