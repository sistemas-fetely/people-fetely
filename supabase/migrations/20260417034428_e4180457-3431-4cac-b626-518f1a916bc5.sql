
ALTER TABLE public.sncf_tarefas
ADD COLUMN IF NOT EXISTS bloqueante BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS motivo_bloqueio TEXT,
ADD COLUMN IF NOT EXISTS evidencia_texto TEXT,
ADD COLUMN IF NOT EXISTS evidencia_url TEXT;

UPDATE public.sncf_tarefas SET bloqueante = true, motivo_bloqueio = 'Prazo legal — obrigatório antes do primeiro dia'
WHERE tipo_processo = 'onboarding' AND (titulo ILIKE '%eSocial%' OR titulo ILIKE '%contrato%' OR titulo ILIKE '%assinar%' OR titulo ILIKE '%registro%');
