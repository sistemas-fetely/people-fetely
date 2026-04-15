
ALTER TABLE public.candidato_historico
  ADD COLUMN IF NOT EXISTS vaga_id UUID REFERENCES public.vagas(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS justificativa TEXT,
  ADD COLUMN IF NOT EXISTS score_no_momento NUMERIC;
