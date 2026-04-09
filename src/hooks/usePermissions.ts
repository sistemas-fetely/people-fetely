import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RolePermission {
  role_name: string;
  module: string;
  permission: string;
  granted: boolean;
}

const MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "colaboradores", label: "Colaboradores CLT" },
  { key: "contratos_pj", label: "Contratos PJ" },
  { key: "folha_pagamento", label: "Folha de Pagamento" },
  { key: "ferias", label: "Férias" },
  { key: "beneficios", label: "Benefícios" },
  { key: "movimentacoes", label: "Movimentações" },
  { key: "notas_fiscais", label: "Notas Fiscais" },
  { key: "pagamentos_pj", label: "Pagamentos PJ" },
  { key: "organograma", label: "Organograma" },
  { key: "convites", label: "Convites de Cadastro" },
  { key: "recrutamento", label: "Recrutamento" },
  { key: "avaliacoes", label: "Avaliações" },
  { key: "treinamentos", label: "Treinamentos" },
  { key: "relatorios", label: "Relatórios" },
  { key: "parametros", label: "Parâmetros" },
  { key: "usuarios", label: "Gerenciar Usuários" },
] as const;

const CRUD_PERMISSIONS = [
  { key: "view", label: "Visualizar" },
  { key: "create", label: "Criar" },
  { key: "edit", label: "Editar" },
  { key: "delete", label: "Deletar" },
] as const;

const SPECIAL_PERMISSIONS = [
  { key: "enviar_email", label: "Enviar por Email", module: "notas_fiscais" },
  { key: "aprovar", label: "Aprovar", module: "ferias" },
  { key: "fechar", label: "Fechar Competência", module: "folha_pagamento" },
  { key: "exportar", label: "Exportar", module: "folha_pagamento" },
  { key: "enviar", label: "Enviar Convite", module: "convites" },
] as const;

export { MODULES, CRUD_PERMISSIONS, SPECIAL_PERMISSIONS };

export function usePermissions() {
  const { user } = useAuth();

  const { data: userRoles = [] } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.rpc("get_user_roles", { _user_id: user.id });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: allPermissions = [] } = useQuery({
    queryKey: ["role-permissions-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("role_name, module, permission, granted");
      if (error) throw error;
      return data as RolePermission[];
    },
    enabled: !!user?.id,
  });

  const hasPermission = (module: string, permission: string): boolean => {
    if (!userRoles.length || !allPermissions.length) return false;
    return allPermissions.some(
      (p) =>
        userRoles.includes(p.role_name as any) &&
        p.module === module &&
        p.permission === permission &&
        p.granted
    );
  };

  const canView = (module: string) => hasPermission(module, "view");
  const canCreate = (module: string) => hasPermission(module, "create");
  const canEdit = (module: string) => hasPermission(module, "edit");
  const canDelete = (module: string) => hasPermission(module, "delete");

  return {
    userRoles,
    allPermissions,
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    isLoading: !allPermissions.length && !!user?.id,
  };
}
