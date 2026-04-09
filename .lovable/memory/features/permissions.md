---
name: Role-based permissions system
description: Parametrizable permissions per role per module with CRUD + special actions
type: feature
---
- Tables: custom_roles (name, description, is_system), role_permissions (role_name, module, permission, granted)
- role_permissions unique key: (role_name, module, permission, colaborador_tipo) — allows separate CLT/PJ rules
- DB function: has_permission(user_id, module, permission) — security definer
- DB function: get_user_colaborador_tipo(user_id) — prioritizes profiles.colaborador_tipo, fallback to table detection
- Hook: usePermissions() — canView/canCreate/canEdit/canDelete/hasPermission
- Component: PermissionGate — wraps children with permission check
- Sidebar AND routes both use canView(module) via same permission system
- ProtectedRoute supports permModule/permAction props (replaces hardcoded allowedRoles)
- Config page: /configurar-perfis — grid of modules × permissions with switches
- 17 modules: dashboard, colaboradores, contratos_pj, folha_pagamento, ferias, beneficios, movimentacoes, notas_fiscais, pagamentos_pj, organograma, convites, recrutamento, avaliacoes, treinamentos, relatorios, parametros, usuarios
- 4 CRUD + 5 special: enviar_email, aprovar, fechar, exportar, enviar
