import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AtribuicaoDetalhada } from "@/types/permissoes-v2";

export function useMinhasAtribuicoes() {
  return useQuery({
    queryKey: ["minhas-atribuicoes"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return [];

      const { data, error } = await supabase.rpc("user_perfis_detalhados", { _user_id: userId });
      if (error) throw error;
      return (data || []) as AtribuicaoDetalhada[];
    },
    staleTime: 60 * 1000,
  });
}

export function useAtribuicoesDoUsuario(userId: string | null) {
  return useQuery({
    queryKey: ["atribuicoes-user", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase.rpc("user_perfis_detalhados", { _user_id: userId });
      if (error) throw error;
      return (data || []) as AtribuicaoDetalhada[];
    },
    staleTime: 60 * 1000,
  });
}
