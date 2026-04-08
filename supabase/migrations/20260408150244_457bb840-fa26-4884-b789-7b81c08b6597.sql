
-- Tabela de competências mensais
CREATE TABLE public.folha_competencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competencia TEXT NOT NULL UNIQUE, -- formato "2026-04"
  status TEXT NOT NULL DEFAULT 'aberta', -- aberta, calculada, fechada
  total_bruto NUMERIC DEFAULT 0,
  total_liquido NUMERIC DEFAULT 0,
  total_encargos NUMERIC DEFAULT 0,
  total_colaboradores INTEGER DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.folha_competencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin HR Fin can manage folha_competencias"
  ON public.folha_competencias FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'gestor_rh'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'gestor_rh'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role));

CREATE TRIGGER update_folha_competencias_updated_at
  BEFORE UPDATE ON public.folha_competencias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de holerites (um por colaborador por competência)
CREATE TABLE public.holerites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competencia_id UUID NOT NULL REFERENCES public.folha_competencias(id) ON DELETE CASCADE,
  colaborador_id UUID NOT NULL REFERENCES public.colaboradores_clt(id) ON DELETE CASCADE,
  salario_base NUMERIC NOT NULL DEFAULT 0,
  -- Proventos
  horas_extras_50 NUMERIC DEFAULT 0,
  horas_extras_100 NUMERIC DEFAULT 0,
  adicional_noturno NUMERIC DEFAULT 0,
  outros_proventos NUMERIC DEFAULT 0,
  -- Descontos
  inss NUMERIC DEFAULT 0,
  irrf NUMERIC DEFAULT 0,
  vt_desconto NUMERIC DEFAULT 0,
  vr_desconto NUMERIC DEFAULT 0,
  plano_saude NUMERIC DEFAULT 0,
  faltas_desconto NUMERIC DEFAULT 0,
  outros_descontos NUMERIC DEFAULT 0,
  -- Encargos patronais
  fgts NUMERIC DEFAULT 0,
  inss_patronal NUMERIC DEFAULT 0,
  -- Totais
  total_proventos NUMERIC DEFAULT 0,
  total_descontos NUMERIC DEFAULT 0,
  salario_liquido NUMERIC DEFAULT 0,
  total_encargos NUMERIC DEFAULT 0,
  -- Referências de cálculo
  horas_extras_50_qtd NUMERIC DEFAULT 0,
  horas_extras_100_qtd NUMERIC DEFAULT 0,
  faltas_dias NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(competencia_id, colaborador_id)
);

ALTER TABLE public.holerites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin HR Fin can manage holerites"
  ON public.holerites FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'gestor_rh'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'gestor_rh'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role));

CREATE POLICY "Colaborador can view own holerites"
  ON public.holerites FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM colaboradores_clt c
    WHERE c.id = holerites.colaborador_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Gestor direto can view holerites"
  ON public.holerites FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'gestor_direto'::app_role));

CREATE TRIGGER update_holerites_updated_at
  BEFORE UPDATE ON public.holerites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
