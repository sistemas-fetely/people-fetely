-- ============================================
-- V3-C · Função v3 + migração de dados
-- ============================================

-- 1) aplicar_template_cargo_v3: deriva perfil do departamento
CREATE OR REPLACE FUNCTION public.aplicar_template_cargo_v3(
  _user_id UUID,
  _template_id UUID,
  _departamento_id UUID,
  _unidade_id UUID,
  _atribuidor UUID DEFAULT NULL
)
RETURNS TABLE (atribuicao_id UUID, perfil_nome TEXT, nivel TEXT, unidade_nome TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_template RECORD;
  v_perfil_codigo TEXT;
  v_atrib RECORD;
  v_nova_id UUID;
BEGIN
  SELECT * INTO v_template FROM public.cargo_template WHERE id = _template_id;
  IF v_template IS NULL THEN
    RAISE EXCEPTION 'Template não encontrado';
  END IF;

  IF _departamento_id IS NOT NULL THEN
    SELECT perfil_codigo INTO v_perfil_codigo
    FROM public.perfil_area_do_departamento(_departamento_id);

    IF _unidade_id IS NULL THEN
      RAISE EXCEPTION 'Unidade é obrigatória quando departamento é informado (Regra 19 na Pedra)';
    END IF;
  END IF;

  FOR v_atrib IN
    SELECT p.id AS perfil_id, p.nome AS perfil_nome, p.tipo, ctp.nivel_override, ctp.escopo_unidade_id
    FROM public.cargo_template_perfis ctp
    JOIN public.perfis p ON p.id = ctp.perfil_id
    WHERE ctp.template_id = _template_id
  LOOP
    INSERT INTO public.user_atribuicoes (user_id, perfil_id, unidade_id, nivel, criado_por)
    VALUES (
      _user_id,
      v_atrib.perfil_id,
      CASE
        WHEN v_atrib.tipo = 'transversal' THEN NULL
        WHEN v_atrib.escopo_unidade_id IS NOT NULL THEN v_atrib.escopo_unidade_id
        ELSE _unidade_id
      END,
      CASE
        WHEN v_atrib.tipo = 'transversal' THEN NULL
        WHEN v_atrib.nivel_override IS NOT NULL THEN v_atrib.nivel_override
        ELSE v_template.nivel_sugerido
      END,
      _atribuidor
    )
    ON CONFLICT (user_id, perfil_id, unidade_id) DO NOTHING
    RETURNING id INTO v_nova_id;

    IF v_nova_id IS NOT NULL THEN
      INSERT INTO public.atribuicao_origem (atribuicao_id, template_id, origem)
      VALUES (v_nova_id, _template_id, 'template')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  IF v_perfil_codigo IS NOT NULL THEN
    INSERT INTO public.user_atribuicoes (user_id, perfil_id, unidade_id, nivel, criado_por)
    SELECT _user_id, p.id, _unidade_id, v_template.nivel_sugerido, _atribuidor
    FROM public.perfis p
    WHERE p.codigo = v_perfil_codigo AND p.tipo = 'area'
    ON CONFLICT (user_id, perfil_id, unidade_id) DO NOTHING
    RETURNING id INTO v_nova_id;

    IF v_nova_id IS NOT NULL THEN
      INSERT INTO public.atribuicao_origem (atribuicao_id, template_id, origem)
      VALUES (v_nova_id, _template_id, 'template')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    ua.id,
    p.nome,
    ua.nivel,
    u.nome
  FROM public.user_atribuicoes ua
  JOIN public.perfis p ON p.id = ua.perfil_id
  LEFT JOIN public.unidades u ON u.id = ua.unidade_id
  JOIN public.atribuicao_origem ao ON ao.atribuicao_id = ua.id
  WHERE ua.user_id = _user_id
    AND ao.template_id = _template_id
  ORDER BY p.tipo, p.nome;
END;
$$;

COMMENT ON FUNCTION public.aplicar_template_cargo_v3 IS
  'V3: deriva o perfil de área automaticamente a partir do departamento. Substitui aplicar_template_cargo (v2). Mantida a v2 até V3-D limpar.';

-- 2) Migração de dados — popular departamento_id nos registros existentes

UPDATE public.colaboradores_clt c
SET departamento_id = p.id
FROM public.parametros p
WHERE p.categoria = 'departamento'
  AND c.departamento_id IS NULL
  AND lower(trim(c.departamento)) = lower(p.label);

UPDATE public.contratos_pj c
SET departamento_id = p.id
FROM public.parametros p
WHERE p.categoria = 'departamento'
  AND c.departamento_id IS NULL
  AND lower(trim(c.departamento)) = lower(p.label);

UPDATE public.cargos c
SET departamento_id = p.id
FROM public.parametros p
WHERE p.categoria = 'departamento'
  AND c.departamento_id IS NULL
  AND c.departamento IS NOT NULL
  AND lower(trim(c.departamento)) = lower(p.label);

UPDATE public.profiles pr
SET departamento_id = p.id
FROM public.parametros p
WHERE p.categoria = 'departamento'
  AND pr.departamento_id IS NULL
  AND pr.department IS NOT NULL
  AND lower(trim(pr.department)) = lower(p.label);

UPDATE public.colaborador_departamentos cd
SET departamento_id = p.id
FROM public.parametros p
WHERE p.categoria = 'departamento'
  AND cd.departamento_id IS NULL
  AND lower(trim(cd.departamento)) = lower(p.label);

-- 3) Sanidade
DO $$
DECLARE
  v_clt_total INT; v_clt_migrado INT;
  v_pj_total INT; v_pj_migrado INT;
BEGIN
  SELECT COUNT(*) INTO v_clt_total FROM public.colaboradores_clt WHERE departamento IS NOT NULL;
  SELECT COUNT(*) INTO v_clt_migrado FROM public.colaboradores_clt WHERE departamento_id IS NOT NULL;
  RAISE NOTICE '[V3-C] CLT — % de % migrados para FK', v_clt_migrado, v_clt_total;

  SELECT COUNT(*) INTO v_pj_total FROM public.contratos_pj WHERE departamento IS NOT NULL;
  SELECT COUNT(*) INTO v_pj_migrado FROM public.contratos_pj WHERE departamento_id IS NOT NULL;
  RAISE NOTICE '[V3-C] PJ — % de % migrados para FK', v_pj_migrado, v_pj_total;
END $$;