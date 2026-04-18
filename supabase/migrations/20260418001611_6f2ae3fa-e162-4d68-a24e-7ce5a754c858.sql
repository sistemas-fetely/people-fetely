-- Tabela de sugestões pendentes de aprovação
CREATE TABLE IF NOT EXISTS public.fala_fetely_sugestoes_conhecimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mensagem_id UUID REFERENCES public.fala_fetely_mensagens(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  pergunta_original TEXT,
  resposta_ia TEXT,
  correcao_sugerida TEXT NOT NULL,
  categoria_sugerida TEXT CHECK (categoria_sugerida IN ('politica', 'regra', 'diretriz', 'faq', 'conceito', 'manifesto', 'mercado') OR categoria_sugerida IS NULL),
  titulo_sugerido TEXT,
  origem TEXT NOT NULL DEFAULT 'ensinar' CHECK (origem IN ('ensinar', 'feedback_negativo')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada', 'convertida')),
  revisado_por UUID REFERENCES auth.users(id),
  revisado_em TIMESTAMPTZ,
  observacao_revisao TEXT,
  conhecimento_gerado_id UUID REFERENCES public.fala_fetely_conhecimento(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fala_fetely_sugestoes_conhecimento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario cria propria sugestao" ON public.fala_fetely_sugestoes_conhecimento 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuario le proprias sugestoes" ON public.fala_fetely_sugestoes_conhecimento 
  FOR SELECT TO authenticated 
  USING (
    user_id = auth.uid() 
    OR public.has_role(auth.uid(), 'super_admin') 
    OR public.has_role(auth.uid(), 'admin_rh')
  );

CREATE POLICY "Admin gerencia sugestoes" ON public.fala_fetely_sugestoes_conhecimento 
  FOR UPDATE TO authenticated 
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_rh'));

CREATE INDEX IF NOT EXISTS idx_sugestoes_status ON public.fala_fetely_sugestoes_conhecimento(status);
CREATE INDEX IF NOT EXISTS idx_sugestoes_origem ON public.fala_fetely_sugestoes_conhecimento(origem);

-- Enriquecer tabela de feedback
ALTER TABLE public.fala_fetely_feedback ADD COLUMN IF NOT EXISTS motivo TEXT 
  CHECK (motivo IN ('informacao_incorreta', 'incompleta', 'desatualizada', 'tom_inadequado', 'outro') OR motivo IS NULL);
ALTER TABLE public.fala_fetely_feedback ADD COLUMN IF NOT EXISTS resposta_esperada TEXT;