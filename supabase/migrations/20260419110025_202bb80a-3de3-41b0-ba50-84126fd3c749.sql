-- 1.1 Guardrail: impedir delete de template em uso
CREATE OR REPLACE FUNCTION public.impedir_delete_template_em_uso()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.atribuicao_origem ao
    JOIN public.user_atribuicoes ua ON ua.id = ao.atribuicao_id
    WHERE ao.template_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'Template % (%) está vinculado a atribuições ativas de usuários. Não pode ser excluído.', OLD.nome, OLD.codigo;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.cargos WHERE template_id_padrao = OLD.id
  ) THEN
    RAISE EXCEPTION 'Template % está definido como padrão em cargos. Remova a vinculação antes.', OLD.nome;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_impedir_delete_template_em_uso ON public.cargo_template;
CREATE TRIGGER trg_impedir_delete_template_em_uso
  BEFORE DELETE ON public.cargo_template
  FOR EACH ROW EXECUTE FUNCTION public.impedir_delete_template_em_uso();

-- 1.2 Guardrail: proteger templates sistema
CREATE OR REPLACE FUNCTION public.proteger_template_sistema()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.is_sistema = true THEN
    IF NEW.codigo IS DISTINCT FROM OLD.codigo THEN
      RAISE EXCEPTION 'Templates de sistema não podem ter seu código alterado.';
    END IF;
    IF NEW.nome IS DISTINCT FROM OLD.nome THEN
      RAISE EXCEPTION 'Templates de sistema não podem ser renomeados.';
    END IF;
    IF NEW.nivel_sugerido IS DISTINCT FROM OLD.nivel_sugerido THEN
      RAISE EXCEPTION 'Templates de sistema não podem ter o nível alterado.';
    END IF;
    IF NEW.is_sistema IS DISTINCT FROM OLD.is_sistema THEN
      RAISE EXCEPTION 'A flag is_sistema não pode ser alterada.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proteger_template_sistema ON public.cargo_template;
CREATE TRIGGER trg_proteger_template_sistema
  BEFORE UPDATE ON public.cargo_template
  FOR EACH ROW EXECUTE FUNCTION public.proteger_template_sistema();

-- 1.3 Função auxiliar: contar uso
CREATE OR REPLACE FUNCTION public.contar_uso_template(_template_id UUID)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'usuarios',
    (SELECT COUNT(DISTINCT ua.user_id)
     FROM public.atribuicao_origem ao
     JOIN public.user_atribuicoes ua ON ua.id = ao.atribuicao_id
     WHERE ao.template_id = _template_id),
    'cargos_com_padrao',
    (SELECT COUNT(*) FROM public.cargos WHERE template_id_padrao = _template_id)
  );
$$;