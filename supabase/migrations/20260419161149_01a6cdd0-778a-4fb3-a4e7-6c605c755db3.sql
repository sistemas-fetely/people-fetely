CREATE OR REPLACE FUNCTION public.__pf3_area_id(_valor TEXT) RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.parametros WHERE categoria = 'area_negocio' AND valor = _valor LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.__pf3_depto_id(_valor TEXT) RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.parametros WHERE categoria = 'departamento' AND valor = _valor LIMIT 1;
$$;

DO $$
DECLARE
  v_proc_id UUID;
  v_area_adm UUID := public.__pf3_area_id('administrativo');
  v_depto_rh UUID := public.__pf3_depto_id('rh_dp');
  v_depto_ti UUID := public.__pf3_depto_id('ti');
  v_narrativa TEXT;
BEGIN
  -- 1. ACESSO DO COLABORADOR
  v_narrativa := E'# Acesso do Colaborador ao People Fetely\n\n> WhatsApp do RH silencioso — self-service + válvula de escape humana.\n\n## Quando usar\nToda criação, recuperação ou reenvio de acesso ao People Fetely.\n\n## Fluxo\n1. **Criação inicial** — RH cadastra colaborador; sistema valida email corporativo (domínio configurado); gera magic link; envia email de boas-vindas Fetely ao corporativo + aviso informativo ao pessoal.\n2. **Primeiro acesso** — colaborador clica no link, define senha forte (12 chars, maiúscula, minúscula, número, especial, não contém email), aceita Termo de Uso v1.0.\n3. **Recuperação self-service** — "Esqueci minha senha" em `/recuperar-senha` → novo magic link de 1h.\n4. **Reenvio forçado (emergência)** — RH pode reenviar pelo Hub da Pessoa ou detalhe do colaborador; registra motivo em log LGPD.\n\n## Responsáveis (RACI)\n- **R**: Sistema (automação) + RH (em reenvios)\n- **A**: Gerente de RH\n- **C**: DPO, Jurídico (LGPD)\n- **I**: Colaborador\n\n## Sistemas envolvidos\nPeople Fetely, Supabase Auth, infraestrutura de email (notify.fetelycorp.com.br)\n\n## Documentos relacionados\n- Termo de Uso v1.0 (parametros.termo_uso.versao_vigente)\n- /docs/processos/ACESSO_COLABORADOR.md';

  INSERT INTO public.processos (codigo, nome, descricao, narrativa, area_negocio_id, natureza_valor, status_valor, sensivel)
  VALUES ('acesso_colaborador', 'Acesso do Colaborador ao People Fetely', 'Criação, recuperação e reenvio de credenciais de acesso', v_narrativa, v_area_adm, 'guia', 'vigente', true)
  ON CONFLICT (codigo) DO NOTHING
  RETURNING id INTO v_proc_id;

  IF v_proc_id IS NOT NULL THEN
    IF v_depto_rh IS NOT NULL THEN INSERT INTO public.processos_tags_departamentos(processo_id, departamento_id) VALUES (v_proc_id, v_depto_rh) ON CONFLICT DO NOTHING; END IF;
    IF v_depto_ti IS NOT NULL THEN INSERT INTO public.processos_tags_departamentos(processo_id, departamento_id) VALUES (v_proc_id, v_depto_ti) ON CONFLICT DO NOTHING; END IF;
    IF v_area_adm IS NOT NULL THEN INSERT INTO public.processos_tags_areas(processo_id, area_id) VALUES (v_proc_id, v_area_adm) ON CONFLICT DO NOTHING; END IF;
    INSERT INTO public.processos_tags_tipos_colaborador(processo_id, tipo) VALUES (v_proc_id, 'clt'), (v_proc_id, 'pj') ON CONFLICT DO NOTHING;
    INSERT INTO public.processos_versoes (processo_id, numero, nome_snapshot, descricao_snapshot, narrativa_snapshot, natureza_snapshot, motivo_alteracao)
    VALUES (v_proc_id, 1, 'Acesso do Colaborador ao People Fetely', 'Criação, recuperação e reenvio de credenciais de acesso', v_narrativa, 'guia', 'Cadastro retroativo das construções A1-A4');
    UPDATE public.processos SET versao_atual = 1, versao_vigente_em = now() WHERE id = v_proc_id;
  END IF;

  -- 2. VISIBILIDADE DE SALÁRIO
  v_narrativa := E'# Política de Visibilidade de Salário\n\n> Salário é dado sensível (LGPD Art. 5º II). Acesso respeita matriz formal.\n\n## Princípios\n1. Próprio salário: sempre visível sem log.\n2. Dados de terceiros: dependem de (perfil × contexto) — três modos possíveis: **direto**, **revelar_com_log**, **oculto**.\n3. Todo acesso com log é logado em `acesso_dados_log`.\n4. Colaborador tem transparência em `/meus-acessos`.\n\n## Matriz aplicada\n- **Super Admin + Diretoria**: direto em quase tudo, com log em contextos sensíveis.\n- **RH + Financeiro**: direto nos contextos operacionais (folha, holerite); revelar_com_log em exploração.\n- **Gestão Direta**: revelar_com_log apenas para subordinados diretos (consulta via FK de gestor_direto real).\n- **Colaborador comum**: só próprio salário.\n\n## Revelação em lote\nListas com 5+ alvos oferecem botão "Revelar todos" → modal pede justificativa (mínimo 5 chars) → log agregado.\n\n## Responsáveis (RACI)\n- **R**: Sistema (aplica automaticamente via `decisao_salario`)\n- **A**: DPO / Jurídico\n- **C**: RH\n- **I**: Todos os colaboradores';

  INSERT INTO public.processos (codigo, nome, descricao, narrativa, area_negocio_id, natureza_valor, status_valor, sensivel)
  VALUES ('politica_visibilidade_salario', 'Visibilidade de Salário', 'Matriz formal de quem vê salário, em qual contexto e com que nível de log', v_narrativa, v_area_adm, 'guia', 'vigente', true)
  ON CONFLICT (codigo) DO NOTHING
  RETURNING id INTO v_proc_id;

  IF v_proc_id IS NOT NULL THEN
    IF v_depto_rh IS NOT NULL THEN INSERT INTO public.processos_tags_departamentos(processo_id, departamento_id) VALUES (v_proc_id, v_depto_rh) ON CONFLICT DO NOTHING; END IF;
    INSERT INTO public.processos_tags_tipos_colaborador(processo_id, tipo) VALUES (v_proc_id, 'clt'), (v_proc_id, 'pj') ON CONFLICT DO NOTHING;
    INSERT INTO public.processos_versoes (processo_id, numero, nome_snapshot, descricao_snapshot, narrativa_snapshot, natureza_snapshot, motivo_alteracao)
    VALUES (v_proc_id, 1, 'Visibilidade de Salário', 'Matriz formal de quem vê salário', v_narrativa, 'guia', 'Cadastro retroativo S1+S2');
    UPDATE public.processos SET versao_atual = 1, versao_vigente_em = now() WHERE id = v_proc_id;
  END IF;

  -- 3. ESTRUTURA ORGANIZACIONAL
  v_narrativa := E'# Estrutura Organizacional: Área → Departamento\n\n## Arquitetura\n5 áreas de negócio, 13 departamentos, relação 1:N (cada departamento pertence a exatamente 1 área — "cachorro de dois donos morre de fome").\n\n## Áreas\n- Administrativo\n- Marketing\n- Produtos\n- Comercial\n- Operação\n\n## Departamentos (13)\nVer tabela `parametros` categorias `area_negocio` e `departamento` (com `pai_valor` apontando para a área).\n\n## Automação\nQuando colaborador é cadastrado em um departamento, o sistema automaticamente:\n1. Deriva o perfil de área (via função `perfil_area_do_departamento`).\n2. Aplica template de acesso correspondente.\n3. Escopo da unidade escolhida.\n\n## Responsáveis (RACI)\n- **R**: Sistema (via hooks e função SQL) + Admin RH (ao criar departamentos/áreas novos)\n- **A**: Super Admin\n- **C**: Gerentes de área\n- **I**: Todos os colaboradores';

  INSERT INTO public.processos (codigo, nome, descricao, narrativa, area_negocio_id, natureza_valor, status_valor)
  VALUES ('estrutura_organizacional', 'Estrutura Organizacional (Área → Departamento)', 'Modelo de áreas, departamentos e unidades', v_narrativa, v_area_adm, 'guia', 'vigente')
  ON CONFLICT (codigo) DO NOTHING
  RETURNING id INTO v_proc_id;

  IF v_proc_id IS NOT NULL THEN
    IF v_depto_rh IS NOT NULL THEN INSERT INTO public.processos_tags_departamentos(processo_id, departamento_id) VALUES (v_proc_id, v_depto_rh) ON CONFLICT DO NOTHING; END IF;
    INSERT INTO public.processos_versoes (processo_id, numero, nome_snapshot, descricao_snapshot, narrativa_snapshot, natureza_snapshot, motivo_alteracao)
    VALUES (v_proc_id, 1, 'Estrutura Organizacional', 'Modelo de áreas/departamentos', v_narrativa, 'guia', 'Cadastro retroativo V3');
    UPDATE public.processos SET versao_atual = 1, versao_vigente_em = now() WHERE id = v_proc_id;
  END IF;

  -- 4. TEMPLATES DE USUÁRIO
  v_narrativa := E'# Templates de Usuário e Automação Cadastro→Usuário\n\n## O que são templates\nConjunto pré-configurado de perfis que é aplicado automaticamente a um novo usuário, com base no cargo.\n\n## Fluxo automático\nAo criar colaborador (CLT ou PJ) com checkbox "Criar acesso ao portal":\n1. Sistema identifica o cargo → template sugerido (via `template_sugerido_para_cargo`).\n2. Fallback: template "analista" se cargo não mapeado.\n3. Aplica via `aplicar_template_cargo_v3`: perfis transversais + perfil de área derivado do departamento + nível + unidade.\n4. Envia boas-vindas ao email corporativo.\n\n## CRUD de templates\nAcesso: Gerenciar Usuários → aba Templates.\n- Criar: permitido (customizado)\n- Editar nome/código/nível: apenas templates customizados. Sistema é imutável.\n- Editar perfis: permitido em ambos\n- Deletar: apenas customizados que não estão em uso (triggers bloqueiam)\n\n## Responsáveis (RACI)\n- **R**: Admin RH (CRUD de templates)\n- **A**: Super Admin (revisão anual da matriz)\n- **C**: Gerentes de área (sugestões)\n- **I**: Colaboradores';

  INSERT INTO public.processos (codigo, nome, descricao, narrativa, area_negocio_id, natureza_valor, status_valor)
  VALUES ('templates_usuario', 'Templates de Usuário e Automação Cadastro→Usuário', 'Como o sistema aplica perfis automaticamente ao criar usuário novo', v_narrativa, v_area_adm, 'guia', 'vigente')
  ON CONFLICT (codigo) DO NOTHING
  RETURNING id INTO v_proc_id;

  IF v_proc_id IS NOT NULL THEN
    IF v_depto_rh IS NOT NULL THEN INSERT INTO public.processos_tags_departamentos(processo_id, departamento_id) VALUES (v_proc_id, v_depto_rh) ON CONFLICT DO NOTHING; END IF;
    IF v_depto_ti IS NOT NULL THEN INSERT INTO public.processos_tags_departamentos(processo_id, departamento_id) VALUES (v_proc_id, v_depto_ti) ON CONFLICT DO NOTHING; END IF;
    INSERT INTO public.processos_tags_tipos_colaborador(processo_id, tipo) VALUES (v_proc_id, 'clt'), (v_proc_id, 'pj') ON CONFLICT DO NOTHING;
    INSERT INTO public.processos_versoes (processo_id, numero, nome_snapshot, descricao_snapshot, narrativa_snapshot, natureza_snapshot, motivo_alteracao)
    VALUES (v_proc_id, 1, 'Templates de Usuário', 'Automação cadastro→usuário', v_narrativa, 'guia', 'Cadastro retroativo U1+U2');
    UPDATE public.processos SET versao_atual = 1, versao_vigente_em = now() WHERE id = v_proc_id;
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.__pf3_area_id(TEXT);
DROP FUNCTION IF EXISTS public.__pf3_depto_id(TEXT);