
ALTER TABLE public.vagas 
ADD COLUMN IF NOT EXISTS beneficios_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS beneficios_outros TEXT;
