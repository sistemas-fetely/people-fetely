
-- Step 1: Capture existing grants for ferias/beneficios before cleanup
CREATE TEMP TABLE _temp_grants AS
SELECT DISTINCT role_name, module, permission, 
  bool_or(granted) as granted
FROM role_permissions
WHERE module IN ('ferias', 'beneficios')
  AND colaborador_tipo IN ('clt', 'pj')
GROUP BY role_name, module, permission;

-- Step 2: Delete old clt/pj specific rows
DELETE FROM role_permissions
WHERE module IN ('ferias', 'beneficios')
  AND colaborador_tipo IN ('clt', 'pj');

-- Step 3: Insert unified 'all' rows (skip if already exists)
INSERT INTO role_permissions (role_name, module, permission, colaborador_tipo, granted)
SELECT t.role_name, t.module, t.permission, 'all', t.granted
FROM _temp_grants t
WHERE NOT EXISTS (
  SELECT 1 FROM role_permissions rp
  WHERE rp.role_name = t.role_name
    AND rp.module = t.module
    AND rp.permission = t.permission
    AND rp.colaborador_tipo = 'all'
)
ON CONFLICT (role_name, module, permission, colaborador_tipo) DO NOTHING;

-- Step 4: Ensure all roles have ferias and beneficios permissions with 'all'
INSERT INTO role_permissions (role_name, module, permission, colaborador_tipo, granted)
SELECT cr.name, m.module, p.permission, 'all', 
  CASE WHEN cr.name IN ('super_admin', 'gestor_rh') THEN true ELSE false END
FROM custom_roles cr
CROSS JOIN (VALUES ('ferias'), ('beneficios')) AS m(module)
CROSS JOIN (VALUES ('view'), ('create'), ('edit'), ('delete')) AS p(permission)
WHERE NOT EXISTS (
  SELECT 1 FROM role_permissions rp
  WHERE rp.role_name = cr.name
    AND rp.module = m.module
    AND rp.permission = p.permission
    AND rp.colaborador_tipo = 'all'
)
ON CONFLICT (role_name, module, permission, colaborador_tipo) DO NOTHING;

DROP TABLE _temp_grants;
