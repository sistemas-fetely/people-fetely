
-- Acessos a sistemas para PJ
CREATE TABLE public.contrato_pj_acessos_sistemas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contrato_pj_id UUID NOT NULL REFERENCES public.contratos_pj(id) ON DELETE CASCADE,
  sistema TEXT NOT NULL,
  tem_acesso BOOLEAN NOT NULL DEFAULT false,
  usuario TEXT,
  observacoes TEXT,
  data_concessao DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contrato_pj_acessos_sistemas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin and HR can manage pj acessos"
  ON public.contrato_pj_acessos_sistemas FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'gestor_rh'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'gestor_rh'::app_role));

CREATE POLICY "Gestor direto can view pj acessos"
  ON public.contrato_pj_acessos_sistemas FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'gestor_direto'::app_role));

CREATE POLICY "Financeiro can view pj acessos"
  ON public.contrato_pj_acessos_sistemas FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'financeiro'::app_role));

CREATE TRIGGER update_contrato_pj_acessos_updated_at
  BEFORE UPDATE ON public.contrato_pj_acessos_sistemas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Equipamentos para PJ
CREATE TABLE public.contrato_pj_equipamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contrato_pj_id UUID NOT NULL REFERENCES public.contratos_pj(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  marca TEXT,
  modelo TEXT,
  numero_patrimonio TEXT,
  numero_serie TEXT,
  data_entrega DATE,
  data_devolucao DATE,
  estado TEXT NOT NULL DEFAULT 'novo',
  termo_responsabilidade_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contrato_pj_equipamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin and HR can manage pj equipamentos"
  ON public.contrato_pj_equipamentos FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'gestor_rh'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'gestor_rh'::app_role));

CREATE POLICY "Gestor direto can view pj equipamentos"
  ON public.contrato_pj_equipamentos FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'gestor_direto'::app_role));

CREATE POLICY "Financeiro can view pj equipamentos"
  ON public.contrato_pj_equipamentos FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'financeiro'::app_role));

CREATE TRIGGER update_contrato_pj_equipamentos_updated_at
  BEFORE UPDATE ON public.contrato_pj_equipamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
