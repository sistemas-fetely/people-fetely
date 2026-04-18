import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Perfil } from "@/types/permissoes-v2";

export function usePerfisV2() {
  return useQuery({
    queryKey: ["perfis-v2-ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perfis")
        .select("*")
        .eq("ativo", true)
        .order("tipo", { ascending: false })
        .order("nome");
      if (error) throw error;
      return (data || []) as Perfil[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePerfil(perfilId: string | null) {
  const { data: perfis } = usePerfisV2();
  if (!perfilId) return null;
  return perfis?.find((p) => p.id === perfilId) || null;
}
