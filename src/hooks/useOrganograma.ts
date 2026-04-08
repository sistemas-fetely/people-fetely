import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PosicaoRaw, PosicaoNode, ColaboradorVinculado, ContratoPJVinculado } from "@/types/organograma";

function buildTree(posicoes: PosicaoRaw[], colaboradores: ColaboradorVinculado[], contratos: ContratoPJVinculado[]): PosicaoNode[] {
  const colabMap = new Map(colaboradores.map(c => [c.id, c]));
  const contratoMap = new Map(contratos.map(c => [c.id, c]));

  const nodeMap = new Map<string, PosicaoNode>();
  const roots: PosicaoNode[] = [];

  // Create all nodes
  for (const p of posicoes) {
    const colab = p.colaborador_id ? colabMap.get(p.colaborador_id) : null;
    const contrato = p.contrato_pj_id ? contratoMap.get(p.contrato_pj_id) : null;

    const node: PosicaoNode = {
      ...p,
      colaborador: colab || null,
      contrato_pj: contrato || null,
      children: [],
      subordinados_diretos: 0,
      subordinados_totais: 0,
      nome_display: colab ? colab.nome_completo : contrato ? (contrato.nome_fantasia || contrato.contato_nome) : "",
      foto_url: colab?.foto_url || null,
      vinculo: colab ? "CLT" : contrato ? "PJ" : null,
      status_pessoal: colab ? colab.status : contrato ? contrato.status : null,
    };
    nodeMap.set(p.id, node);
  }

  // Build tree
  for (const node of nodeMap.values()) {
    if (node.id_pai && nodeMap.has(node.id_pai)) {
      nodeMap.get(node.id_pai)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Calculate subordinates
  function countSubs(node: PosicaoNode): number {
    node.subordinados_diretos = node.children.length;
    let total = node.children.length;
    for (const child of node.children) {
      total += countSubs(child);
    }
    node.subordinados_totais = total;
    return total;
  }
  roots.forEach(countSubs);

  return roots;
}

function flattenTree(nodes: PosicaoNode[]): PosicaoNode[] {
  const result: PosicaoNode[] = [];
  function walk(node: PosicaoNode) {
    result.push(node);
    node.children.forEach(walk);
  }
  nodes.forEach(walk);
  return result;
}

export function useOrganograma() {
  return useQuery({
    queryKey: ["organograma"],
    queryFn: async () => {
      const [posRes, colabRes, contrRes] = await Promise.all([
        supabase.rpc("get_organograma_tree"),
        supabase.from("colaboradores_clt").select("id, nome_completo, foto_url, email_corporativo, telefone, data_admissao, salario_base, status, tipo_contrato, cargo, departamento"),
        supabase.from("contratos_pj").select("id, contato_nome, nome_fantasia, razao_social, contato_email, contato_telefone, data_inicio, valor_mensal, status"),
      ]);

      if (posRes.error) throw posRes.error;

      const tree = buildTree(
        (posRes.data || []) as unknown as PosicaoRaw[],
        (colabRes.data || []) as ColaboradorVinculado[],
        (contrRes.data || []) as ContratoPJVinculado[],
      );

      return { tree, flat: flattenTree(tree) };
    },
  });
}
