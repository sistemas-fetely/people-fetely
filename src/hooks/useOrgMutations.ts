import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PosicaoInsert {
  titulo_cargo: string;
  nivel_hierarquico: number;
  departamento: string;
  area?: string | null;
  filial?: string | null;
  status: string;
  id_pai?: string | null;
  colaborador_id?: string | null;
  contrato_pj_id?: string | null;
  salario_previsto?: number | null;
  centro_custo?: string | null;
}

interface PosicaoUpdate extends Partial<PosicaoInsert> {
  id: string;
}

export function useCreatePosicao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: PosicaoInsert) => {
      const { error } = await supabase.from("posicoes").insert(data as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organograma"] });
      toast.success("Posição criada com sucesso");
    },
    onError: (e: Error) => toast.error(`Erro ao criar posição: ${e.message}`),
  });
}

export function useUpdatePosicao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: PosicaoUpdate) => {
      // If it's a virtual node, create a real position instead
      if (id.startsWith("virtual-")) {
        const { error } = await supabase.from("posicoes").insert({
          ...data,
        } as any);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("posicoes").update(data as any).eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organograma"] });
      toast.success("Posição atualizada com sucesso");
    },
    onError: (e: Error) => toast.error(`Erro ao atualizar: ${e.message}`),
  });
}

export function useDeletePosicao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (id.startsWith("virtual-")) return; // Can't delete virtual nodes
      const { error } = await supabase.from("posicoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organograma"] });
      toast.success("Posição removida com sucesso");
    },
    onError: (e: Error) => toast.error(`Erro ao remover: ${e.message}`),
  });
}

export function useMovePosicao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, newParentId, node }: { id: string; newParentId: string | null; node?: any }) => {
      if (id.startsWith("virtual-")) {
        // Create a real position for virtual node
        const isColab = id.startsWith("virtual-clt-");
        const realId = id.replace("virtual-clt-", "").replace("virtual-pj-", "");
        
        const insert: any = {
          titulo_cargo: node?.titulo_cargo || "Sem cargo",
          departamento: node?.departamento || "Geral",
          nivel_hierarquico: node?.nivel_hierarquico || 1,
          status: "ocupado",
          id_pai: newParentId?.startsWith("virtual-") ? null : newParentId,
          ...(isColab ? { colaborador_id: realId } : { contrato_pj_id: realId }),
        };

        const { error } = await supabase.from("posicoes").insert(insert);
        if (error) throw error;
      } else {
        const parentId = newParentId?.startsWith("virtual-") ? null : newParentId;
        const { error } = await supabase.from("posicoes").update({ id_pai: parentId } as any).eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organograma"] });
      toast.success("Posição movida com sucesso");
    },
    onError: (e: Error) => toast.error(`Erro ao mover: ${e.message}`),
  });
}
