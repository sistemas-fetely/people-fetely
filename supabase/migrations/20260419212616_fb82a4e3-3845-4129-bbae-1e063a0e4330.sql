-- Cadastra 10 diretrizes da Metodologia Uauuu na base de conhecimento do Fala Fetely
-- Idempotente: insere apenas se o titulo ainda nao existir.
-- Nota: a tabela correta no schema atual eh public.fala_fetely_conhecimento (nao base_conhecimento).

INSERT INTO public.fala_fetely_conhecimento (categoria, titulo, conteudo, area_negocio, publico_alvo, fonte, tags, ativo, origem)
SELECT 'diretriz',
  'Dimensão via tabela, nunca hardcode',
  E'**Regra arquitetural permanente do Uauuu.**\n\nÁrea, departamento, unidade, cargo, sistema, tipo_colaborador e qualquer outra dimensão de negócio devem vir de uma **tabela fonte** (geralmente `parametros` ou tabela dedicada). Nunca de array literal hardcoded no código.\n\n**Por quê:** valores de negócio evoluem. Lista no código envelhece mal, precisa de deploy pra cada mudança, e inevitavelmente alguém vai cadastrar em um lugar e esquecer outro.\n\n**Se estiver prestes a escrever** `const AREAS = ["marketing", "produto", ...]` **no código, é sinal pra parar e modelar a tabela primeiro.**\n\nSe a tabela já existe mas está incompleta, completar ANTES da feature que depende dela. Sem atalhos.',
  NULL, 'todos', 'docs/METODOLOGIA_UAUUU.md#regras-de-ouro',
  ARRAY['metodologia','arquitetura','regra-permanente','hardcode','parametros'], true, 'manual'
WHERE NOT EXISTS (SELECT 1 FROM public.fala_fetely_conhecimento WHERE titulo = 'Dimensão via tabela, nunca hardcode');

INSERT INTO public.fala_fetely_conhecimento (categoria, titulo, conteudo, area_negocio, publico_alvo, fonte, tags, ativo, origem)
SELECT 'diretriz',
  'CLT e PJ recebem o mesmo tratamento',
  E'**Princípio de DNA Fetely aplicado a todo sistema.**\n\nColaboradores CLT e PJ passam pelos **mesmos processos, benefícios e cultura**. A única coisa que diferencia os dois são os **deveres legais** (tipo de contrato, documentação obrigatória, registros fiscais).\n\n**Isso se reflete em:**\n- Onboarding é processo único (não dois processos separados)\n- Mesmo treinamento de cultura\n- Mesmo acesso a benefícios quando aplicável\n- Mesma expectativa de gestão\n- Portal do colaborador espelha dados equivalentes para ambos\n\n**Na prática do código:** quando desenhar feature, perguntar "isso precisa mesmo ser diferente pra PJ?". 99% das vezes a resposta é "não — só o registro legal é diferente".\n\n*Frase-guia: "o que importa é quem você é, não o regime contratual."*',
  NULL, 'todos', 'DNA Fetely v3.0',
  ARRAY['metodologia','dna','clt','pj','igualdade','cultura'], true, 'manual'
WHERE NOT EXISTS (SELECT 1 FROM public.fala_fetely_conhecimento WHERE titulo = 'CLT e PJ recebem o mesmo tratamento');

INSERT INTO public.fala_fetely_conhecimento (categoria, titulo, conteudo, area_negocio, publico_alvo, fonte, tags, ativo, origem)
SELECT 'diretriz',
  'Funcionalidade multi-sistema pertence à camada transversal (SNCF/Uauuu)',
  E'**Doutrina arquitetural.**\n\nFuncionalidade que atende **múltiplos sistemas** do Uauuu pertence à camada transversal, não a um pilar específico (People, TI, Marca, etc).\n\n**Sinais de pertencimento transversal:**\n- Qualquer usuário de qualquer sistema pode acionar (Reportes, Fala Fetely, Tarefas)\n- É meta-funcionalidade sobre o sistema em si (Configurações, Usuários, Processos)\n- Audita ou gerencia múltiplos pilares (Auditoria, Permissões)\n\n**Na prática:**\n- Rota dentro do bloco SNCFLayout em `App.tsx`\n- Link no SNCFSidebar, não em AppSidebar/TISidebar\n- URL pode começar com `/sncf/` ou `/admin/` — ambos sinalizam transversalidade\n\n**Exemplos já aplicados:** Portal, Tarefas, Processos, Fala Fetely, Gerenciar Usuários, Meus Dados, Meus Acessos, Reportes do Sistema.\n\n**Futuro:** N005 Configurações nasce transversal — SNCFLayout + SNCFSidebar desde o começo.',
  NULL, 'todos', 'Aprendizado emergente 19/04/2026',
  ARRAY['metodologia','arquitetura','sncf','uauuu','transversal','navegacao'], true, 'manual'
WHERE NOT EXISTS (SELECT 1 FROM public.fala_fetely_conhecimento WHERE titulo = 'Funcionalidade multi-sistema pertence à camada transversal (SNCF/Uauuu)');

INSERT INTO public.fala_fetely_conhecimento (categoria, titulo, conteudo, area_negocio, publico_alvo, fonte, tags, ativo, origem)
SELECT 'diretriz',
  'Processo silencioso vs mapeado — tem R humano?',
  E'**Doutrina de Processos Fetely.**\n\nProcesso entra em Processos Fetely (vira processo mapeado) se tem um **R (Responsável) humano ou papel identificável**, mesmo que seja processo técnico (ex: integração de sistemas, automação que alguém supervisiona).\n\nOperações técnicas internas sem R identificável (triggers de banco, validações automáticas, envios de email disparados por gatilho) continuam **silenciosas** — rodam sozinhas, não poluem a base de processos.\n\n**Regra simples:**\n- "Tem R? Vai pro mapa."\n- "Não tem? Fica silencioso."\n\n**Por que importa:** processo mapeado deve ser *útil para alguém operar*. Se ninguém opera, não é processo no sentido humano — é infraestrutura.',
  NULL, 'todos', 'Aprendizado emergente — Processos Fetely',
  ARRAY['metodologia','processos','doutrina','mapeamento','silencioso'], true, 'manual'
WHERE NOT EXISTS (SELECT 1 FROM public.fala_fetely_conhecimento WHERE titulo = 'Processo silencioso vs mapeado — tem R humano?');

INSERT INTO public.fala_fetely_conhecimento (categoria, titulo, conteudo, area_negocio, publico_alvo, fonte, tags, ativo, origem)
SELECT 'diretriz',
  'Memória sem prova é hipótese — GitHub é verdade',
  E'**Princípio #1 da Metodologia Uauuu.**\n\nMemória do Claude (ou sua, Flavio) sobre "o que tem no sistema" é **hipótese até provar no código**. Antes de afirmar que algo existe ou não existe, ou que foi feito ou não foi: `git pull` + `grep` + `view`.\n\nAntes de declarar uma melhoria como pendente no roadmap, conferir se ela já não foi feita em sessão anterior. Já descobrimos várias vezes que achávamos que algo estava pendente mas já estava implementado silenciosamente.\n\n**Sinais de que é hora de verificar:**\n- "Acho que isso não existe no sistema..."\n- "Me parece que a tabela X tem Y colunas..."\n- "Faltou fazer Z..."\n\n**"Comemos bola?"** é pergunta legítima e importante. Fazer sempre que houver dúvida.',
  NULL, 'todos', 'docs/METODOLOGIA_UAUUU.md#principios',
  ARRAY['metodologia','principio','github','verdade','validacao'], true, 'manual'
WHERE NOT EXISTS (SELECT 1 FROM public.fala_fetely_conhecimento WHERE titulo = 'Memória sem prova é hipótese — GitHub é verdade');

INSERT INTO public.fala_fetely_conhecimento (categoria, titulo, conteudo, area_negocio, publico_alvo, fonte, tags, ativo, origem)
SELECT 'diretriz',
  'Fechar antes de abrir — disciplina de mesa limpa',
  E'**Princípio #2 da Metodologia Uauuu.**\n\nDisciplina de não empilhar pendências novas em cima das antigas. Quando a mesa está suja de itens pendentes, **primeiro limpa** antes de puxar item novo.\n\n**Na prática:**\n- Se surge ideia nova no meio de um fechamento: registrar no roadmap, não executar\n- Item novo vai pra fila; item em andamento termina primeiro\n- "Vamos aproveitar e fazer X junto" é quase sempre armadilha\n\n**Exceção legítima:** quando o item novo é **pré-requisito** do que estamos fechando (descoberta). Aí entra como subtarefa do prompt atual, não como item paralelo.\n\n**Frase-guia do Flavio:** "Não vamos entrar em coisa nova, antes de resolver tudo, ok?"',
  NULL, 'todos', 'docs/METODOLOGIA_UAUUU.md#principios',
  ARRAY['metodologia','principio','disciplina','mesa-limpa','foco'], true, 'manual'
WHERE NOT EXISTS (SELECT 1 FROM public.fala_fetely_conhecimento WHERE titulo = 'Fechar antes de abrir — disciplina de mesa limpa');

INSERT INTO public.fala_fetely_conhecimento (categoria, titulo, conteudo, area_negocio, publico_alvo, fonte, tags, ativo, origem)
SELECT 'diretriz',
  'Neutralidade é abandono — sempre dar recomendação',
  E'**Regra de ouro da Metodologia Uauuu.**\n\nQuando o Flavio pede escolha entre opções, **nunca** ficar neutro tipo "depende" ou "ambas são válidas". Neutralidade passa impressão de abandono — Flavio sai da conversa sem direção.\n\n**Sempre dar recomendação explícita**, mesmo que as opções pareçam equivalentes. Se são genuinamente 50/50, dizer: *"tanto faz, me guie por X preferência"* em vez de ficar neutro.\n\n**A recomendação deve vir com justificativa** — o "porquê" importa tanto quanto o "qual". Isso permite ao Flavio discordar com informação.\n\n**O que NÃO é:**\n- Arrogância ou inflexibilidade\n- Impor visão única\n- Ignorar contexto\n\n**O que É:**\n- Compromisso com a decisão\n- Parceiro ativo, não consultor distante\n- Respeito pelo tempo e foco do Flavio',
  NULL, 'todos', 'docs/METODOLOGIA_UAUUU.md#regras-de-ouro',
  ARRAY['metodologia','regra-ouro','comunicacao','decisao','parceria'], true, 'manual'
WHERE NOT EXISTS (SELECT 1 FROM public.fala_fetely_conhecimento WHERE titulo = 'Neutralidade é abandono — sempre dar recomendação');

INSERT INTO public.fala_fetely_conhecimento (categoria, titulo, conteudo, area_negocio, publico_alvo, fonte, tags, ativo, origem)
SELECT 'regra',
  'Boards Uauuu — quem acionar quando (Jurídico)',
  E'**Board Jurídico da Fetely** — 4 consultores com perfis distintos. Claude os simula como mesa redonda quando tema sensível exige perspectiva específica.\n\n**Dr. Marcos Teixeira — Trabalhista & Compliance**\nEx-auditor do MTE. Pragmático, direto. Pensa em risco antes de custo.\nAcionar em: contratos PJ, admissão/rescisão CLT, eSocial, NRs (chão de fábrica Joinville), ponto, comprovação trabalhista.\n\n**Dra. Ana Cláudia Ferreira — Tributário & Fiscal**\nTributarista com especialização em importação. Meticulosa. Acha oportunidade onde outros veem só custo.\nAcionar em: regime tributário, importação, ICMS/IPI/PIS/COFINS, NF-e, Bling ERP, planejamento fiscal.\n\n**Dr. Pedro Cavalcanti — Societário & PI**\nVisão de longo prazo. Conservador em estrutura, agressivo em proteção de ativos.\nAcionar em: estrutura societária (LMJPAR), proteção da marca FETÉLY, PI do software, M&A, governança, termos comerciais.\n\n**Dra. Renata Souza — Regulatório & LGPD**\nMetodológica. Não deixa nada em aberto.\nAcionar em: LGPD, DPO, política de retenção, termos de uso, consentimento, coleta de dado pessoal, política de visibilidade salarial.\n\n**Regras práticas:**\n- Rescisão CLT → Dr. Marcos obrigatório\n- Novos contratos PJ → Dr. Marcos + Dra. Ana Cláudia\n- Importação / NF-e → Dra. Ana Cláudia\n- Nova feature coletando dado pessoal → Dra. Renata\n- Qualquer contrato comercial → Dr. Pedro + especialista da área\n- Unidade fabril Joinville → Dr. Marcos (NRs) + Dra. Renata (LGPD operacional)\n\n*O valor do board é o ângulo que cada consultor traria, não autoridade. Claude simulando Dra. Renata traz a pergunta que ela faria, o risco que ela veria.*',
  NULL, 'admin_rh', 'docs/METODOLOGIA_UAUUU.md',
  ARRAY['metodologia','board','juridico','consultoria','compliance'], true, 'manual'
WHERE NOT EXISTS (SELECT 1 FROM public.fala_fetely_conhecimento WHERE titulo = 'Boards Uauuu — quem acionar quando (Jurídico)');

INSERT INTO public.fala_fetely_conhecimento (categoria, titulo, conteudo, area_negocio, publico_alvo, fonte, tags, ativo, origem)
SELECT 'regra',
  'Boards Uauuu — quem acionar quando (People Fetely)',
  E'**Board People Fetely** — 4 especialistas em cultura, operação, recrutamento e performance. Ativados em decisões sobre experiência do colaborador, fluxos de RH ou compliance operacional.\n\n**Beatriz Lemos — Cultura & UX dos fluxos**\nResponsável por experiência, copy humano, identidade visual em fluxos críticos.\nAcionar em: design de tela crítica, templates de email (precisam ter "cheiro Fetely"), primeira impressão de novos colaboradores, manifesto nas interfaces.\nRegra: nenhum fluxo vai para produção sem revisão de UX dela.\n\n**Ricardo Mendes — Ops & Compliance**\nResponsável por processos operacionais, folha, ponto, auditoria.\nAcionar em: qualquer alteração em folha/ponto, relatórios de auditoria, trilha de compliance.\nRegra: nenhuma alteração em folha/ponto sem trilha de auditoria aprovada por ele.\n\n**Camila Fonseca — Recrutamento & Onboarding**\nResponsável por funil de candidatos e experiência da chegada.\nAcionar em: qualquer tela de recrutamento, formulários de candidatura, fluxo de onboarding.\nRegra: AS-IS do processo validado antes de qualquer tela nova.\n\n**Thiago Serrano — Performance & LGPD**\nResponsável por avaliações, LGPD operacional, métricas de pessoas.\nAcionar em: ciclos de avaliação, coleta de dado pessoal novo, métricas comportamentais, retenção de dados.\nRegra: nenhuma coleta de dado pessoal vai para produção sem check dele.\n\n**Como funciona na prática:**\nEm design de feature sensível, Claude simula mesa redonda com 2-4 consultores apropriados, trazendo posições diferentes antes de propor caminho único. A divergência entre consultores enriquece a decisão final.',
  NULL, 'admin_rh', 'docs/METODOLOGIA_UAUUU.md',
  ARRAY['metodologia','board','people','consultoria','rh','cultura'], true, 'manual'
WHERE NOT EXISTS (SELECT 1 FROM public.fala_fetely_conhecimento WHERE titulo = 'Boards Uauuu — quem acionar quando (People Fetely)');

INSERT INTO public.fala_fetely_conhecimento (categoria, titulo, conteudo, area_negocio, publico_alvo, fonte, tags, ativo, origem)
SELECT 'conceito',
  'Uauuu = SNCF — o ecossistema Fetely',
  E'**Uauuu** e **SNCF** são sinônimos na linguagem interna da Fetely.\n\n**SNCF** = Sistema Nervoso Central Fetely — o nome técnico/arquitetural.\n**Uauuu** = o nome afetivo, celebrativo, Fetely.\n\nOs dois se referem ao mesmo ecossistema de sistemas interligados construído a partir de abril/2026.\n\n**O que compõe o Uauuu (até 19/04/2026):**\n- **Portal SNCF** (`/sncf`) — tela de entrada unificada\n- **People Fetely** — gestão de pessoas (CLT + PJ)\n- **TI Fetely** — ativos e documentação técnica\n- **Processos Fetely** — base viva de processos operacionais (PF1→PF3.1)\n- **Fala Fetely** — base de conhecimento com assistente de IA\n- **Fetely em Números** (embrionário) — pilar de indicadores\n- **Infraestrutura transversal** — Tarefas, Gerenciar Usuários, Reportes, Meus Dados, Meus Acessos, Gestão à Vista\n- **Ciclo de Acesso do Colaborador** — fluxo de auth unificado\n- **Visibilidade de Salário** (S1+S2+S3) — política LGPD formal\n\n**Camadas arquiteturais:**\n1. **Transversal** (SNCFLayout + SNCFSidebar) — funcionalidades que atendem todos os sistemas\n2. **Pilares** (People, TI, Marca, etc) — áreas de domínio específico\n3. **Operação** — fluxos e processos executáveis\n\n**A linguagem "Uauuu" vem do DNA de celebração da Fetely** — o ecossistema, como tudo na Fetely, é motivo de festejar quando algo fica bonito e funcional.',
  NULL, 'todos', 'DNA Fetely + arquitetura',
  ARRAY['uauuu','sncf','arquitetura','ecossistema','conceito','nuclear'], true, 'manual'
WHERE NOT EXISTS (SELECT 1 FROM public.fala_fetely_conhecimento WHERE titulo = 'Uauuu = SNCF — o ecossistema Fetely');