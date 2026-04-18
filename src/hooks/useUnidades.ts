import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Unidade } from "@/types/permissoes-v2";

export function useUnidades() {
  return useQuery({
    queryKey: ["unidades-ativas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unidades")
        .select("*")
        .eq("ativa", true)
        .order("nome");
      if (error) throw error;
      return (data || []) as Unidade[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUnidade(unidadeId: string | null) {
  const { data: unidades } = useUnidades();
  if (!unidadeId) return null;
  return unidades?.find((u) => u.id === unidadeId) || null;
}
