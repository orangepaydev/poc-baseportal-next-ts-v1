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
  user_type,
  status
)
SELECT
  organization.id,
  seed.username,
  seed.display_name,
  seed.email,
  SHA2(seed.password_plaintext, 256),
  'SHA256',
  seed.user_type,
  'ACTIVE'
FROM (
  SELECT 'root1' AS username, 'Root 1' AS display_name, 'root1@example.com' AS email, 'root1password' AS password_plaintext, 'ADMIN' AS user_type
  UNION ALL SELECT 'root2', 'Root 2', 'root2@example.com', 'root2password', 'ADMIN'
  UNION ALL SELECT 'user1', 'User 1', 'user1@example.com', 'user1password', 'NORMAL'
  UNION ALL SELECT 'user2', 'User 2', 'user2@example.com', 'user2password', 'NORMAL'
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
  UNION ALL SELECT 'UserGroupMaker', 'User Group Maker', 'Can submit create, update, and delete requests for user groups.'
  UNION ALL SELECT 'UserGroupChecker', 'User Group Checker', 'Can approve or reject pending user group requests.'
  UNION ALL SELECT 'UserMaker', 'User Maker', 'Can submit create, update, and delete requests for users.'
  UNION ALL SELECT 'UserChecker', 'User Checker', 'Can approve or reject pending user requests.'
  UNION ALL SELECT 'OrganizationMaker', 'Organization Maker', 'Can submit create, update, and delete requests for organizations.'
  UNION ALL SELECT 'OrganizationChecker', 'Organization Checker', 'Can approve or reject pending organization requests.'
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
  UNION ALL SELECT 'UserGroupMaker', 'root1'
  UNION ALL SELECT 'UserGroupChecker', 'root1'
  UNION ALL SELECT 'UserGroupChecker', 'root2'
  UNION ALL SELECT 'UserMaker', 'root1'
  UNION ALL SELECT 'UserChecker', 'root1'
  UNION ALL SELECT 'UserChecker', 'root2'
  UNION ALL SELECT 'OrganizationMaker', 'root1'
  UNION ALL SELECT 'OrganizationChecker', 'root1'
  UNION ALL SELECT 'OrganizationChecker', 'root2'
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
  -- Menu-driven workspace overview
  user_group.id,
  permission.id
FROM (
  SELECT 'OwnerAdmin' AS group_code, 'MENU_TRANSACTION_OVERVIEW' AS permission_code
  UNION ALL SELECT 'OwnerAdmin', 'MENU_TRANSACTION_INVOICES'
  UNION ALL SELECT 'OwnerAdmin', 'MENU_TRANSACTION_PAYMENTS'
  UNION ALL SELECT 'OwnerAdmin', 'MENU_ADMIN_USERS'
  UNION ALL SELECT 'OwnerAdmin', 'MENU_ADMIN_AUDIT_LOG'
  UNION ALL SELECT 'OwnerAdmin', 'USER_READ'
  UNION ALL SELECT 'OwnerAdmin', 'USER_GROUP_READ'
  UNION ALL SELECT 'OwnerAdmin', 'AUDIT_LOG_READ'

  UNION ALL SELECT 'OwnerAdmin', 'MENU_ADMIN_ORGANIZATION'
  UNION ALL SELECT 'OwnerAdmin', 'ORGANIZATION_READ'

  UNION ALL SELECT 'OwnerAdmin', 'MENU_ADMIN_APPROVAL_REQUEST'
  UNION ALL SELECT 'OwnerAdmin', 'APPROVAL_REQUEST_READ'

  UNION ALL SELECT 'OrganizationMaker', 'MENU_ADMIN_ORGANIZATION'
  UNION ALL SELECT 'OrganizationMaker', 'ORGANIZATION_READ'
  UNION ALL SELECT 'OrganizationMaker', 'ORGANIZATION_WRITE'

  UNION ALL SELECT 'OrganizationChecker', 'MENU_ADMIN_ORGANIZATION'
  UNION ALL SELECT 'OrganizationChecker', 'ORGANIZATION_READ'
  UNION ALL SELECT 'OrganizationChecker', 'ORGANIZATION_APPROVE'

  UNION ALL SELECT 'OrganizationChecker', 'MENU_ADMIN_APPROVAL_REQUEST'
  UNION ALL SELECT 'OrganizationChecker', 'APPROVAL_REQUEST_READ'

  UNION ALL SELECT 'UserGroupMaker', 'MENU_ADMIN_USER_GROUP'
  UNION ALL SELECT 'UserGroupMaker', 'USER_GROUP_READ'
  UNION ALL SELECT 'UserGroupMaker', 'USER_GROUP_WRITE'

  UNION ALL SELECT 'UserGroupChecker', 'MENU_ADMIN_USER_GROUP'
  UNION ALL SELECT 'UserGroupChecker', 'USER_GROUP_READ'
  UNION ALL SELECT 'UserGroupChecker', 'USER_GROUP_APPROVE'

  UNION ALL SELECT 'UserGroupChecker', 'MENU_ADMIN_APPROVAL_REQUEST'
  UNION ALL SELECT 'UserGroupChecker', 'APPROVAL_REQUEST_READ'

  UNION ALL SELECT 'UserMaker', 'MENU_ADMIN_USERS'
  UNION ALL SELECT 'UserMaker', 'USER_READ'
  UNION ALL SELECT 'UserMaker', 'USER_WRITE'

  UNION ALL SELECT 'UserChecker', 'MENU_ADMIN_USERS'
  UNION ALL SELECT 'UserChecker', 'USER_READ'
  UNION ALL SELECT 'UserChecker', 'USER_APPROVE'

  UNION ALL SELECT 'UserChecker', 'MENU_ADMIN_APPROVAL_REQUEST'
  UNION ALL SELECT 'UserChecker', 'APPROVAL_REQUEST_READ'

  UNION ALL SELECT 'OwnerUser', 'MENU_TRANSACTION_OVERVIEW'
  UNION ALL SELECT 'OwnerUser', 'MENU_TRANSACTION_INVOICES'
  UNION ALL SELECT 'OwnerUser', 'MENU_ADMIN_USERS'
  UNION ALL SELECT 'OwnerUser', 'USER_READ'
  UNION ALL SELECT 'OwnerUser', 'USER_GROUP_READ'
) AS seed
INNER JOIN organizations organization
  ON organization.organization_code = 'owner'
INNER JOIN user_groups user_group
  ON user_group.organization_id = organization.id
  AND user_group.group_code = seed.group_code
INNER JOIN permissions permission
  ON permission.permission_code = seed.permission_code;