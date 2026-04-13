import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns a Set of cargo values that are marked as C-Level.
 * Use this to check if a specific cargo is C-Level before showing salary.
 */
export function useCLevelCargos() {
  const { data: clevelCargos = new Set<string>() } = useQuery({
    queryKey: ["clevel-cargos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parametros")
        .select("valor, label")
        .eq("categoria", "cargo")
        .eq("is_clevel", true)
        .eq("ativo", true);
      if (error) throw error;
      const set = new Set<string>();
      (data || []).forEach((p) => {
        set.add(p.valor);
        set.add(p.label);
      });
      return set;
    },
    staleTime: 5 * 60 * 1000,
  });

  const isCargoClevel = (cargo: string | null | undefined): boolean => {
    if (!cargo) return false;
    return clevelCargos.has(cargo);
  };

  return { clevelCargos, isCargoClevel };
}
