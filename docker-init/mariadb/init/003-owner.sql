USE portaldb;

INSERT IGNORE INTO organizations (
  organization_code,
  organization_name,
  status
) VALUES (
  'owner',
  'Owner',
  'ACTIVE'
);

INSERT IGNORE INTO users (
  organization_id,
  username,
  display_name,
  email,
  password_sha256,
  password_algo,
  status
)
SELECT
  organization.id,
  seed.username,
  seed.display_name,
  seed.email,
  SHA2(seed.password_plaintext, 256),
  'SHA256',
  'ACTIVE'
FROM (
  SELECT 'root1' AS username, 'Root 1' AS display_name, 'root1@example.com' AS email, 'root1password' AS password_plaintext
  UNION ALL SELECT 'root2', 'Root 2', 'root2@example.com', 'root2password'
  UNION ALL SELECT 'user1', 'User 1', 'user1@example.com', 'user1password'
  UNION ALL SELECT 'user2', 'User 2', 'user2@example.com', 'user2password'
) AS seed
INNER JOIN organizations organization
  ON organization.organization_code = 'owner';

INSERT IGNORE INTO user_groups (
  organization_id,
  group_code,
  group_name,
  description,
  status
)
SELECT
  organization.id,
  seed.group_code,
  seed.group_name,
  seed.description,
  'ACTIVE'
FROM (
  SELECT 'OwnerAdmin' AS group_code, 'Owner Admin' AS group_name, 'Administrative group for owner root users.' AS description
  UNION ALL SELECT 'OwnerUser', 'Owner User', 'Standard owner users with limited menu visibility.'
) AS seed
INNER JOIN organizations organization
  ON organization.organization_code = 'owner';

INSERT IGNORE INTO user_group_memberships (
  user_group_id,
  user_id
)
SELECT
  user_group.id,
  user.id
FROM (
  SELECT 'OwnerAdmin' AS group_code, 'root1' AS username
  UNION ALL SELECT 'OwnerAdmin', 'root2'
  UNION ALL SELECT 'OwnerUser', 'user1'
  UNION ALL SELECT 'OwnerUser', 'user2'
) AS seed
INNER JOIN organizations organization
  ON organization.organization_code = 'owner'
INNER JOIN user_groups user_group
  ON user_group.organization_id = organization.id
  AND user_group.group_code = seed.group_code
INNER JOIN users user
  ON user.organization_id = organization.id
  AND user.username = seed.username;

INSERT IGNORE INTO user_group_permissions (
  user_group_id,
  permission_id
)
SELECT
  user_group.id,
  permission.id
FROM (
  SELECT 'MENU_TRANSACTION_OVERVIEW' AS permission_code
  UNION ALL SELECT 'MENU_TRANSACTION_INVOICES'
  UNION ALL SELECT 'MENU_ADMIN_USERS'
  UNION ALL SELECT 'MENU_ADMIN_ROLES'
) AS seed
INNER JOIN organizations organization
  ON organization.organization_code = 'owner'
INNER JOIN user_groups user_group
  ON user_group.organization_id = organization.id
  AND user_group.group_code = 'OwnerUser'
INNER JOIN permissions permission
  ON permission.permission_code = seed.permission_code;