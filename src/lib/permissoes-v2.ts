import type { NivelHierarquico, AtribuicaoDetalhada } from "@/types/permissoes-v2";
import { NIVEL_RANK_V2 } from "@/types/permissoes-v2";

export function nivelAtendeMinimo(
  nivelUsuario: NivelHierarquico | null,
  nivelMinimo: NivelHierarquico | null
): boolean {
  if (!nivelMinimo) return true;
  if (!nivelUsuario) return false;
  return NIVEL_RANK_V2[nivelUsuario] >= NIVEL_RANK_V2[nivelMinimo];
}

export function formatarAtribuicao(at: AtribuicaoDetalhada): string {
  if (at.perfil_tipo === "transversal") {
    return at.perfil_nome;
  }
  const partes = [at.perfil_nome];
  if (at.nivel) partes.push(at.nivel);
  if (at.unidade_nome) partes.push(`em ${at.unidade_nome}`);
  return partes.join(" · ");
}

export function agruparAtribuicoesPorTipo(atribuicoes: AtribuicaoDetalhada[]) {
  const transversais = atribuicoes.filter((a) => a.perfil_tipo === "transversal");
  const areas = atribuicoes.filter((a) => a.perfil_tipo === "area");
  return { transversais, areas };
}

export function temAtribuicaoAtiva(atribuicoes: AtribuicaoDetalhada[], perfilCodigo: string): boolean {
  return atribuicoes.some((a) => a.perfil_codigo === perfilCodigo);
}
