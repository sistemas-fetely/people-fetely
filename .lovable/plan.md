

## Plano: Aplicar permissões granulares no módulo Notas Fiscais

### Problema
As páginas `NotasFiscais.tsx` e `NotaFiscalDetalhe.tsx` não verificam permissões. Um Colaborador PJ com apenas `view` consegue criar, editar, excluir NFs, alterar status no pipeline e enviar e-mail. O RLS no banco impede a gravação, mas a UI não reflete isso.

### Permissões já existentes no sistema
O módulo `notas_fiscais` já possui os 4 CRUD (`view`, `create`, `edit`, `delete`) + a especial `enviar_email`. Mas existe uma lacuna: **alterar status** (pipeline) e **aprovar** são ações distintas de "editar campos". Precisamos de uma nova permissão especial.

### Nova permissão especial proposta
| Permissão | Módulo | Descrição |
|-----------|--------|-----------|
| `aprovar` | `notas_fiscais` | Permite avançar/alterar status no pipeline da NF |

Isso permite que um perfil possa **editar dados** da NF (número, valor, datas) mas sem poder **mudar o status** — ou vice-versa.

### Implementação

#### Passo 1 — Registrar nova permissão especial
Em `src/hooks/usePermissions.ts`, adicionar ao array `SPECIAL_PERMISSIONS`:
```
{ key: "aprovar", label: "Aprovar/Alterar Status", module: "notas_fiscais" }
```

#### Passo 2 — Migração SQL: inserir permissão para perfis admin
Inserir rows `(role_name, module, permission, granted, colaborador_tipo)` para `super_admin`, `gestor_rh` e `financeiro` com `permission = 'aprovar'`, `module = 'notas_fiscais'`, `granted = true`.

#### Passo 3 — `NotasFiscais.tsx` (listagem)
- Importar `usePermissions`
- Calcular: `canCreate`, `canEdit`, `canDelete`
- Esconder botão **"Nova NF"** se `!canCreate`
- No dropdown de ações por linha:
  - Esconder "Editar" se `!canEdit`
  - Esconder "Excluir" se `!canDelete`
  - Se nenhuma ação disponível (só "Visualizar"), remover o dropdown e deixar apenas o clique na linha

#### Passo 4 — `NotaFiscalDetalhe.tsx` (detalhe)
- Importar `usePermissions`
- Calcular: `canEdit`, `canApprove = hasPermission("notas_fiscais", "aprovar")`, `canSendEmail = hasPermission("notas_fiscais", "enviar_email")`
- Esconder botão **"Editar"** se `!canEdit`
- Esconder botão **"Enviar por E-mail"** se `!canSendEmail`
- **Pipeline de status**: desabilitar todos os botões de mudança de status se `!canApprove`; mostrar o pipeline como read-only (visualização do status atual sem interação)
- **Ações rápidas** (Cancelada/Vencida): esconder se `!canApprove`
- Upload/exclusão de arquivo: esconder se `!canEdit`

### Arquivos alterados
- `src/hooks/usePermissions.ts` — adicionar `aprovar` para `notas_fiscais`
- `src/pages/NotasFiscais.tsx` — condicionar botões/ações
- `src/pages/NotaFiscalDetalhe.tsx` — condicionar pipeline, e-mail, editar
- **Migração SQL** — inserir permissão `aprovar` para perfis administrativos

