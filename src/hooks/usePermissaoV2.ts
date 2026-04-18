import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePermissaoV2(modulo: string, acao: string, unidadeId?: string | null) {
  return useQuery({
    queryKey: ["permissao-v2", modulo, acao, unidadeId || "global"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return false;

      const { data, error } = await supabase.rpc("tem_permissao", {
        _user_id: userId,
        _modulo: modulo,
        _acao: acao,
        _unidade_id: unidadeId || null,
      });
      if (error) throw error;
      return Boolean(data);
    },
    staleTime: 30 * 1000,
  });
}

export function useTemAcessoModulo(modulo: string) {
  return useQuery({
    queryKey: ["permissao-modulo-v2", modulo],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return false;

      const { data, error } = await supabase.rpc("tem_qualquer_acesso_modulo", {
        _user_id: userId,
        _modulo: modulo,
      });
      if (error) throw error;
      return Boolean(data);
    },
    staleTime: 60 * 1000,
  });
}
