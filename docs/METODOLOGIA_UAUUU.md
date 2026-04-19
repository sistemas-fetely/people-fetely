# Metodologia Uauuu — Como a Fetely constrói tecnologia

**Documento fundacional · v1.0 · 19/04/2026**

> *"Gesto não se delega pro ChatGPT. Mas bom trabalho com método pode virar cultura."*

---

## Sobre este documento

Este é o **modo de trabalhar** do Uauuu (nosso Sistema Nervoso Central Fetely). Não é manual técnico — é a cultura de construção que emergiu nas primeiras sessões, codificada para se perpetuar.

Toda nova sessão de desenvolvimento começa aqui. Toda nova pessoa que entrar no projeto lê isso antes de tocar em código. Todo dilema de método, consultar aqui primeiro.

**Autores originais:** Flavio (direção) + Claude (execução). Observado na prática, capturado em doutrina.

---

## I · Os 8 Princípios

### 1. Verdade vem do código, não da memória

Memória é hipótese até provar no código. Antes de afirmar que algo existe ou não existe, `git pull` + `grep` + `view`. Antes de declarar uma melhoria como pendente, conferir se já não foi feita. Sessões anteriores podem ter evoluído o sistema de formas que não lembramos.

*"Comemos bola?"* é uma pergunta legítima e frequente. A resposta honesta é o que importa.

### 2. Fechar antes de abrir

Disciplina de não empilhar pendências novas em cima das antigas. Quando a mesa está suja, primeiro limpa. Tentação de ir pro brilhante seguinte é normal — resistir protege o sistema e a sanidade.

*"Não vamos entrar em coisa nova, antes de resolver tudo."*

### 3. Agrupamento coeso, nunca monolítico nem fragmentado

Prompt gigante com 20 itens = risco descontrolado. Prompt com 1 item = desperdício de ciclos. O ponto ótimo é **3 a 6 itens que tocam a mesma superfície e não introduzem risco cruzado**. Se não conseguir agrupar assim, é sinal de que os itens são de naturezas diferentes.

### 4. Análise crítica antes de prompt

Entre escutar a demanda e escrever o prompt, há um momento obrigatório de reflexão. Três perguntas: *Faz sentido como pediu? Tem modo melhor? Falta alguma decisão antes de começar?* Quando a resposta a essas perguntas mudaria o prompt, devolver análise ANTES de código.

### 5. Infraestrutura de feedback antes de mudanças em superfície

Se há risco de regressão nas próximas mudanças, primeiro constrói canal de detecção (logs, reportes, auditoria). Não adianta entregar feature nova se não há como saber quando algo quebrou.

*Ordem do fechamento desta sessão: D (reportes) → A (UI) → B (correções) → C (limpeza) foi proposital.*

### 6. Validação obrigatória pós-publicação

Código publicado é hipótese até ser conferido. A cada prompt publicado: `git pull`, ler migration, validar componentes novos, rodar `grep` nas mudanças principais, relatar honestamente o que entrou (incluindo se veio **mais** ou **menos** do que esperado — ambos são informação).

Bugs silenciosos descobertos nesse processo (como o `data_fim` vs `data_desligamento` em PJ no Prompt C) são **presentes da metodologia**, não exceções.

### 7. Roadmap atualizado entre prompts, nunca no fim

O `Melhorias_Roadmap_PeopleFetely.md` é fonte única de verdade. Se parar a sessão no meio, o próximo que chegar (inclusive você mesmo em outro dia) precisa saber onde paramos. **Mini-prompt de atualização entre prompts grandes** é custo pequeno para benefício permanente.

### 8. Doutrinas emergentes viram regras permanentes

Quando uma decisão tomada **agora** ensina algo que deveria ser aplicado **sempre**, capturar como doutrina antes que esqueça. Exemplos reais desta sessão:

- *"Funcionalidade multi-sistema pertence à camada transversal"* (saiu do conserto do Reportes no menu)
- *"Tem R humano? Vai pro mapa. Não tem? Fica silencioso"* (saiu de Processos Fetely)
- *"Dimensão sempre via tabela, nunca hardcode"* (saiu da migração de cargos)
- *"Processo-dentro-de-processo vai pra sugestões, não para o trabalho atual"* (saiu do Onboarding)

---

## II · O Ciclo Uauuu

Fluxo padrão de qualquer sessão de desenvolvimento:

```
1. ABERTURA
   ├─ git pull + ler Melhorias_Roadmap_PeopleFetely.md
   ├─ validar memórias do Claude contra código real
   └─ identificar o que o Flavio quer tratar hoje

2. CAPTURA (sem código ainda)
   ├─ escutar demanda com atenção
   ├─ fazer perguntas se ambíguo
   └─ se tiver decisão pendente, listar antes de avançar

3. ANÁLISE CRÍTICA
   ├─ a demanda faz sentido como pedida?
   ├─ tem modo melhor de fazer?
   ├─ risco cruzado com outras partes?
   ├─ precisa opinião de algum consultor do board?
   └─ devolver proposta ajustada com justificativa

4. AGRUPAMENTO
   ├─ 1 a 4 prompts, não mais
   ├─ cada prompt coeso internamente
   ├─ ordem leva em conta dependência e risco
   └─ se houver fundação nova, ela vem primeiro

5. DECISÕES PENDENTES
   ├─ listar o que bloqueia antes de escrever
   ├─ perguntas bloqueantes separadas de perguntas de curiosidade
   └─ aguardar decisão ANTES de escrever código

6. ESCRITA DO PROMPT
   ├─ contexto explícito
   ├─ partes numeradas
   ├─ código completo (migrations, componentes, hooks)
   ├─ seção "o que NÃO fazer"
   ├─ testes de validação SQL + UI
   └─ commit message sugerida

7. PUBLICAÇÃO (Flavio no Lovable)

8. VALIDAÇÃO (Claude)
   ├─ git pull
   ├─ conferir migration
   ├─ grep caso a caso de componentes novos
   ├─ relatar honesto: entregou tudo? faltou? veio bônus?
   └─ tabela de validação com ✅/❌ por item

9. ROADMAP
   ├─ marcar itens concluídos
   ├─ registrar bônus descobertos
   ├─ adicionar pendências novas se surgiram
   └─ commit entre prompts, nunca só no fim

10. CELEBRAÇÃO
    └─ quando merecido, celebrar. Cultura Fetely.
```

---

## III · Os 3 tipos de prompt

| Tipo | Quando | Tamanho | Cuidado |
|---|---|---|---|
| **Cirúrgico** | Fix pontual, doutrina fresca, 1-2 arquivos | Pequeno (~1 página) | Ir direto ao osso, não expandir escopo |
| **Agrupado coeso** | Múltiplos itens que tocam mesma superfície | Médio (2-4 páginas) | Não misturar camadas diferentes (UI + DB + business logic no mesmo) |
| **Fundação** | Pilar novo, arquitetura nova | Grande, faseado | Dividir em PF1→PF2→PF3 com validação entre fases |

**Regra de ouro:** se dá dúvida se cabe num prompt, fatiar. Cirúrgico publicado vale mais que gigante pela metade.

---

## IV · Regras de ouro

- **Memória sem prova é hipótese.** GitHub é verdade.
- **Neutralidade é abandono.** Sempre dar recomendação explícita.
- **Pergunta bloqueante separada do código.** Nunca misturar.
- **Dimensão via tabela, nunca hardcode.** Se não tem tabela, parar e criar.
- **Tem R humano? Vai pro mapa.** Não tem? Fica silencioso.
- **Toda construção alimenta Processos Fetely + DNA TI.** Feature órfã é dívida.
- **Processo-dentro-de-processo vai pra sugestões, não para o trabalho atual.**
- **Funcionalidade multi-sistema pertence à camada transversal** (SNCF/Uauuu).
- **CLT e PJ recebem mesmo tratamento.** Diferença só nos deveres legais.
- **Silêncio é sinal.** WhatsApp do RH silencioso é o sinal de que o sistema funciona.

---

## V · Os Boards Consultivos — a voz das perspectivas que eu não tenho

Esta é a parte mais sofisticada da metodologia e a mais fácil de esquecer. **O Flavio não toma decisões sozinho com o Claude** — ele orquestra um board invisível de consultores especializados, cada um com perspectiva própria. Quando ele diz *"o que o Dr. Marcos acharia disso?"* ou *"a Dra. Renata vai aprovar?"*, está forçando a análise a passar por um filtro humano que o código sozinho não traz.

### Board Jurídico

Ativar quando o tema envolver contrato, compliance, risco trabalhista, dados pessoais ou proteção de ativos.

| Consultor | Perfil | Aciona quando |
|---|---|---|
| **Dr. Marcos Teixeira** — Trabalhista & Compliance | Ex-auditor do MTE. Pragmático, direto. Pensa em risco antes de custo. | Contratos PJ, admissão/rescisão CLT, eSocial, NRs (chão de fábrica Joinville), ponto |
| **Dra. Ana Cláudia Ferreira** — Tributário & Fiscal | Tributarista com especialização em importação. Meticulosa. Acha oportunidade onde outros veem só custo. | Regime tributário, importação, ICMS/IPI/PIS/COFINS, NF-e, Bling ERP |
| **Dr. Pedro Cavalcanti** — Societário & PI | Visão de longo prazo. Pensa na Fetely de daqui a 10 anos. Conservador em estrutura, agressivo em proteção de ativos. | Estrutura societária (LMJPAR), proteção da marca FETÉLY, PI do software, M&A, governança |
| **Dra. Renata Souza** — Regulatório & LGPD | Metodológica. Não deixa nada em aberto. | LGPD, DPO, política de retenção, termos de uso, consentimento, coleta de dado pessoal, política de visibilidade salarial |

### Board People Fetely

Ativar quando o tema envolver experiência do colaborador, cultura, fluxo de RH ou compliance operacional.

| Especialista | Foco | Regra |
|---|---|---|
| **Beatriz Lemos** — Cultura & UX dos fluxos | Experiência, copy humano, identidade visual nos fluxos críticos | Nenhum fluxo vai para produção sem revisão de UX. Templates de email precisam ter cheiro Fetely. |
| **Ricardo Mendes** — Ops & Compliance | Processos operacionais, folha, ponto, auditoria | Nenhuma alteração em folha/ponto sem trilha de auditoria. |
| **Camila Fonseca** — Recrutamento & Onboarding | Funil de candidatos, experiência da chegada | AS-IS validado antes de qualquer tela de recrutamento ou onboarding. |
| **Thiago Serrano** — Performance & LGPD | Avaliações, LGPD operacional, métricas de pessoas | Nenhuma coleta de dado pessoal vai para produção sem check. |

### Como os boards realmente entram no fluxo

Não são aprovadores externos que precisam ser consultados a cada movimento. São **filtros de perspectiva** que o Flavio usa em momentos de decisão estruturante:

1. **Em design de feature sensível**, o Claude simula o board como mesa redonda, trazendo posições de 2-4 consultores com perfis diferentes, antes de propor caminho. Exemplos desta sessão:
   - *Board do processo "Acesso do Colaborador"* — Thiago falou de separação email pessoal/corporativo, Ricardo falou de comprovação de entrega, Renata falou de política de senha, Marcos falou de comprovação trabalhista, Beatriz falou de identidade visual, Pedro falou de termo de uso.
   - *Board da política de visibilidade salarial* — Renata (LGPD + log), Marcos (perfil Gestão Direta), Beatriz (UX do "revelar em lote"), Pedro (proteção de dado corporativo).

2. **Em pendências estruturais**, o board é identificado como responsável e o item fica vinculado a ele até ser resolvido. Exemplos no roadmap:
   - N001 Controle de Ponto → Ricardo Mendes
   - C001 DPO designado → Dra. Renata
   - N003 Avaliações → Thiago Serrano

3. **Em divergências de método**, consultar o consultor adequado resolve. Dr. Marcos e Dra. Ana Cláudia podem discordar sobre um contrato PJ — a divergência enriquece a decisão final.

### Quando ativar qual board — regras práticas

| Situação | Aciona |
|---|---|
| Rescisão CLT | Dr. Marcos obrigatório |
| Novos contratos PJ | Dr. Marcos + Dra. Ana Cláudia |
| Importação / NF-e | Dra. Ana Cláudia |
| Nova feature coletando dado pessoal | Dra. Renata |
| Qualquer contrato comercial | Dr. Pedro + especialista da área |
| Unidade fabril (Joinville) | Dr. Marcos (NRs) + Dra. Renata (LGPD operacional) |
| Fluxo novo de RH | Board People (os 4) |
| Design de tela crítica | Beatriz Lemos |
| Processo que vira auditoria | Ricardo Mendes |

### A regra mais importante sobre o board

**O board existe para o Flavio conseguir pensar com mais perspectivas do que as dele sozinho.** Quando o Claude simula um consultor, não está fingindo ter autoridade — está **trazendo para a mesa a pergunta que aquele consultor faria**. O valor é no ângulo, não na figura.

*Se o Flavio perguntar "o que a Dra. Renata acharia?", a resposta não é "ela aprovaria" — é descrever o que ela provavelmente perguntaria, qual risco veria, qual trade-off apontaria.*

---

## VI · O Checklist de Fechamento

Antes de marcar algo como ✅ concluído, todas as linhas abaixo precisam estar verdadeiras:

- [ ] Código validado por `git pull` + grep dos itens principais
- [ ] Migration aplicada e testes SQL rodados
- [ ] Teste de regressão em telas vizinhas
- [ ] Roadmap atualizado com data e resumo do que entrou
- [ ] Doutrina nova capturada se emergiu
- [ ] Processo Fetely criado/atualizado se aplicável
- [ ] Board apropriado consultado se tema sensível
- [ ] Comemoração na medida (se merecida 🎉)

---

## VII · Anti-padrões — o que NÃO fazer

Coisas que parecem boa ideia mas corroem o método:

- ❌ **"Só vou fazer rapidinho sem atualizar o doc"** — gera dívida invisível
- ❌ **"Ah, já sei o que tá no código"** — gera afirmação errada
- ❌ **"Vamos aproveitar e fazer um prompt gigante cobrindo tudo"** — gera regressão
- ❌ **"Deixa pra decidir depois"** sobre pergunta bloqueante — trava mais tarde
- ❌ **"É só UI, não precisa do board"** sobre tema que toca cultura ou LGPD
- ❌ **"Vou responder de memória essa"** sobre fato verificável em código
- ❌ **"Isso é item novo, vou resolver depois"** quando você está no meio de fechar a mesa

---

## VIII · Metodologia viva

Este documento **evolui**. Regras novas emergem do trabalho. Quando uma prática nova se provar em 2-3 sessões, ela entra aqui. Quando uma regra antiga virar engessamento em vez de guia, revisa.

**Como contribuir com a evolução:**

1. Trabalhar seguindo o método atual
2. Notar quando algo que não está aqui funcionou bem OU quando algo que está aqui atrapalhou
3. Trazer pra conversa com o Flavio em momento calmo
4. Se virar consenso, editar este arquivo no próximo ciclo de atualização de docs vivos

---

## IX · Origem e autores

Esta metodologia emergiu ao longo das primeiras sessões do Uauuu (abril/2026), consolidada na sessão de 19/04/2026 após o fechamento das 4 frentes de mesa limpa (D→A→B→C). Os princípios vieram de prática, não de teoria.

**Direção:** Flavio  
**Execução:** Claude  
**Boards consultivos:** como descrito na Seção V

---

*Documento vivo · Cultura de trabalho do Uauuu · Revisão contínua · Última atualização: 19/04/2026*

*"Celebrar é fechar ciclo e olhar pra frente com o mesmo cuidado."*

— Equipe Fetely
