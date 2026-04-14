import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const MATRIX_ROLES: { role: AppRole; label: string; shortLabel: string }[] = [
  { role: "super_admin", label: "Super Admin", shortLabel: "SA" },
  { role: "admin_rh", label: "Admin RH", shortLabel: "ARH" },
  { role: "gestor_rh", label: "Gestor RH", shortLabel: "GRH" },
  { role: "gestor_direto", label: "Gestor Direto", shortLabel: "GD" },
  { role: "financeiro", label: "Financeiro", shortLabel: "FIN" },
  { role: "colaborador", label: "Colaborador", shortLabel: "COL" },
];

interface ModuleGroup {
  group: string;
  modules: { value: string; label: string }[];
}

const MODULE_GROUPS: ModuleGroup[] = [
  {
    group: "Gestão de Pessoas",
    modules: [
      { value: "dashboard", label: "Dashboard" },
      { value: "pessoas", label: "Pessoas" },
      { value: "colaboradores", label: "Colaboradores CLT" },
      { value: "contratos_pj", label: "Contratos PJ" },
      { value: "organograma", label: "Organograma" },
    ],
  },
  {
    group: "Operações RH",
    modules: [
      { value: "convites", label: "Convites" },
      { value: "onboarding", label: "Onboarding" },
      { value: "ferias", label: "Férias" },
      { value: "beneficios", label: "Benefícios" },
      { value: "movimentacoes", label: "Movimentações" },
    ],
  },
  {
    group: "Financeiro",
    modules: [
      { value: "folha_pagamento", label: "Folha de Pagamento" },
      { value: "notas_fiscais", label: "Notas Fiscais" },
      { value: "pagamentos_pj", label: "Pagamentos PJ" },
    ],
  },
  {
    group: "Administração",
    modules: [
      { value: "parametros", label: "Parâmetros" },
      { value: "usuarios", label: "Usuários" },
    ],
  },
  {
    group: "Futuros",
    modules: [
      { value: "recrutamento", label: "Recrutamento" },
      { value: "avaliacoes", label: "Avaliações" },
      { value: "treinamentos", label: "Treinamentos" },
      { value: "relatorios", label: "Relatórios" },
    ],
  },
];

const PERMISSION_LABELS: Record<string, string> = {
  view: "Visualizar",
  create: "Criar",
  edit: "Editar",
  delete: "Deletar",
  aprovar: "Aprovar",
  enviar: "Enviar",
  exportar: "Exportar",
  fechar: "Fechar",
  enviar_email: "Enviar E-mail",
};

type PermLevel = "full" | "partial" | "none" | "super";

function getDot(level: PermLevel) {
  switch (level) {
    case "super":
      return "bg-purple-500";
    case "full":
      return "bg-emerald-500";
    case "partial":
      return "bg-amber-400";
    case "none":
      return "border-2 border-muted-foreground/30 bg-transparent";
  }
}

interface RolePermission {
  role_name: string;
  module: string;
  permission: string;
  granted: boolean;
}

export default function MatrizPermissoes() {
  const { data: todasPermissoes, isLoading } = useQuery({
    queryKey: ["all-role-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("role_name, module, permission, granted")
        .eq("granted", true);
      if (error) throw error;
      return (data || []) as RolePermission[];
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const perms = todasPermissoes || [];

  const getModulePerms = (roleName: string, moduleName: string) => {
    return perms.filter((p) => p.role_name === roleName && p.module === moduleName);
  };

  const getLevel = (roleName: string, moduleName: string): PermLevel => {
    if (roleName === "super_admin") return "super";
    const modulePerms = getModulePerms(roleName, moduleName);
    if (modulePerms.length === 0) return "none";
    const hasView = modulePerms.some((p) => p.permission === "view");
    const hasCreate = modulePerms.some((p) => p.permission === "create");
    const hasEdit = modulePerms.some((p) => p.permission === "edit");
    if (hasView && hasCreate && hasEdit) return "full";
    return "partial";
  };

  const getTooltipContent = (roleName: string, moduleName: string, roleLabel: string, moduleLabel: string) => {
    if (roleName === "super_admin") return `${roleLabel}: Acesso total a ${moduleLabel}`;
    const modulePerms = getModulePerms(roleName, moduleName);
    if (modulePerms.length === 0) return `${roleLabel}: Sem acesso a ${moduleLabel}`;
    const lines = modulePerms.map(
      (p) => `${PERMISSION_LABELS[p.permission] || p.permission} ✓`
    );
    return `${roleLabel} em ${moduleLabel}:\n${lines.join(" | ")}`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Matriz de Permissões</CardTitle>
        <p className="text-sm text-muted-foreground">
          Visão em tempo real das permissões por role e módulo
        </p>
        <div className="flex flex-wrap gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block h-3 w-3 rounded-full bg-purple-500" /> Super Admin
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" /> Acesso completo
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block h-3 w-3 rounded-full bg-amber-400" /> Acesso parcial
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-muted-foreground/30" /> Sem acesso
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <TooltipProvider delayDuration={200}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground min-w-[180px]">Módulo</th>
                  {MATRIX_ROLES.map((r) => (
                    <th key={r.role} className="text-center py-2 px-2 font-medium text-muted-foreground min-w-[70px]">
                      <span className="hidden lg:inline">{r.label}</span>
                      <span className="lg:hidden">{r.shortLabel}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULE_GROUPS.map((group) => (
                  <>
                    <tr key={`group-${group.group}`}>
                      <td colSpan={MATRIX_ROLES.length + 1} className="pt-4 pb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {group.group}
                        </span>
                      </td>
                    </tr>
                    {group.modules.map((mod) => (
                      <tr key={mod.value} className="border-b border-muted/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 pr-4 font-medium">{mod.label}</td>
                        {MATRIX_ROLES.map((r) => {
                          const level = getLevel(r.role, mod.value);
                          const tip = getTooltipContent(r.role, mod.value, r.label, mod.label);
                          return (
                            <td key={r.role} className="text-center py-2.5 px-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    className={`inline-block h-3.5 w-3.5 rounded-full cursor-default ${getDot(level)}`}
                                  />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[250px] whitespace-pre-line text-xs">
                                  {tip}
                                </TooltipContent>
                              </Tooltip>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
