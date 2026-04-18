-- ═══ MIGRATION 1: Audit Log Imutável ═══
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  user_nome TEXT,
  user_email TEXT,
  acao TEXT NOT NULL,
  tabela TEXT NOT NULL,
  registro_id TEXT,
  dados_antes JSONB,
  dados_depois JSONB,
  justificativa TEXT,
  ip_origem TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_tabela ON public.audit_log(tabela, registro_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_leitura_privilegiada" ON public.audit_log
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'fiscal')
  );

CREATE POLICY "audit_log_escrita_sistema" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.registrar_audit(
  _acao TEXT,
  _tabela TEXT,
  _registro_id TEXT,
  _dados_antes JSONB DEFAULT NULL,
  _dados_depois JSONB DEFAULT NULL,
  _justificativa TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_user_nome TEXT;
  v_user_email TEXT;
BEGIN
  SELECT p.full_name, NULL
    INTO v_user_nome, v_user_email
    FROM public.profiles p
    WHERE p.user_id = auth.uid();

  INSERT INTO public.audit_log (
    user_id, user_nome, user_email,
    acao, tabela, registro_id,
    dados_antes, dados_depois, justificativa
  ) VALUES (
    auth.uid(), v_user_nome, v_user_email,
    _acao, _tabela, _registro_id,
    _dados_antes, _dados_depois, _justificativa
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ═══ MIGRATION 2: Log de Acesso a Dados Sensíveis ═══
CREATE TABLE IF NOT EXISTS public.acesso_dados_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  user_nome TEXT,
  alvo_user_id UUID REFERENCES auth.users(id),
  alvo_nome TEXT,
  tipo_dado TEXT NOT NULL CHECK (tipo_dado IN (
    'salario','pro_labore','distribuicao_lucros',
    'avaliacao','holerite','nota_fiscal','pagamento_pj',
    'memoria_fala_fetely','documento_pessoal','dados_cadastrais',
    'cargo_salario','beneficio'
  )),
  tabela_origem TEXT,
  registro_id TEXT,
  contexto TEXT,
  ip_origem TEXT
);

CREATE INDEX IF NOT EXISTS idx_acesso_log_alvo ON public.acesso_dados_log(alvo_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_acesso_log_user ON public.acesso_dados_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_acesso_log_tipo ON public.acesso_dados_log(tipo_dado);

ALTER TABLE public.acesso_dados_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "titular_ve_quem_acessou" ON public.acesso_dados_log
  FOR SELECT TO authenticated
  USING (
    alvo_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "sistema_registra_acesso" ON public.acesso_dados_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.registrar_acesso_dado(
  _alvo_user_id UUID,
  _tipo_dado TEXT,
  _tabela_origem TEXT DEFAULT NULL,
  _registro_id TEXT DEFAULT NULL,
  _contexto TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_nome TEXT;
  v_alvo_nome TEXT;
BEGIN
  IF _alvo_user_id = auth.uid() THEN
    RETURN;
  END IF;

  SELECT p.full_name INTO v_user_nome FROM public.profiles p WHERE p.user_id = auth.uid();
  SELECT p.full_name INTO v_alvo_nome FROM public.profiles p WHERE p.user_id = _alvo_user_id;

  INSERT INTO public.acesso_dados_log (
    user_id, user_nome, alvo_user_id, alvo_nome,
    tipo_dado, tabela_origem, registro_id, contexto
  ) VALUES (
    auth.uid(), v_user_nome, _alvo_user_id, v_alvo_nome,
    _tipo_dado, _tabela_origem, _registro_id, _contexto
  );
END;
$$;

-- ═══ MIGRATION 3: Remunerações Segregadas por Natureza ═══
CREATE TABLE IF NOT EXISTS public.remuneracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  natureza TEXT NOT NULL CHECK (natureza IN (
    'salario_clt',
    'pro_labore',
    'distribuicao_lucros',
    'pagamento_pj',
    'bonus',
    'comissao'
  )),
  valor NUMERIC(12, 2) NOT NULL,
  moeda TEXT NOT NULL DEFAULT 'BRL',
  periodicidade TEXT NOT NULL DEFAULT 'mensal' CHECK (periodicidade IN ('mensal','anual','pontual')),
  data_vigencia_inicio DATE NOT NULL,
  data_vigencia_fim DATE,
  observacao TEXT,
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_remuneracoes_user ON public.remuneracoes(user_id);
CREATE INDEX IF NOT EXISTS idx_remuneracoes_natureza ON public.remuneracoes(natureza);
CREATE INDEX IF NOT EXISTS idx_remuneracoes_vigencia ON public.remuneracoes(data_vigencia_inicio, data_vigencia_fim);

ALTER TABLE public.remuneracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "titular_ve_propria_remuneracao" ON public.remuneracoes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "super_admin_ve_todas_remuneracoes" ON public.remuneracoes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "fiscal_ve_clt_e_pj" ON public.remuneracoes
  FOR SELECT TO authenticated
  USING (
    natureza IN ('salario_clt', 'pagamento_pj', 'bonus', 'comissao')
    AND (
      public.has_role(auth.uid(), 'fiscal')
      OR public.has_role_with_level(auth.uid(), 'financeiro', 'coordenador')
    )
  );

CREATE POLICY "admin_rh_ve_salario_clt_nao_super" ON public.remuneracoes
  FOR SELECT TO authenticated
  USING (
    natureza = 'salario_clt'
    AND (public.has_role(auth.uid(), 'admin_rh') OR public.has_role_with_level(auth.uid(), 'rh', 'coordenador'))
    AND NOT public.has_role(user_id, 'super_admin')
  );

CREATE POLICY "super_admin_gerencia_remuneracoes" ON public.remuneracoes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "fiscal_cria_remuneracoes_legais" ON public.remuneracoes
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'fiscal')
    AND natureza IN ('salario_clt','pagamento_pj','bonus','comissao')
  );

CREATE POLICY "fiscal_edita_remuneracoes_legais" ON public.remuneracoes
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'fiscal')
    AND natureza IN ('salario_clt','pagamento_pj','bonus','comissao')
  );

-- ═══ MIGRATION 4: Delegação Temporária de Gestor ═══
CREATE TABLE IF NOT EXISTS public.delegacoes_gestao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gestor_original_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  substituto_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  motivo TEXT NOT NULL CHECK (motivo IN ('ferias','afastamento_medico','viagem','outro')),
  observacao TEXT,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  ativa BOOLEAN NOT NULL DEFAULT true,
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (data_fim >= data_inicio),
  CHECK (gestor_original_id <> substituto_id)
);

CREATE INDEX IF NOT EXISTS idx_delegacoes_gestor ON public.delegacoes_gestao(gestor_original_id, ativa);
CREATE INDEX IF NOT EXISTS idx_delegacoes_substituto ON public.delegacoes_gestao(substituto_id, ativa);
CREATE INDEX IF NOT EXISTS idx_delegacoes_periodo ON public.delegacoes_gestao(data_inicio, data_fim);

ALTER TABLE public.delegacoes_gestao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "envolvidos_e_admin_veem_delegacao" ON public.delegacoes_gestao
  FOR SELECT TO authenticated
  USING (
    gestor_original_id = auth.uid()
    OR substituto_id = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin_rh')
    OR public.has_role_with_level(auth.uid(), 'rh', 'coordenador')
  );

CREATE POLICY "gestor_cria_propria_delegacao" ON public.delegacoes_gestao
  FOR INSERT TO authenticated
  WITH CHECK (
    gestor_original_id = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin_rh')
  );

CREATE POLICY "admin_gerencia_delegacao" ON public.delegacoes_gestao
  FOR UPDATE TO authenticated
  USING (
    gestor_original_id = auth.uid()
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin_rh')
  );

CREATE OR REPLACE FUNCTION public.delegacao_ativa_entre(_gestor UUID, _substituto UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.delegacoes_gestao
    WHERE gestor_original_id = _gestor
      AND substituto_id = _substituto
      AND ativa = true
      AND CURRENT_DATE BETWEEN data_inicio AND data_fim
  )
$$;

-- ═══ MIGRATION 5: Consentimento LGPD ═══
CREATE TABLE IF NOT EXISTS public.consentimentos_lgpd (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'fala_fetely_conversas',
    'fala_fetely_memorias',
    'analytics_comportamental',
    'notificacoes_email',
    'notificacoes_whatsapp'
  )),
  aceito BOOLEAN NOT NULL,
  texto_versao TEXT NOT NULL,
  ip_origem TEXT,
  user_agent TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  revogado_em TIMESTAMPTZ,
  UNIQUE (user_id, tipo, texto_versao)
);

CREATE INDEX IF NOT EXISTS idx_consent_user ON public.consentimentos_lgpd(user_id, tipo);

ALTER TABLE public.consentimentos_lgpd ENABLE ROW LEVEL SECURITY;

CREATE POLICY "titular_ve_proprio_consentimento" ON public.consentimentos_lgpd
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "titular_registra_proprio_consentimento" ON public.consentimentos_lgpd
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "titular_revoga_proprio_consentimento" ON public.consentimentos_lgpd
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.tem_consentimento_ativo(_user_id UUID, _tipo TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.consentimentos_lgpd
    WHERE user_id = _user_id
      AND tipo = _tipo
      AND aceito = true
      AND revogado_em IS NULL
  )
$$;

-- ═══ MIGRATION 6: Classificação de Dados ═══
CREATE TABLE IF NOT EXISTS public.classificacao_dados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela TEXT NOT NULL UNIQUE,
  politica TEXT NOT NULL CHECK (politica IN ('apagavel','anonimizavel','retencao_legal')),
  retencao_anos INTEGER,
  descricao TEXT,
  base_legal TEXT
);

INSERT INTO public.classificacao_dados (tabela, politica, retencao_anos, descricao, base_legal) VALUES
  ('colaboradores_clt', 'retencao_legal', 10, 'Dados essenciais CLT', 'CLT Art. 41 + FGTS 30 anos'),
  ('contratos_pj', 'retencao_legal', 5, 'Contratos PJ', 'Codigo Civil Art. 206'),
  ('holerites', 'retencao_legal', 10, 'Holerites CLT', 'CLT + obrigacoes previdenciarias'),
  ('folha_competencias', 'retencao_legal', 10, 'Folha de pagamento consolidada', 'CLT + eSocial'),
  ('notas_fiscais', 'retencao_legal', 5, 'NFs PJ', 'Receita Federal'),
  ('pagamentos_pj', 'retencao_legal', 5, 'Pagamentos PJ', 'Tributario'),
  ('convites_cadastro', 'retencao_legal', 5, 'Historico de admissoes', 'Admissional'),
  ('audit_log', 'retencao_legal', 5, 'Auditoria LGPD', 'LGPD'),
  ('acesso_dados_log', 'retencao_legal', 5, 'Log de acesso LGPD', 'LGPD'),
  ('consentimentos_lgpd', 'retencao_legal', 10, 'Base legal de consentimento', 'LGPD'),
  ('remuneracoes', 'retencao_legal', 10, 'Historico remuneratorio', 'CLT + Tributario'),
  ('dependentes', 'retencao_legal', 10, 'Dependentes para IR/beneficios', 'Tributario'),
  ('candidato_avaliacoes', 'anonimizavel', 1, 'Avaliacoes de candidatos (6 meses -> anonimiza)', 'LGPD Recrutamento'),
  ('candidato_notas', 'anonimizavel', 1, 'Notas de processos seletivos', 'LGPD Recrutamento'),
  ('fala_fetely_feedback', 'anonimizavel', 2, 'Feedback sobre IA (mantem, anonimiza)', 'Melhoria continua'),
  ('fala_fetely_conversas', 'apagavel', NULL, 'Conversas pessoais com IA', 'Dado comportamental'),
  ('fala_fetely_mensagens', 'apagavel', NULL, 'Mensagens das conversas', 'Dado comportamental'),
  ('fala_fetely_memoria', 'apagavel', NULL, 'Memorias extraidas pela IA', 'Dado comportamental'),
  ('fala_fetely_sugestoes_conhecimento', 'apagavel', NULL, 'Sugestoes enviadas', 'Dado comportamental')
ON CONFLICT (tabela) DO UPDATE SET
  politica = EXCLUDED.politica,
  retencao_anos = EXCLUDED.retencao_anos,
  descricao = EXCLUDED.descricao,
  base_legal = EXCLUDED.base_legal;

ALTER TABLE public.classificacao_dados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "classificacao_leitura_publica" ON public.classificacao_dados
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "classificacao_super_admin_gerencia" ON public.classificacao_dados
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- ═══ MIGRATION 7: Flag de desligamento ═══
ALTER TABLE public.colaboradores_clt
  ADD COLUMN IF NOT EXISTS acesso_revogado_em TIMESTAMPTZ;

ALTER TABLE public.contratos_pj
  ADD COLUMN IF NOT EXISTS acesso_revogado_em TIMESTAMPTZ;

COMMENT ON COLUMN public.colaboradores_clt.acesso_revogado_em IS
  'Preenchido quando passa 30 dias do desligamento. Apos isso, user_roles sao revogadas. Dados permanecem por retencao legal.';
COMMENT ON COLUMN public.contratos_pj.acesso_revogado_em IS
  'Preenchido quando passa 30 dias do desligamento. Apos isso, user_roles sao revogadas. Dados permanecem por retencao legal.';