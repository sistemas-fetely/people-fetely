export type TipoUnidade = 'matriz' | 'filial' | 'fabrica' | 'ecommerce' | 'externa';

export interface Unidade {
  id: string;
  codigo: string;
  nome: string;
  tipo: TipoUnidade;
  cnpj: string | null;
  cidade: string | null;
  estado: string | null;
  ativa: boolean;
}

export type TipoPerfil = 'area' | 'transversal';

export type NivelHierarquico = 'estagio' | 'assistente' | 'analista' | 'coordenador' | 'gerente' | 'diretor';

export interface Perfil {
  id: string;
  codigo: string;
  nome: string;
  tipo: TipoPerfil;
  area: string | null;
  descricao: string | null;
  is_sistema: boolean;
  ativo: boolean;
}

export interface PermissionPack {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  is_sistema: boolean;
  ativo: boolean;
}

export interface PermissionPackItem {
  id: string;
  pack_id: string;
  modulo: string;
  acao: string;
  nivel_minimo: NivelHierarquico | null;
}

export interface UserAtribuicao {
  id: string;
  user_id: string;
  perfil_id: string;
  unidade_id: string | null;
  nivel: NivelHierarquico | null;
  valido_ate: string | null;
  criado_por: string | null;
  criado_em: string;
}

export interface AtribuicaoDetalhada {
  atribuicao_id: string;
  perfil_codigo: string;
  perfil_nome: string;
  perfil_tipo: TipoPerfil;
  unidade_id: string | null;
  unidade_nome: string | null;
  nivel: NivelHierarquico | null;
  valido_ate: string | null;
}

export const NIVEL_LABELS_V2: Record<NivelHierarquico, string> = {
  estagio: 'Estágio',
  assistente: 'Assistente',
  analista: 'Analista',
  coordenador: 'Coordenador',
  gerente: 'Gerente',
  diretor: 'Diretor',
};

export const NIVEL_RANK_V2: Record<NivelHierarquico, number> = {
  estagio: 1,
  assistente: 2,
  analista: 3,
  coordenador: 4,
  gerente: 5,
  diretor: 6,
};
