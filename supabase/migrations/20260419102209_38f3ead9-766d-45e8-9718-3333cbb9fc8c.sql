DO $$
DECLARE
  rec RECORD;
  v_canonical_id UUID;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Estado ANTES do fix para valor=design:';
  RAISE NOTICE '========================================';
  FOR rec IN 
    SELECT id, label, pai_valor, ativo, perfil_area_codigo, ordem, created_at
    FROM public.parametros
    WHERE categoria = 'departamento' AND valor = 'design'
    ORDER BY created_at
  LOOP
    RAISE NOTICE 'id=% | label=% | pai=% | ativo=% | perfil=% | ordem=% | created=%',
      rec.id, rec.label, rec.pai_valor, rec.ativo, rec.perfil_area_codigo, rec.ordem, rec.created_at;
  END LOOP;

  SELECT id INTO v_canonical_id
  FROM public.parametros
  WHERE categoria = 'departamento' AND valor = 'design' AND pai_valor = 'produtos'
  ORDER BY created_at
  LIMIT 1;

  IF v_canonical_id IS NULL THEN
    SELECT id INTO v_canonical_id
    FROM public.parametros
    WHERE categoria = 'departamento' AND valor = 'design'
    ORDER BY created_at
    LIMIT 1;
  END IF;

  IF v_canonical_id IS NULL THEN
    INSERT INTO public.parametros (categoria, valor, label, pai_valor, ordem, ativo, is_clevel, perfil_area_codigo)
    VALUES ('departamento', 'design', 'Design', 'produtos', 1, true, false, 'produtos')
    RETURNING id INTO v_canonical_id;
    RAISE NOTICE 'Nenhum registro encontrado — criado novo com id=%', v_canonical_id;
  ELSE
    UPDATE public.parametros
    SET
      label = 'Design',
      pai_valor = 'produtos',
      perfil_area_codigo = 'produtos',
      ativo = true,
      ordem = 1,
      is_clevel = false
    WHERE id = v_canonical_id;
    RAISE NOTICE 'Canônico normalizado: id=%', v_canonical_id;
  END IF;

  UPDATE public.colaboradores_clt SET departamento_id = v_canonical_id
    WHERE departamento_id IN (SELECT id FROM public.parametros WHERE categoria = 'departamento' AND valor = 'design' AND id <> v_canonical_id);

  UPDATE public.contratos_pj SET departamento_id = v_canonical_id
    WHERE departamento_id IN (SELECT id FROM public.parametros WHERE categoria = 'departamento' AND valor = 'design' AND id <> v_canonical_id);

  UPDATE public.cargos SET departamento_id = v_canonical_id
    WHERE departamento_id IN (SELECT id FROM public.parametros WHERE categoria = 'departamento' AND valor = 'design' AND id <> v_canonical_id);

  UPDATE public.profiles SET departamento_id = v_canonical_id
    WHERE departamento_id IN (SELECT id FROM public.parametros WHERE categoria = 'departamento' AND valor = 'design' AND id <> v_canonical_id);

  UPDATE public.colaborador_departamentos SET departamento_id = v_canonical_id
    WHERE departamento_id IN (SELECT id FROM public.parametros WHERE categoria = 'departamento' AND valor = 'design' AND id <> v_canonical_id);

  UPDATE public.convites_cadastro SET departamento_id = v_canonical_id
    WHERE departamento_id IN (SELECT id FROM public.parametros WHERE categoria = 'departamento' AND valor = 'design' AND id <> v_canonical_id);

  DELETE FROM public.parametros
  WHERE categoria = 'departamento' AND valor = 'design' AND id <> v_canonical_id;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Estado DEPOIS do fix:';
  RAISE NOTICE '========================================';
  FOR rec IN
    SELECT id, label, pai_valor, ativo, perfil_area_codigo
    FROM public.parametros
    WHERE categoria = 'departamento' AND valor = 'design'
  LOOP
    RAISE NOTICE 'id=% | label=% | pai=% | ativo=% | perfil=%',
      rec.id, rec.label, rec.pai_valor, rec.ativo, rec.perfil_area_codigo;
  END LOOP;
END $$;