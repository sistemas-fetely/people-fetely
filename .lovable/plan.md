

## Plano: Adicionar botão "Aprovar" para usuários pendentes

### Problema
Usuários com status "Pendente" (`approved: false`, sem ban) não têm nenhum botão para serem aprovados. A UI atual só diferencia entre "Ativo" (mostra "Inativar") e "Inativo/banned" (mostra "Ativar"). O estado intermediário "Pendente" não tem ação.

### Solução

#### 1. Adicionar action `approve` na edge function `manage-user/index.ts`
Criar um novo case `approve` que simplesmente faz `UPDATE profiles SET approved = true WHERE user_id = $1`. Isso é diferente de "unban" — não precisa mexer no ban do auth.

#### 2. Adicionar mutation `approveUser` em `GerenciarUsuarios.tsx`
Chamar `callManageUser("approve", { user_id })` e invalidar as queries.

#### 3. Ajustar a lógica de botões na tabela (coluna Ações)
Atualmente a lógica é binária: `isBanned ? Ativar : Inativar`. Precisa ser ternária:
- **Banned** → botão "Ativar" (unban)
- **Pendente** (`!approved && !isBanned`) → botão "Aprovar" (verde, ícone `UserCheck`)
- **Ativo** (`approved && !isBanned`) → botão "Inativar" (ban)

### Arquivos alterados
- `supabase/functions/manage-user/index.ts` — adicionar case `approve`
- `src/pages/GerenciarUsuarios.tsx` — adicionar mutation + botão condicional

