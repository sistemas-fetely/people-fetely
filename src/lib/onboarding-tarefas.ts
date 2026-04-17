import type { Database } from "@/integrations/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface TarefaTemplate {
  titulo: string;
  descricao?: string | null;
  responsavel_role: AppRole | string;
  prazo_dias: number;
  somente_clt?: boolean;
  sistema_origem?: string | null;
  area_destino?: string | null;
  prioridade?: string | null;
  link_acao?: string | null;
  bloqueante?: boolean | null;
  motivo_bloqueio?: string | null;
  accountable_role?: string | null;
}

export interface ProvisionamentoData {
  email_corporativo?: boolean;
  email_corporativo_formato?: string;
  celular_corporativo?: boolean;
  sistemas_ids?: string[];
  equipamentos?: { tipo: string; quantidade: number }[];
}

/**
 * Lê as tarefas do template_base do processo de onboarding (do banco) e compõe
 * com tarefas dinâmicas de provisionamento (email/celular/sistemas/equipamentos).
 *
 * IMPORTANTE: a partir desta versão, as tarefas padrão vivem em
 * `sncf_templates_tarefas` e podem ser editadas em /processos/onboarding.
 */
export async function getTarefasDinamicas(
  tipo: "clt" | "pj",
  provisionamento: ProvisionamentoData | undefined,
  supabase: SupabaseClient<Database>,
): Promise<TarefaTemplate[]> {
  if (!supabase) throw new Error("Supabase client requerido");

  const tarefas: TarefaTemplate[] = [];

  // 1. Categoria 'onboarding'
  const { data: categoria } = await supabase
    .from("sncf_processos_categorias" as any)
    .select("id")
    .eq("slug", "onboarding")
    .maybeSingle();

  const categoriaId = (categoria as any)?.id as string | undefined;
  if (!categoriaId) return [];

  // 2. Template base + tarefas padrão
  const { data: template } = await supabase
    .from("sncf_templates_processos" as any)
    .select("id")
    .eq("categoria_id", categoriaId)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  const templateId = (template as any)?.id as string | undefined;

  if (templateId) {
    const { data: tarefasBase } = await supabase
      .from("sncf_templates_tarefas" as any)
      .select("*")
      .eq("template_id", templateId)
      .order("ordem");

    ((tarefasBase as any[]) ?? []).forEach((t: any) => {
      if (t.somente_clt && tipo !== "clt") return;
      tarefas.push({
        titulo: t.titulo,
        descricao: t.descricao,
        responsavel_role: t.responsavel_role,
        accountable_role: t.accountable_role,
        prazo_dias: t.prazo_dias ?? 0,
        sistema_origem: t.sistema_origem,
        area_destino: t.area_destino,
        prioridade: t.prioridade,
        bloqueante: t.bloqueante,
        motivo_bloqueio: t.motivo_bloqueio,
      });
    });
  }

  if (!provisionamento) {
    return tarefas.sort((a, b) => a.prazo_dias - b.prazo_dias);
  }

  // 3. Email corporativo
  if (provisionamento.email_corporativo) {
    tarefas.push({
      titulo: `Criar e-mail corporativo${provisionamento.email_corporativo_formato ? `: ${provisionamento.email_corporativo_formato}` : ""}`,
      descricao: "Criar conta de e-mail corporativo no Google Workspace ou provedor da empresa.",
      responsavel_role: "admin_rh",
      prazo_dias: -2,
      sistema_origem: "ti",
      area_destino: "TI",
      accountable_role: "admin_rh",
    });
  }

  // 4. Celular corporativo
  if (provisionamento.celular_corporativo) {
    tarefas.push({
      titulo: "Providenciar celular corporativo (aparelho + linha)",
      descricao: "Solicitar aparelho e ativar linha telefônica corporativa.",
      responsavel_role: "admin_rh",
      prazo_dias: -2,
      sistema_origem: "ti",
      area_destino: "TI",
      accountable_role: "admin_rh",
    });
  }

  // 5. Sistemas — buscar personalizações
  if (provisionamento.sistemas_ids && provisionamento.sistemas_ids.length > 0) {
    const idxGenerico = tarefas.findIndex((t) => t.titulo === "Criar acessos nos sistemas");
    if (idxGenerico !== -1) tarefas.splice(idxGenerico, 1);

    const { data: extensoes } = await supabase
      .from("sncf_template_extensoes" as any)
      .select(
        `id,
         sncf_template_extensoes_tarefas (
           titulo, descricao, area_destino, sistema_origem,
           responsavel_role, accountable_role, prazo_dias,
           prioridade, bloqueante, motivo_bloqueio
         )`,
      )
      .eq("categoria_id", categoriaId)
      .eq("dimensao", "sistema")
      .eq("ativo", true)
      .in("referencia_id", provisionamento.sistemas_ids);

    ((extensoes as any[]) ?? []).forEach((ext: any) => {
      (ext.sncf_template_extensoes_tarefas ?? []).forEach((t: any) => {
        tarefas.push({
          titulo: t.titulo,
          descricao: t.descricao,
          area_destino: t.area_destino,
          sistema_origem: t.sistema_origem,
          responsavel_role: t.responsavel_role,
          accountable_role: t.accountable_role,
          prazo_dias: t.prazo_dias ?? 0,
          prioridade: t.prioridade,
          bloqueante: t.bloqueante,
          motivo_bloqueio: t.motivo_bloqueio,
        });
      });
    });
  }

  // 6. Equipamentos
  if (provisionamento.equipamentos && provisionamento.equipamentos.length > 0) {
    const idxGenerico = tarefas.findIndex((t) => t.titulo === "Entregar equipamentos");
    if (idxGenerico !== -1) tarefas.splice(idxGenerico, 1);

    for (const eq of provisionamento.equipamentos) {
      const qtd = eq.quantidade > 1 ? ` (${eq.quantidade}x)` : "";
      tarefas.push({
        titulo: `Preparar e entregar: ${eq.tipo}${qtd}`,
        descricao: `Separar, configurar e preparar ${eq.tipo} para entrega no primeiro dia.`,
        responsavel_role: "admin_rh",
        prazo_dias: -2,
        sistema_origem: "ti",
        area_destino: "TI",
        accountable_role: "admin_rh",
      });
    }
  }

  return tarefas.sort((a, b) => a.prazo_dias - b.prazo_dias);
}

/**
 * Wrapper de conveniência para casos onde não há provisionamento — apenas
 * lê as tarefas padrão do template do banco filtrando por tipo.
 */
export async function getTarefasParaTipo(
  tipo: "clt" | "pj",
  supabase: SupabaseClient<Database>,
): Promise<TarefaTemplate[]> {
  return getTarefasDinamicas(tipo, undefined, supabase);
}
