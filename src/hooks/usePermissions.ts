import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RolePermission {
  role_name: string;
  module: string;
  permission: string;
  granted: boolean;
  colaborador_tipo: string;
  nivel_minimo?: string | null;
}

const MODULES = [
  // Portal SNCF
  { key: "dashboard", label: "Dashboard People", category: "sncf" },
  { key: "tarefas", label: "Minhas Tarefas", category: "sncf" },
  { key: "tarefas_time", label: "Tarefas do Time", category: "sncf" },
  { key: "fala_fetely", label: "Fala Fetely (chat)", category: "sncf" },

  // Fala Fetely — Gestão
  { key: "conhecimento_fetely", label: "Base de Conhecimento", category: "fala_fetely" },
  { key: "memorias_fetely", label: "Minhas Memórias", category: "fala_fetely" },
  { key: "importacao_pdf", label: "Importação de PDF", category: "fala_fetely" },
  { key: "sugestoes_conhecimento", label: "Sugestões de Conhecimento", category: "fala_fetely" },

  // People Fetely
  { key: "pessoas", label: "Pessoas (CLT + PJ)", category: "people" },
  { key: "colaboradores", label: "Colaboradores CLT", category: "people" },
  { key: "contratos_pj", label: "Contratos PJ", category: "people" },
  { key: "organograma", label: "Organograma", category: "people" },
  { key: "onboarding", label: "Onboarding", category: "people" },
  { key: "ferias", label: "Férias", category: "people" },
  { key: "beneficios", label: "Benefícios", category: "people" },
  { key: "movimentacoes", label: "Movimentações", category: "people" },
  { key: "recrutamento", label: "Recrutamento", category: "people" },
  { key: "avaliacoes", label: "Avaliações", category: "people" },
  { key: "treinamentos", label: "Treinamentos", category: "people" },

  // Financeiro
  { key: "folha_pagamento", label: "Folha de Pagamento", category: "financeiro" },
  { key: "notas_fiscais", label: "Notas Fiscais", category: "financeiro" },
  { key: "pagamentos_pj", label: "Pagamentos PJ", category: "financeiro" },
  { key: "cargos", label: "Cargos e Salários", category: "financeiro" },

  // TI Fetely
  { key: "ti_ativos", label: "Ativos de TI", category: "ti" },
  { key: "documentacao", label: "Documentação Viva", category: "ti" },

  // Administração
  { key: "processos", label: "Processos", category: "admin" },
  { key: "convites", label: "Convites de Cadastro", category: "admin" },
  { key: "parametros", label: "Parâmetros", category: "admin" },
  { key: "usuarios", label: "Gerenciar Usuários", category: "admin" },
  { key: "relatorios", label: "Relatórios", category: "admin" },
] as const;

const MODULE_CATEGORIES = [
  { key: "sncf", label: "Portal SNCF", color: "text-purple-700 dark:text-purple-400" },
  { key: "fala_fetely", label: "Fala Fetely", color: "text-pink-700 dark:text-pink-400" },
  { key: "people", label: "People Fetely", color: "text-emerald-700 dark:text-emerald-400" },
  { key: "financeiro", label: "Financeiro", color: "text-amber-700 dark:text-amber-400" },
  { key: "ti", label: "TI Fetely", color: "text-cyan-700 dark:text-cyan-400" },
  { key: "admin", label: "Administração", color: "text-slate-700 dark:text-slate-400" },
] as const;

const CRUD_PERMISSIONS = [
  { key: "view", label: "Visualizar" },
  { key: "create", label: "Criar" },
  { key: "edit", label: "Editar" },
  { key: "delete", label: "Deletar" },
] as const;

const SPECIAL_PERMISSIONS = [
  { key: "enviar_email", label: "Enviar por Email", module: "notas_fiscais" },
  { key: "aprovar", label: "Aprovar/Alterar Status", module: "notas_fiscais" },
  { key: "aprovar", label: "Aprovar", module: "ferias" },
  { key: "fechar", label: "Fechar Competência", module: "folha_pagamento" },
  { key: "exportar", label: "Exportar", module: "folha_pagamento" },
  { key: "exportar", label: "Exportar", module: "notas_fiscais" },
  { key: "exportar", label: "Exportar", module: "relatorios" },
  { key: "enviar", label: "Enviar Convite", module: "convites" },
] as const;

/** Returns the colaborador_tipo expected for a given module category */
function getColaboradorTipoForCategory(category: string): string {
  // All current categories are role-based, not colaborador_tipo-based.
  return "all";
}

/**
 * Pure helper to check permission given a permissions list and user roles.
 * - Super admin always passes (global bypass).
 * - A role grants the permission if granted=true and the user has that role.
 * Note: nivel_minimo is enforced by the database (has_permission RPC). On the
 * client we simplify and treat granted=true as access; granular nivel checks
 * remain server-side.
 */
export function hasPermission(
  permissions: RolePermission[],
  roles: string[],
  module: string,
  action: string,
): boolean {
  if (roles.includes("super_admin")) return true;
  return permissions.some(
    (p) =>
      roles.includes(p.role_name) &&
      p.module === module &&
      p.permission === action &&
      p.granted,
  );
}

export { MODULES, MODULE_CATEGORIES, CRUD_PERMISSIONS, SPECIAL_PERMISSIONS, getColaboradorTipoForCategory };

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
        .select("role_name, module, permission, granted, colaborador_tipo, nivel_minimo");
      if (error) throw error;
      return data as RolePermission[];
    },
    enabled: !!user?.id,
  });

  // Detect user's tipo: prioritize profiles.colaborador_tipo, fallback to table detection
  const { data: userTipos = [] } = useQuery({
    queryKey: ["user-colaborador-tipo", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Priority 1: check profiles.colaborador_tipo
      const { data: profileData } = await supabase
        .from("profiles")
        .select("colaborador_tipo")
        .eq("user_id", user.id)
        .single();

      const tipo = profileData?.colaborador_tipo;
      if (tipo === "clt") return ["clt"];
      if (tipo === "pj") return ["pj"];
      if (tipo === "ambos") return ["clt", "pj"];

      // Priority 2: auto-detect from tables
      const results: string[] = [];
      const [cltRes, pjRes] = await Promise.all([
        supabase.from("colaboradores_clt").select("id").eq("user_id", user.id).limit(1),
        supabase.from("contratos_pj").select("id").eq("user_id", user.id).limit(1),
      ]);
      if (cltRes.data?.length) results.push("clt");
      if (pjRes.data?.length) results.push("pj");
      return results;
    },
    enabled: !!user?.id,
  });

  const isSuperAdmin = userRoles.includes("super_admin" as any);
  const isAdminRH =
    userRoles.includes("admin_rh" as any) || userRoles.includes("rh" as any);

  const hasPermissionLocal = (module: string, permission: string): boolean => {
    // Super Admin bypasses all permission checks
    if (isSuperAdmin) return true;
    if (!userRoles.length || !allPermissions.length) return false;
    return allPermissions.some(
      (p) =>
        userRoles.includes(p.role_name as any) &&
        p.module === module &&
        p.permission === permission &&
        p.granted &&
        (p.colaborador_tipo === "all" || userTipos.includes(p.colaborador_tipo))
    );
  };

  /**
   * Centralized salary visibility check.
   * - C-Level positions: only super_admin can see salary.
   * - Non C-Level: super_admin or admin_rh can see salary.
   * NEVER duplicate this logic in components.
   */
  const canSeeSalary = (isCLevel: boolean = false): boolean => {
    if (isCLevel) return isSuperAdmin;
    return isSuperAdmin || isAdminRH;
  };

  const canView = (module: string) => hasPermissionLocal(module, "view");
  const canCreate = (module: string) => hasPermissionLocal(module, "create");
  const canEdit = (module: string) => hasPermissionLocal(module, "edit");
  const canDelete = (module: string) => hasPermissionLocal(module, "delete");
  const canAccess = (module: string, action: string = "view") =>
    hasPermissionLocal(module, action);

  return {
    userRoles,
    userTipos,
    allPermissions,
    hasPermission: hasPermissionLocal,
    canAccess,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canSeeSalary,
    isSuperAdmin,
    isAdminRH,
    isLoading: !allPermissions.length && !!user?.id,
  };
}
