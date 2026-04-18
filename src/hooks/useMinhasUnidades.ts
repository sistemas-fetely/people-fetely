import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UnidadeAcessivel {
  unidade_id: string;
  unidade_codigo: string;
  unidade_nome: string;
}

export function useMinhasUnidades() {
  return useQuery({
    queryKey: ["minhas-unidades"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return [];

      const { data, error } = await supabase.rpc("user_unidades_acessiveis", { _user_id: userId });
      if (error) throw error;
      return (data || []) as UnidadeAcessivel[];
    },
    staleTime: 2 * 60 * 1000,
  });
}
