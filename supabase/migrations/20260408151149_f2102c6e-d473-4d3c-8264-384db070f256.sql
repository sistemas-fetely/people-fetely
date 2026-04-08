
-- Períodos aquisitivos CLT
CREATE TABLE public.ferias_periodos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id UUID NOT NULL REFERENCES public.colaboradores_clt(id) ON DELETE CASCADE,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  dias_direito INTEGER NOT NULL DEFAULT 30,
  dias_gozados INTEGER NOT NULL DEFAULT 0,
  dias_vendidos INTEGER NOT NULL DEFAULT 0,
  saldo INTEGER GENERATED ALWAYS AS (dias_direito - dias_gozados - dias_vendidos) STORED,
  status TEXT NOT NULL DEFAULT 'em_aberto', -- em_aberto, parcial, completo, vencido, perdido
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ferias_periodos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin HR Fin can manage ferias_periodos"
  ON public.ferias_periodos FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'gestor_rh'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'gestor_rh'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role));

CREATE POLICY "Colaborador can view own ferias_periodos"
  ON public.ferias_periodos FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM colaboradores_clt c
    WHERE c.id = ferias_periodos.colaborador_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Gestor direto can view ferias_periodos"
  ON public.ferias_periodos FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'gestor_direto'::app_role));

CREATE TRIGGER update_ferias_periodos_updated_at
  BEFORE UPDATE ON public.ferias_periodos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Programações de férias CLT
CREATE TABLE public.ferias_programacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  periodo_id UUID NOT NULL REFERENCES public.ferias_periodos(id) ON DELETE CASCADE,
  colaborador_id UUID NOT NULL REFERENCES public.colaboradores_clt(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  dias INTEGER NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'gozo', -- gozo, abono_pecuniario
  status TEXT NOT NULL DEFAULT 'programada', -- programada, aprovada, em_gozo, concluida, cancelada
  aprovador_id UUID,
  data_aprovacao TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ferias_programacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin HR Fin can manage ferias_programacoes"
  ON public.ferias_programacoes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'gestor_rh'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'gestor_rh'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role));

CREATE POLICY "Colaborador can view own ferias_programacoes"
  ON public.ferias_programacoes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM colaboradores_clt c
    WHERE c.id = ferias_programacoes.colaborador_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Gestor direto can view ferias_programacoes"
  ON public.ferias_programacoes FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'gestor_direto'::app_role));

CREATE TRIGGER update_ferias_programacoes_updated_at
  BEFORE UPDATE ON public.ferias_programacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Férias/Recesso PJ
CREATE TABLE public.ferias_pj (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contrato_id UUID NOT NULL REFERENCES public.contratos_pj(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  dias INTEGER NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'recesso', -- recesso, ferias_contratual
  status TEXT NOT NULL DEFAULT 'programada', -- programada, aprovada, em_andamento, concluida, cancelada
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ferias_pj ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin HR Fin can manage ferias_pj"
  ON public.ferias_pj FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'gestor_rh'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'gestor_rh'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role));

CREATE POLICY "Gestor direto can view ferias_pj"
  ON public.ferias_pj FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'gestor_direto'::app_role));

CREATE TRIGGER update_ferias_pj_updated_at
  BEFORE UPDATE ON public.ferias_pj
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
