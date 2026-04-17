import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2, AlertTriangle, Clock, Users, Briefcase,
  ClipboardCheck, Mail, FileSignature,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardData } from "@/hooks/useDashboardData";
import InsightsIA from "./InsightsIA";

type AlertaPrioridade = "alta" | "media" | "baixa";
interface AlertaItem {
  id: string;
  titulo: string;
  detalhe: string;
  prioridade: AlertaPrioridade;
  rota?: string;
}

interface KpiItem {
  label: string;
  valor: number;
  icone: React.ElementType;
  cor: string;
  rota?: string;
}

interface VelocidadeItem {
  label: string;
  valor: string;
  icone: React.ElementType;
  detalhe?: string;
}

export function DashboardOperacional() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KpiItem[]>([]);
  const [velocidade, setVelocidade] = useState<VelocidadeItem[]>([]);
  const [tarefasLegaisAtrasadas, setTarefasLegaisAtrasadas] = useState<{ nome: string }[]>([]);
  // Métricas brutas para o card de Insights IA
  const [insightsData, setInsightsData] = useState({
    convitesPendentes: 0,
    onboardingsAtrasados: 0,
    vagasAbertas: 0,
    candidatosTriagem: 0,
    contratosVencendo: 0,
    tarefasBloqueantes: 0,
    tempoMedioContratacao: 0,
  });

  const dashData = useDashboardData();

  const alertas = useMemo<AlertaItem[]>(() => {
    const list: AlertaItem[] = [];
    const { pj, ferias, nfPendentes, pagPjPendentes, folha, experienciaVencendo, docsVencendo, aniversariosEmpresa, semBeneficio, contratosPendentes } = dashData;

    // Tarefa legal de onboarding atrasada (CRÍTICO)
    tarefasLegaisAtrasadas.forEach((t, i) => {
      list.push({
        id: `legal-onb-${i}`,
        titulo: `Tarefa legal atrasada no onboarding de ${t.nome}`,
        detalhe: "Prazo legal ultrapassado — risco de multa",
        prioridade: "alta",
        rota: "/onboarding",
      });
    });

    if (ferias?.periodoVencido > 0) {
      list.push({ id: "ferias-venc", titulo: `${ferias.periodoVencido} período(s) de férias vencido(s)`, detalhe: "Saldo pendente", prioridade: "alta", rota: "/ferias" });
    }
    if (pj?.vencendo > 0) {
      list.push({ id: "pj-venc", titulo: `${pj.vencendo} contrato(s) PJ vencendo`, detalhe: "Próximos 30 dias", prioridade: "alta", rota: "/contratos-pj" });
    }
    (experienciaVencendo || []).forEach((e: any, i: number) => {
      list.push({
        id: `exp-${i}`,
        titulo: `${e.nome} — experiência ${e.marco} dias`,
        detalhe: e.diasRestantes > 0 ? `${e.diasRestantes} dia(s) restante(s) · ${e.depto}` : `Vence hoje · ${e.depto}`,
        prioridade: "alta",
        rota: "/colaboradores",
      });
    });
    (docsVencendo || []).forEach((d: any, i: number) => {
      list.push({
        id: `doc-${i}`,
        titulo: `${d.documento} de ${d.nome} ${d.vencido ? "vencida" : "vencendo"}`,
        detalhe: `Validade: ${new Date(d.validade + "T00:00:00").toLocaleDateString("pt-BR")} · ${d.depto}`,
        prioridade: d.vencido ? "alta" : "media",
        rota: "/colaboradores",
      });
    });
    if (contratosPendentes && contratosPendentes.length > 0) {
      list.push({
        id: "contratos-pend",
        titulo: `${contratosPendentes.length} contrato(s) PJ pendente(s) de assinatura`,
        detalhe: contratosPendentes.slice(0, 3).map((c: any) => c.nome).join(", ") + (contratosPendentes.length > 3 ? "..." : ""),
        prioridade: "alta",
        rota: "/contratos-pj",
      });
    }
    if (semBeneficio && semBeneficio.length > 0) {
      list.push({
        id: "sem-benef",
        titulo: `${semBeneficio.length} colaborador(es) sem benefícios`,
        detalhe: semBeneficio.slice(0, 3).map((s: any) => s.nome).join(", ") + (semBeneficio.length > 3 ? "..." : ""),
        prioridade: "media",
        rota: "/beneficios",
      });
    }
    if (folha?.atual && folha.atual.status === "aberta") {
      list.push({ id: "folha", titulo: `Folha ${folha.atual.competencia} em aberto`, detalhe: "Fechar folha", prioridade: "media", rota: "/folha-pagamento" });
    }
    if (nfPendentes > 0) {
      list.push({ id: "nf", titulo: `${nfPendentes} nota(s) fiscal(is) pendente(s)`, detalhe: "Aguardando processamento", prioridade: "media", rota: "/notas-fiscais" });
    }
    if (pagPjPendentes > 0) {
      list.push({ id: "pag-pj", titulo: `${pagPjPendentes} pagamento(s) PJ pendente(s)`, detalhe: "Aguardando pagamento", prioridade: "media", rota: "/pagamentos-pj" });
    }
    (aniversariosEmpresa || []).forEach((a: any, i: number) => {
      list.push({ id: `aniv-${i}`, titulo: `${a.nome} completa ${a.anos} ano(s) de empresa`, detalhe: `${a.data} · ${a.depto}`, prioridade: "baixa" });
    });

    const order = { alta: 0, media: 1, baixa: 2 };
    list.sort((a, b) => order[a.prioridade] - order[b.prioridade]);
    return list;
  }, [dashData, tarefasLegaisAtrasadas]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const hoje = new Date();
        const em30d = new Date();
        em30d.setDate(em30d.getDate() + 30);
        const hojeStr = hoje.toISOString().slice(0, 10);
        const em30dStr = em30d.toISOString().slice(0, 10);

        const [
          convitesRes,
          tarefasRes,
          vagasRes,
          candidatosRes,
          contratosVencRes,
        ] = await Promise.all([
          supabase
            .from("convites_cadastro")
            .select("id, nome, status, tipo, created_at, preenchido_em, updated_at"),
          supabase
            .from("sncf_tarefas")
            .select("id, titulo, status, prazo_data, processo_id, bloqueante")
            .eq("tipo_processo", "onboarding")
            .in("status", ["pendente", "atrasada"]),
          supabase
            .from("vagas" as any)
            .select("id, titulo, status, created_at")
            .eq("status", "aberta"),
          supabase
            .from("candidatos")
            .select("id, nome, status, created_at")
            .in("status", ["recebido", "triagem", "entrevista"]),
          supabase
            .from("contratos_pj")
            .select("id, contato_nome, razao_social, data_fim, status")
            .eq("status", "ativo")
            .not("data_fim", "is", null)
            .gte("data_fim", hojeStr)
            .lte("data_fim", em30dStr),
        ]);

        if (cancelled) return;

        const convites = convitesRes.data || [];
        const tarefasOnb = tarefasRes.data || [];
        const vagas = (vagasRes.data || []) as any[];
        const candidatos = candidatosRes.data || [];
        const contratosVenc = contratosVencRes.data || [];

        // Tarefas legais bloqueantes atrasadas — para alertas críticos
        const tarefasAtrasadas = tarefasOnb.filter((t: any) => {
          if (t.status === "atrasada") return true;
          if (t.prazo_data && t.prazo_data < hojeStr) return true;
          return false;
        });
        const atrasadasBloqueantes = tarefasAtrasadas.filter((t: any) => t.bloqueante);

        if (atrasadasBloqueantes.length > 0) {
          const checklistIds = [...new Set(atrasadasBloqueantes.map((t: any) => t.processo_id).filter(Boolean))];
          if (checklistIds.length > 0) {
            const { data: cls } = await supabase
              .from("onboarding_checklists")
              .select("id, colaborador_id, colaborador_tipo")
              .in("id", checklistIds);
            const cltIds = (cls || []).filter((c: any) => c.colaborador_tipo === "clt" && c.colaborador_id).map((c: any) => c.colaborador_id);
            const pjIds = (cls || []).filter((c: any) => c.colaborador_tipo === "pj" && c.colaborador_id).map((c: any) => c.colaborador_id);
            const nomes: { nome: string }[] = [];
            if (cltIds.length > 0) {
              const { data } = await supabase.from("colaboradores_clt").select("id, nome_completo").in("id", cltIds);
              (data || []).forEach((c: any) => nomes.push({ nome: c.nome_completo }));
            }
            if (pjIds.length > 0) {
              const { data } = await supabase.from("contratos_pj").select("id, contato_nome").in("id", pjIds);
              (data || []).forEach((c: any) => nomes.push({ nome: c.contato_nome }));
            }
            if (!cancelled) setTarefasLegaisAtrasadas(nomes);
          }
        } else if (!cancelled) {
          setTarefasLegaisAtrasadas([]);
        }

        // ─── KPIs (só os com valor > 0) ───
        const novosKpis: KpiItem[] = [];
        const convitesPend = convites.filter((c) =>
          ["pendente", "email_enviado"].includes(c.status)
        ).length;
        const onbAndamento = tarefasOnb.length;
        const vagasAbertas = vagas.length;
        const candProcesso = candidatos.length;
        const contratosVencCount = contratosVenc.length;
        const candidatosNovos = candidatos.filter((c) => c.status === "recebido");

        if (convitesPend > 0)
          novosKpis.push({ label: "Convites pendentes", valor: convitesPend, icone: Mail, cor: "text-info", rota: "/convites-cadastro" });
        if (onbAndamento > 0)
          novosKpis.push({ label: "Onboardings em andamento", valor: onbAndamento, icone: ClipboardCheck, cor: "text-primary", rota: "/onboarding" });
        if (vagasAbertas > 0)
          novosKpis.push({ label: "Vagas abertas", valor: vagasAbertas, icone: Briefcase, cor: "text-warning", rota: "/recrutamento" });
        if (candProcesso > 0)
          novosKpis.push({ label: "Candidatos em processo", valor: candProcesso, icone: Users, cor: "text-info", rota: "/recrutamento" });
        if (contratosVencCount > 0)
          novosKpis.push({ label: "Contratos PJ vencendo (30d)", valor: contratosVencCount, icone: FileSignature, cor: "text-warning", rota: "/contratos-pj" });

        setKpis(novosKpis);

        // ─── Velocidade (só com 5+ registros) ───
        const novasVelocidades: VelocidadeItem[] = [];
        const convitesPreenchidosComData = convites.filter(
          (c) => c.preenchido_em && c.created_at
        );
        if (convitesPreenchidosComData.length >= 5) {
          const tempos = convitesPreenchidosComData.map((c) => {
            const ms = new Date(c.preenchido_em!).getTime() - new Date(c.created_at).getTime();
            return ms / (1000 * 60 * 60 * 24);
          });
          const medio = tempos.reduce((a, b) => a + b, 0) / tempos.length;
          novasVelocidades.push({
            label: "Tempo médio de preenchimento de convite",
            valor: `${medio.toFixed(1)} dias`,
            icone: Clock,
            detalhe: `Baseado em ${convitesPreenchidosComData.length} convites`,
          });
        }

        setVelocidade(novasVelocidades);

        // ─── Métricas para card Insights IA ───
        const tempoMedioContratacao =
          convitesPreenchidosComData.length >= 1
            ? Math.round(
                convitesPreenchidosComData.reduce((acc, c) => {
                  const ms = new Date(c.preenchido_em!).getTime() - new Date(c.created_at).getTime();
                  return acc + ms / (1000 * 60 * 60 * 24);
                }, 0) / convitesPreenchidosComData.length,
              )
            : 0;

        setInsightsData({
          convitesPendentes: convitesPend,
          onboardingsAtrasados: tarefasAtrasadas.length,
          vagasAbertas,
          candidatosTriagem: candidatosNovos.length,
          contratosVencendo: contratosVenc.length,
          tarefasBloqueantes: atrasadasBloqueantes.length,
          tempoMedioContratacao,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      {/* 1. Alertas — largura total no topo */}
      {alertas.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-2">
          Sem alertas no momento
        </p>
      ) : (
        <Card className="card-shadow animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 max-h-[480px] overflow-y-auto">
            {alertas.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg transition-colors",
                  a.rota && "hover:bg-muted/50 cursor-pointer"
                )}
                onClick={a.rota ? () => navigate(a.rota!) : undefined}
              >
                <div
                  className={cn(
                    "w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0",
                    a.prioridade === "alta" && "bg-red-500",
                    a.prioridade === "media" && "bg-yellow-500",
                    a.prioridade === "baixa" && "bg-emerald-500"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium">{a.titulo}</p>
                  <p className="text-sm text-muted-foreground">{a.detalhe}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 2. Insights IA — largura total */}
      <div className="w-full">
        <InsightsIA {...insightsData} />
      </div>

      {/* 3. Números do momento */}
      {kpis.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">
            Números do momento
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {kpis.map((kpi) => {
              const Icon = kpi.icone;
              return (
                <Card
                  key={kpi.label}
                  className={cn("card-shadow animate-fade-in", kpi.rota && "cursor-pointer hover:shadow-md transition-shadow")}
                  onClick={kpi.rota ? () => navigate(kpi.rota!) : undefined}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-2xl font-bold tracking-tight">{kpi.valor}</p>
                        <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
                      </div>
                      <Icon className={cn("h-5 w-5", kpi.cor)} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Velocidade */}
      {velocidade.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">
            Velocidade
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {velocidade.map((v) => {
              const Icon = v.icone;
              return (
                <Card key={v.label} className="card-shadow animate-fade-in">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold">{v.valor}</p>
                        <p className="text-xs text-muted-foreground">{v.label}</p>
                        {v.detalhe && (
                          <p className="text-xs text-muted-foreground/70 mt-0.5">{v.detalhe}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// CheckCircle2 mantido para compat (caso outros locais importem)
export { CheckCircle2 };
