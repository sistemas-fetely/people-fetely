import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CargoTemplate {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  nivel_sugerido: string | null;
  cargo_id: string | null;
  area: string | null;
  is_sistema: boolean;
  ativo: boolean;
}

export interface PreviewPerfil {
  perfil_nome: string;
  perfil_tipo: string;
  nivel: string | null;
  unidade_nome: string | null;
}

export interface PerfilTemplate {
  perfil_id: string;
  escopo_unidade_id: string | null;
  nivel_override: string | null;
}

export interface TemplateCompleto {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  nivel_sugerido: string | null;
  cargo_id: string | null;
  area: string | null;
  is_sistema: boolean;
  ativo: boolean;
  perfis: PerfilTemplate[];
}

export function useTemplates(apenasAtivos = true) {
  return useQuery({
    queryKey: ["cargo-templates-ativos", apenasAtivos],
    queryFn: async () => {
      let q = supabase.from("cargo_template").select("*").order("nivel_sugerido");
      if (apenasAtivos) q = q.eq("ativo", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as CargoTemplate[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePreviewTemplate(
  templateId: string | null,
  areaCodigo: string | null,
  unidadeId: string | null
) {
  return useQuery({
    queryKey: ["preview-template", templateId, areaCodigo, unidadeId],
    enabled: !!templateId,
    queryFn: async () => {
      if (!templateId) return [];
      const { data, error } = await supabase.rpc("preview_template_cargo", {
        _template_id: templateId,
        _area_perfil_codigo: areaCodigo,
        _unidade_id: unidadeId,
      });
      if (error) throw error;
      return (data || []) as PreviewPerfil[];
    },
    staleTime: 0,
  });
}

/** Busca um template com seus perfis associados */
export function useTemplateCompleto(templateId: string | null) {
  return useQuery({
    queryKey: ["template-completo", templateId],
    enabled: !!templateId,
    queryFn: async (): Promise<TemplateCompleto | null> => {
      if (!templateId) return null;
      const [{ data: template }, { data: perfis }] = await Promise.all([
        supabase.from("cargo_template").select("*").eq("id", templateId).maybeSingle(),
        supabase.from("cargo_template_perfis").select("perfil_id, escopo_unidade_id, nivel_override").eq("template_id", templateId),
      ]);
      if (!template) return null;
      return { ...(template as any), perfis: (perfis as any) || [] };
    },
  });
}

/** Uso do template (quantos usuários, quantos cargos padrão) */
export function useUsoTemplate(templateId: string | null) {
  return useQuery({
    queryKey: ["uso-template", templateId],
    enabled: !!templateId,
    queryFn: async () => {
      if (!templateId) return { usuarios: 0, cargos_com_padrao: 0 };
      const { data } = await supabase.rpc("contar_uso_template", { _template_id: templateId });
      return (data as { usuarios: number; cargos_com_padrao: number }) || { usuarios: 0, cargos_com_padrao: 0 };
    },
  });
}

/** Cria template customizado. is_sistema sempre false. */
export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      codigo: string;
      nome: string;
      descricao: string | null;
      nivel_sugerido: string | null;
      perfis: PerfilTemplate[];
    }) => {
      const { data: template, error } = await supabase
        .from("cargo_template")
        .insert({
          codigo: payload.codigo,
          nome: payload.nome,
          descricao: payload.descricao,
          nivel_sugerido: payload.nivel_sugerido,
          is_sistema: false,
          ativo: true,
        } as any)
        .select("id")
        .single();
      if (error) throw error;
      if (payload.perfis.length > 0) {
        const { error: errPerfis } = await supabase
          .from("cargo_template_perfis")
          .insert(payload.perfis.map((p) => ({
            template_id: (template as any).id,
            perfil_id: p.perfil_id,
            escopo_unidade_id: p.escopo_unidade_id,
            nivel_override: p.nivel_override,
          })) as any);
        if (errPerfis) throw errPerfis;
      }
      return template;
    },
    onSuccess: () => {
      toast.success("Template criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["cargo-templates-ativos"] });
      queryClient.invalidateQueries({ queryKey: ["template-itens-todos"] });
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao criar template"),
  });
}

/** Edita template. Para sistema: aceita só descricao e perfis. */
export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      is_sistema: boolean;
      codigo?: string;
      nome?: string;
      descricao: string | null;
      nivel_sugerido?: string | null;
      perfis: PerfilTemplate[];
    }) => {
      const updateFields: any = { descricao: payload.descricao };
      if (!payload.is_sistema) {
        updateFields.codigo = payload.codigo;
        updateFields.nome = payload.nome;
        updateFields.nivel_sugerido = payload.nivel_sugerido;
      }
      const { error } = await supabase
        .from("cargo_template")
        .update(updateFields)
        .eq("id", payload.id);
      if (error) throw error;

      await supabase.from("cargo_template_perfis").delete().eq("template_id", payload.id);
      if (payload.perfis.length > 0) {
        const { error: errPerfis } = await supabase
          .from("cargo_template_perfis")
          .insert(payload.perfis.map((p) => ({
            template_id: payload.id,
            perfil_id: p.perfil_id,
            escopo_unidade_id: p.escopo_unidade_id,
            nivel_override: p.nivel_override,
          })) as any);
        if (errPerfis) throw errPerfis;
      }
      return payload.id;
    },
    onSuccess: (templateId) => {
      toast.success("Template atualizado!");
      queryClient.invalidateQueries({ queryKey: ["cargo-templates-ativos"] });
      queryClient.invalidateQueries({ queryKey: ["template-itens-todos"] });
      queryClient.invalidateQueries({ queryKey: ["template-completo", templateId] });
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao atualizar template"),
  });
}

/** Toggle ativo/inativo. */
export function useToggleTemplateAtivo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("cargo_template")
        .update({ ativo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { ativo }) => {
      toast.success(ativo ? "Template ativado" : "Template inativado");
      queryClient.invalidateQueries({ queryKey: ["cargo-templates-ativos"] });
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao alterar status"),
  });
}

/** Deleta permanentemente — só para customizados, bloqueado se em uso (trigger). */
export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cargo_template")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Template excluído");
      queryClient.invalidateQueries({ queryKey: ["cargo-templates-ativos"] });
      queryClient.invalidateQueries({ queryKey: ["template-itens-todos"] });
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao excluir template"),
  });
}
