-- Limpa seeds antigos para reaplicar com a nova estrutura de módulos e níveis
DELETE FROM public.role_permissions
WHERE role_name IN (
  'admin_rh','gestor_rh','gestor_direto','financeiro','colaborador',
  'rh','ti','administrativo','operacional','fiscal','recrutamento','gestao_direta','estagiario',
  'recrutador','super_admin'
);

-- Função auxiliar temporária pra simplificar o seed
CREATE OR REPLACE FUNCTION public.seed_perm(
  _role TEXT, _module TEXT, _perm TEXT, _granted BOOLEAN DEFAULT true, _nivel_min TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE SQL
SET search_path = public
AS $$
  INSERT INTO public.role_permissions (role_name, module, permission, granted, colaborador_tipo, nivel_minimo)
  VALUES (
    _role::app_role, _module, _perm, _granted, 'all',
    CASE WHEN _nivel_min IS NULL THEN NULL ELSE _nivel_min::nivel_cargo END
  )
  ON CONFLICT (role_name, module, permission, colaborador_tipo)
  DO UPDATE SET granted = EXCLUDED.granted, nivel_minimo = EXCLUDED.nivel_minimo;
$$;

-- ============= ADMIN_RH (legado) =============
SELECT public.seed_perm('admin_rh', m, p)
FROM unnest(ARRAY['dashboard','tarefas','tarefas_time','fala_fetely','conhecimento_fetely','memorias_fetely','importacao_pdf','sugestoes_conhecimento','pessoas','colaboradores','contratos_pj','organograma','onboarding','ferias','beneficios','movimentacoes','recrutamento','avaliacoes','treinamentos','processos','convites','parametros','usuarios','relatorios']) m
CROSS JOIN unnest(ARRAY['view','create','edit','delete']) p;

SELECT public.seed_perm('admin_rh', m, p)
FROM unnest(ARRAY['folha_pagamento','notas_fiscais','pagamentos_pj','cargos']) m
CROSS JOIN unnest(ARRAY['view','create','edit']) p;

SELECT public.seed_perm('admin_rh', m, 'view') FROM unnest(ARRAY['ti_ativos','documentacao']) m;

-- ============= RH (nova) — granular por nível =============
SELECT public.seed_perm('rh', m, 'view')
FROM unnest(ARRAY['dashboard','tarefas','tarefas_time','fala_fetely','conhecimento_fetely','importacao_pdf','sugestoes_conhecimento','pessoas','colaboradores','contratos_pj','organograma','onboarding','ferias','beneficios','movimentacoes','recrutamento','avaliacoes','treinamentos','processos','convites','relatorios']) m;

SELECT public.seed_perm('rh', m, p, true, 'assistente')
FROM unnest(ARRAY['pessoas','colaboradores','contratos_pj','ferias','beneficios','movimentacoes','convites','onboarding']) m
CROSS JOIN unnest(ARRAY['create','edit']) p;

SELECT public.seed_perm('rh', m, 'edit', true, 'analista')
FROM unnest(ARRAY['conhecimento_fetely','processos','recrutamento','avaliacoes','treinamentos']) m;

SELECT public.seed_perm('rh', m, 'create', true, 'analista')
FROM unnest(ARRAY['conhecimento_fetely','processos']) m;

SELECT public.seed_perm('rh', m, 'delete', true, 'coordenador')
FROM unnest(ARRAY['pessoas','colaboradores','contratos_pj','conhecimento_fetely','processos']) m;

SELECT public.seed_perm('rh', 'parametros', 'view', true, 'coordenador');
SELECT public.seed_perm('rh', 'parametros', 'edit', true, 'gerente');
SELECT public.seed_perm('rh', 'usuarios', 'view', true, 'coordenador');
SELECT public.seed_perm('rh', 'usuarios', 'edit', true, 'gerente');

-- ============= GESTOR_RH (legado) =============
SELECT public.seed_perm('gestor_rh', m, p)
FROM unnest(ARRAY['dashboard','tarefas','tarefas_time','fala_fetely','conhecimento_fetely','importacao_pdf','sugestoes_conhecimento','pessoas','colaboradores','contratos_pj','organograma','onboarding','ferias','beneficios','movimentacoes','recrutamento','convites','processos']) m
CROSS JOIN unnest(ARRAY['view','create','edit']) p;

SELECT public.seed_perm('gestor_rh', m, 'view')
FROM unnest(ARRAY['avaliacoes','treinamentos','relatorios','notas_fiscais','pagamentos_pj']) m;

-- ============= GESTOR_DIRETO (legado) =============
SELECT public.seed_perm('gestor_direto', m, 'view')
FROM unnest(ARRAY['dashboard','tarefas','tarefas_time','fala_fetely','conhecimento_fetely','pessoas','organograma','onboarding','ferias','avaliacoes','treinamentos']) m;

SELECT public.seed_perm('gestor_direto', 'ferias', 'aprovar');
SELECT public.seed_perm('gestor_direto', 'conhecimento_fetely', 'create');
SELECT public.seed_perm('gestor_direto', 'tarefas', p) FROM unnest(ARRAY['create','edit']) p;

-- ============= GESTAO_DIRETA (nova) =============
SELECT public.seed_perm('gestao_direta', m, 'view')
FROM unnest(ARRAY['dashboard','tarefas','tarefas_time','fala_fetely','conhecimento_fetely','pessoas','organograma','onboarding','ferias','avaliacoes','treinamentos']) m;

SELECT public.seed_perm('gestao_direta', 'ferias', 'aprovar', true, 'coordenador');
SELECT public.seed_perm('gestao_direta', 'conhecimento_fetely', 'create');
SELECT public.seed_perm('gestao_direta', m, 'edit', true, 'coordenador') FROM unnest(ARRAY['tarefas','onboarding']) m;

-- ============= FINANCEIRO =============
SELECT public.seed_perm('financeiro', m, 'view')
FROM unnest(ARRAY['dashboard','tarefas','fala_fetely','conhecimento_fetely','pessoas','colaboradores','contratos_pj','folha_pagamento','notas_fiscais','pagamentos_pj','relatorios']) m;

SELECT public.seed_perm('financeiro', m, p, true, 'assistente')
FROM unnest(ARRAY['folha_pagamento','notas_fiscais','pagamentos_pj']) m
CROSS JOIN unnest(ARRAY['create','edit']) p;

SELECT public.seed_perm('financeiro', 'notas_fiscais', 'aprovar', true, 'analista');
SELECT public.seed_perm('financeiro', 'notas_fiscais', 'enviar_email', true, 'analista');
SELECT public.seed_perm('financeiro', 'folha_pagamento', 'fechar', true, 'coordenador');
SELECT public.seed_perm('financeiro', 'folha_pagamento', 'exportar', true, 'analista');
SELECT public.seed_perm('financeiro', 'cargos', 'view', true, 'gerente');

-- ============= ADMINISTRATIVO =============
SELECT public.seed_perm('administrativo', m, 'view')
FROM unnest(ARRAY['dashboard','tarefas','fala_fetely','conhecimento_fetely','pessoas','organograma','processos','parametros']) m;

SELECT public.seed_perm('administrativo', m, p, true, 'assistente')
FROM unnest(ARRAY['tarefas','processos']) m
CROSS JOIN unnest(ARRAY['create','edit']) p;

SELECT public.seed_perm('administrativo', 'processos', 'delete', true, 'coordenador');
SELECT public.seed_perm('administrativo', 'parametros', 'edit', true, 'gerente');

-- ============= TI =============
SELECT public.seed_perm('ti', m, 'view')
FROM unnest(ARRAY['dashboard','tarefas','fala_fetely','conhecimento_fetely','ti_ativos','documentacao','usuarios','parametros','processos']) m;

SELECT public.seed_perm('ti', m, p, true, 'assistente')
FROM unnest(ARRAY['ti_ativos']) m CROSS JOIN unnest(ARRAY['create','edit']) p;

SELECT public.seed_perm('ti', m, p, true, 'analista')
FROM unnest(ARRAY['documentacao']) m CROSS JOIN unnest(ARRAY['create','edit']) p;

SELECT public.seed_perm('ti', 'usuarios', 'create', true, 'coordenador');
SELECT public.seed_perm('ti', 'usuarios', 'edit', true, 'coordenador');
SELECT public.seed_perm('ti', 'ti_ativos', 'delete', true, 'coordenador');

-- ============= OPERACIONAL =============
SELECT public.seed_perm('operacional', m, 'view')
FROM unnest(ARRAY['dashboard','tarefas','tarefas_time','fala_fetely','conhecimento_fetely','pessoas','organograma','onboarding','ferias','movimentacoes','treinamentos','relatorios']) m;

SELECT public.seed_perm('operacional', m, p, true, 'assistente')
FROM unnest(ARRAY['tarefas']) m CROSS JOIN unnest(ARRAY['create','edit']) p;

SELECT public.seed_perm('operacional', 'ferias', 'aprovar', true, 'coordenador');
SELECT public.seed_perm('operacional', 'movimentacoes', 'create', true, 'coordenador');
SELECT public.seed_perm('operacional', 'movimentacoes', 'edit', true, 'coordenador');
SELECT public.seed_perm('operacional', 'relatorios', 'exportar', true, 'gerente');

-- ============= FISCAL =============
SELECT public.seed_perm('fiscal', m, 'view')
FROM unnest(ARRAY['dashboard','tarefas','fala_fetely','conhecimento_fetely','folha_pagamento','notas_fiscais','pagamentos_pj','relatorios']) m;

SELECT public.seed_perm('fiscal', m, 'exportar', true, 'analista')
FROM unnest(ARRAY['folha_pagamento','notas_fiscais','relatorios']) m;

-- ============= RECRUTAMENTO =============
SELECT public.seed_perm('recrutamento', m, 'view')
FROM unnest(ARRAY['dashboard','tarefas','fala_fetely','conhecimento_fetely','pessoas','organograma','recrutamento']) m;

SELECT public.seed_perm('recrutamento', 'recrutamento', p, true, 'assistente')
FROM unnest(ARRAY['create','edit']) p;

SELECT public.seed_perm('recrutamento', 'recrutamento', 'delete', true, 'coordenador');

-- ============= RECRUTADOR (legado) =============
SELECT public.seed_perm('recrutador', m, 'view')
FROM unnest(ARRAY['dashboard','tarefas','fala_fetely','conhecimento_fetely','pessoas','organograma','recrutamento']) m;

SELECT public.seed_perm('recrutador', 'recrutamento', p) FROM unnest(ARRAY['create','edit']) p;

-- ============= ESTAGIARIO =============
SELECT public.seed_perm('estagiario', m, 'view')
FROM unnest(ARRAY['dashboard','tarefas','fala_fetely','conhecimento_fetely','pessoas','organograma','onboarding']) m;

SELECT public.seed_perm('estagiario', 'tarefas', p) FROM unnest(ARRAY['create','edit']) p;

-- ============= COLABORADOR =============
SELECT public.seed_perm('colaborador', m, 'view')
FROM unnest(ARRAY['dashboard','tarefas','fala_fetely','conhecimento_fetely','memorias_fetely']) m;

SELECT public.seed_perm('colaborador', 'tarefas', p) FROM unnest(ARRAY['create','edit']) p;
SELECT public.seed_perm('colaborador', 'memorias_fetely', p) FROM unnest(ARRAY['create','edit','delete']) p;

-- ============= SUPER_ADMIN — espelha tudo (bypass também no código) =============
SELECT public.seed_perm('super_admin', m, p)
FROM unnest(ARRAY['dashboard','tarefas','tarefas_time','fala_fetely','conhecimento_fetely','memorias_fetely','importacao_pdf','sugestoes_conhecimento','pessoas','colaboradores','contratos_pj','organograma','onboarding','ferias','beneficios','movimentacoes','recrutamento','avaliacoes','treinamentos','folha_pagamento','notas_fiscais','pagamentos_pj','cargos','ti_ativos','documentacao','processos','convites','parametros','usuarios','relatorios']) m
CROSS JOIN unnest(ARRAY['view','create','edit','delete']) p;

-- Limpa função auxiliar
DROP FUNCTION IF EXISTS public.seed_perm(TEXT, TEXT, TEXT, BOOLEAN, TEXT);