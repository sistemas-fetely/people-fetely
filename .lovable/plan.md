

## Plano: Email de aprovação de cadastro

### O que será feito
Quando o admin clicar em "Aprovar" na tela de Gerenciar Usuários, o sistema enviará automaticamente um email elegante ao usuário informando que seu acesso foi aprovado.

### Implementação

#### 1. Criar template de email `cadastro-aprovado.tsx`
Arquivo: `supabase/functions/_shared/transactional-email-templates/cadastro-aprovado.tsx`

Template React Email com visual consistente com os emails existentes (estilo corporativo azul `#1a3a5c`). Conteúdo:
- Título: "Cadastro Aprovado!"
- Mensagem informando que a conta foi aprovada e o acesso ao sistema está liberado
- Botão "Acessar o Sistema" apontando para o login
- Rodapé padrão

Aceita prop opcional `nome` para personalização.

#### 2. Registrar template no `registry.ts`
Adicionar import e entrada `'cadastro-aprovado'` no mapa `TEMPLATES`.

#### 3. Atualizar `manage-user/index.ts` — action `approve`
Após o `UPDATE profiles SET approved = true`, buscar o email do usuário via `auth.admin.getUserById()` e o nome do perfil, depois invocar `send-transactional-email` internamente (via `supabase.functions.invoke`) passando:
- `templateName: 'cadastro-aprovado'`
- `recipientEmail: user.email`
- `idempotencyKey: 'cadastro-aprovado-{user_id}'`
- `templateData: { nome }`

#### 4. Deploy das edge functions
Redeployar `send-transactional-email` (template atualizado) e `manage-user` (lógica de envio).

### Arquivos alterados
- `supabase/functions/_shared/transactional-email-templates/cadastro-aprovado.tsx` — novo
- `supabase/functions/_shared/transactional-email-templates/registry.ts` — adicionar template
- `supabase/functions/manage-user/index.ts` — enviar email após aprovação

