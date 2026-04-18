-- MIGRATION 1: Expandir enum app_role com novos valores
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'rh';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'administrativo';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ti';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'recrutamento';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gestao_direta';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'estagiario';

-- MIGRATION 2: Criar enum de níveis hierárquicos
DO $$ BEGIN
  CREATE TYPE public.nivel_cargo AS ENUM (
    'estagio',
    'assistente',
    'analista',
    'coordenador',
    'gerente',
    'diretor'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- MIGRATION 3: Adicionar coluna nivel em user_roles
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS nivel public.nivel_cargo;

COMMENT ON COLUMN public.user_roles.nivel IS 'Nível hierárquico do usuário dentro da role. NULL = não se aplica (ex: super_admin, colaborador comum)';

-- MIGRATION 4: Adicionar coluna nivel_minimo em role_permissions
ALTER TABLE public.role_permissions
  ADD COLUMN IF NOT EXISTS nivel_minimo public.nivel_cargo;

COMMENT ON COLUMN public.role_permissions.nivel_minimo IS 'Nível mínimo do usuário para ter essa permissão. NULL = qualquer nível da role tem. Usado para granularidade dentro da mesma role.';

-- MIGRATION 5: Função helper has_role_with_level
CREATE OR REPLACE FUNCTION public.has_role_with_level(
  _user_id UUID,
  _role public.app_role,
  _nivel_minimo public.nivel_cargo DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (
        _nivel_minimo IS NULL
        OR nivel IS NULL
        OR CASE nivel
          WHEN 'estagio'     THEN 1
          WHEN 'assistente'  THEN 2
          WHEN 'analista'    THEN 3
          WHEN 'coordenador' THEN 4
          WHEN 'gerente'     THEN 5
          WHEN 'diretor'     THEN 6
        END >= CASE _nivel_minimo
          WHEN 'estagio'     THEN 1
          WHEN 'assistente'  THEN 2
          WHEN 'analista'    THEN 3
          WHEN 'coordenador' THEN 4
          WHEN 'gerente'     THEN 5
          WHEN 'diretor'     THEN 6
        END
      )
  )
$$;

-- MIGRATION 6: Seed de custom_roles com descrições
INSERT INTO public.custom_roles (name, description, is_system) VALUES
  ('rh', 'Recursos Humanos', true),
  ('financeiro', 'Financeiro', true),
  ('administrativo', 'Administrativo', true),
  ('operacional', 'Operações Fabris', true),
  ('ti', 'Tecnologia da Informação', true),
  ('recrutamento', 'Recrutamento', true),
  ('fiscal', 'Fiscal/Contábil', true),
  ('gestao_direta', 'Gestão Direta (líder de time)', true),
  ('estagiario', 'Estagiário (qualquer área)', true)
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;