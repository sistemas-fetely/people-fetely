---
name: Role-based permissions system
description: Parametrizable permissions per role per module with CRUD + special actions
type: feature
---
- Tables: custom_roles (name, description, is_system), role_permissions (role_name, module, permission, granted)
- DB function: has_permission(user_id, module, permission) — security definer
- Hook: usePermissions() — canView/canCreate/canEdit/canDelete/hasPermission
- Component: PermissionGate — wraps children with permission check
- Sidebar filters menus based on canView(module)
- Config page: /configurar-perfis — grid of modules × permissions with switches
- 13 modules: dashboard, colaboradores, contratos_pj, folha_pagamento, ferias, beneficios, movimentacoes, notas_fiscais, pagamentos_pj, organograma, convites, parametros, usuarios
- 4 CRUD + 5 special: enviar_email, aprovar, fechar, exportar, enviar
