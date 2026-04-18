CREATE TABLE IF NOT EXISTS public.fala_fetely_memoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('decisao', 'preferencia', 'fato', 'contexto_pessoal')),
  resumo TEXT NOT NULL,
  conteudo_completo TEXT,
  mensagem_origem_id UUID REFERENCES public.fala_fetely_mensagens(id) ON DELETE SET NULL,
  conversa_origem_id UUID REFERENCES public.fala_fetely_conversas(id) ON DELETE SET NULL,
  relevancia INTEGER NOT NULL DEFAULT 5 CHECK (relevancia BETWEEN 1 AND 10),
  ativo BOOLEAN NOT NULL DEFAULT true,
  origem TEXT NOT NULL DEFAULT 'ia_automatica' CHECK (origem IN ('ia_automatica', 'manual')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultimo_uso TIMESTAMPTZ
);

ALTER TABLE public.fala_fetely_memoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario gerencia propria memoria" ON public.fala_fetely_memoria
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admin ve toda memoria" ON public.fala_fetely_memoria
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_memoria_user_ativo ON public.fala_fetely_memoria(user_id, ativo);
CREATE INDEX IF NOT EXISTS idx_memoria_tipo ON public.fala_fetely_memoria(tipo);
CREATE INDEX IF NOT EXISTS idx_memoria_relevancia ON public.fala_fetely_memoria(relevancia DESC);

ALTER TABLE public.fala_fetely_conversas ADD COLUMN IF NOT EXISTS memorias_extraidas BOOLEAN NOT NULL DEFAULT false;

CREATE TRIGGER update_fala_fetely_memoria_updated_at
  BEFORE UPDATE ON public.fala_fetely_memoria
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();