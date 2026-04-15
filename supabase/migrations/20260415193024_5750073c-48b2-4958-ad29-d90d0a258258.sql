CREATE UNIQUE INDEX IF NOT EXISTS vagas_no_duplicate
ON public.vagas (lower(titulo), tipo_contrato, gestor_id)
WHERE status IN ('rascunho', 'aberta', 'em_selecao')
  AND gestor_id IS NOT NULL;