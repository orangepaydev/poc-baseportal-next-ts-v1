USE portaldb;

CREATE TABLE organizations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_code VARCHAR(100) NOT NULL,
  organization_name VARCHAR(200) NOT NULL,
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_organizations_code (organization_code)
);

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NOT NULL,
  username VARCHAR(100) NOT NULL,
  display_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NULL,
  password_sha256 CHAR(64) NOT NULL,
  password_algo VARCHAR(32) NOT NULL DEFAULT 'SHA256',
  status ENUM('ACTIVE', 'LOCKED', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_org_username (organization_id, username),
  KEY idx_users_org_status (organization_id, status),
  CONSTRAINT fk_users_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
);

CREATE TABLE user_groups (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NOT NULL,
  group_code VARCHAR(100) NOT NULL,
  group_name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_groups_org_code (organization_id, group_code),
  KEY idx_user_groups_org_status (organization_id, status),
  CONSTRAINT fk_user_groups_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
);

CREATE TABLE permission_actions (
  action_code VARCHAR(30) NOT NULL,
  action_name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NOT NULL,
  PRIMARY KEY (action_code)
);

CREATE TABLE permission_resource_types (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  resource_code VARCHAR(50) NOT NULL,
  resource_name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_permission_resource_types_code (resource_code)
);

CREATE TABLE permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  permission_code VARCHAR(120) NOT NULL,
  resource_type_id BIGINT UNSIGNED NOT NULL,
  action_code VARCHAR(30) NOT NULL,
  resource_instance_key VARCHAR(120) NULL,
  permission_name VARCHAR(150) NOT NULL,
  description VARCHAR(255) NULL,
  is_system TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_permissions_code (permission_code),
  KEY idx_permissions_resource_action (resource_type_id, action_code),
  CONSTRAINT fk_permissions_resource_type
    FOREIGN KEY (resource_type_id) REFERENCES permission_resource_types (id),
  CONSTRAINT fk_permissions_action
    FOREIGN KEY (action_code) REFERENCES permission_actions (action_code)
);

CREATE TABLE user_group_permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_group_id BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_group_permissions_pair (user_group_id, permission_id),
  KEY idx_user_group_permissions_permission (permission_id),
  CONSTRAINT fk_user_group_permissions_group
    FOREIGN KEY (user_group_id) REFERENCES user_groups (id),
  CONSTRAINT fk_user_group_permissions_permission
    FOREIGN KEY (permission_id) REFERENCES permissions (id)
);

CREATE TABLE user_group_memberships (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_group_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_group_memberships_pair (user_group_id, user_id),
  KEY idx_user_group_memberships_user (user_id),
  CONSTRAINT fk_user_group_memberships_group
    FOREIGN KEY (user_group_id) REFERENCES user_groups (id),
  CONSTRAINT fk_user_group_memberships_user
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE approval_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_key VARCHAR(255) NOT NULL,
  action_type ENUM('CREATE', 'UPDATE', 'DELETE', 'ADD', 'REMOVE') NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  summary VARCHAR(255) NOT NULL,
  before_state JSON NULL,
  after_state JSON NULL,
  changed_fields JSON NULL,
  change_patch JSON NULL,
  submitted_by_user_id BIGINT UNSIGNED NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by_user_id BIGINT UNSIGNED NULL,
  reviewed_at DATETIME NULL,
  review_comment TEXT NULL,
  PRIMARY KEY (id),
  KEY idx_approval_requests_status (status, submitted_at),
  KEY idx_approval_requests_resource (resource_type, resource_key),
  KEY idx_approval_requests_organization (organization_id, status),
  CONSTRAINT fk_approval_requests_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (id),
  CONSTRAINT fk_approval_requests_submitted_by
    FOREIGN KEY (submitted_by_user_id) REFERENCES users (id),
  CONSTRAINT fk_approval_requests_reviewed_by
    FOREIGN KEY (reviewed_by_user_id) REFERENCES users (id)
);

CREATE TABLE approval_locks (
  resource_type VARCHAR(50) NOT NULL,
  resource_key VARCHAR(255) NOT NULL,
  approval_request_id BIGINT UNSIGNED NOT NULL,
  locked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (resource_type, resource_key),
  UNIQUE KEY uk_approval_locks_request (approval_request_id),
  CONSTRAINT fk_approval_locks_request
    FOREIGN KEY (approval_request_id) REFERENCES approval_requests (id)
      ON DELETE CASCADE
);

CREATE TABLE approval_request_actions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  approval_request_id BIGINT UNSIGNED NOT NULL,
  action_type ENUM('SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL,
  acted_by_user_id BIGINT UNSIGNED NULL,
  acted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  comment_text TEXT NULL,
  state_snapshot JSON NULL,
  PRIMARY KEY (id),
  KEY idx_approval_request_actions_request (approval_request_id, acted_at),
  CONSTRAINT fk_approval_request_actions_request
    FOREIGN KEY (approval_request_id) REFERENCES approval_requests (id)
      ON DELETE CASCADE,
  CONSTRAINT fk_approval_request_actions_actor
    FOREIGN KEY (acted_by_user_id) REFERENCES users (id)
);

CREATE TABLE audit_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NULL,
  actor_user_id BIGINT UNSIGNED NULL,
  event_type VARCHAR(60) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_key VARCHAR(255) NOT NULL,
  approval_request_id BIGINT UNSIGNED NULL,
  event_data JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_events_resource (resource_type, resource_key, occurred_at),
  KEY idx_audit_events_actor (actor_user_id, occurred_at),
  KEY idx_audit_events_organization (organization_id, occurred_at),
  CONSTRAINT fk_audit_events_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (id),
  CONSTRAINT fk_audit_events_actor
    FOREIGN KEY (actor_user_id) REFERENCES users (id),
  CONSTRAINT fk_audit_events_approval_request
    FOREIGN KEY (approval_request_id) REFERENCES approval_requests (id)
);

INSERT INTO permission_actions (action_code, action_name, description) VALUES
  ('MENU', 'Menu Access', 'Allows a user group to see a menu item.'),
  ('READ', 'Read Access', 'Allows read-only access to a secured resource.'),
  ('WRITE', 'Write Access', 'Allows create and update activity on a secured resource.'),
  ('APPROVE', 'Approve Access', 'Allows review and approval of pending changes.');

INSERT INTO permission_resource_types (resource_code, resource_name, description) VALUES
  ('MENU_ITEM', 'Menu Item', 'Navigation item or page visibility permission.'),
  ('ORGANIZATION', 'Organization', 'Organization administration permission.'),
  ('USER', 'User', 'User administration permission.'),
  ('USER_GROUP', 'User Group', 'User group administration permission.'),
  ('GROUP_PERMISSION', 'Group Permission', 'Manage permissions attached to a user group.'),
  ('GROUP_MEMBERSHIP', 'Group Membership', 'Manage members attached to a user group.'),
  ('APPROVAL_REQUEST', 'Approval Request', 'Approve or review pending changes.'),
  ('AUDIT_LOG', 'Audit Log', 'View audit trail entries.');

INSERT INTO permissions (
  permission_code,
  resource_type_id,
  action_code,
  resource_instance_key,
  permission_name,
  description
)
SELECT
  seed.permission_code,
  prt.id,
  seed.action_code,
  seed.resource_instance_key,
  seed.permission_name,
  seed.description
FROM (
  SELECT 'MENU_TRANSACTION_OVERVIEW' AS permission_code, 'MENU_ITEM' AS resource_code, 'MENU' AS action_code, 'transaction/overview' AS resource_instance_key, 'Access Transaction Overview' AS permission_name, 'Shows the Transaction Overview menu item.' AS description
  UNION ALL SELECT 'MENU_TRANSACTION_INVOICES', 'MENU_ITEM', 'MENU', 'transaction/invoices', 'Access Transaction Invoices', 'Shows the Transaction Invoices menu item.'
  UNION ALL SELECT 'MENU_TRANSACTION_PAYMENTS', 'MENU_ITEM', 'MENU', 'transaction/payments', 'Access Transaction Payments', 'Shows the Transaction Payments menu item.'
  UNION ALL SELECT 'MENU_ADMIN_USERS', 'MENU_ITEM', 'MENU', 'admin/users', 'Access Admin Users', 'Shows the Admin Users menu item.'
  UNION ALL SELECT 'MENU_ADMIN_ROLES', 'MENU_ITEM', 'MENU', 'admin/roles', 'Access Admin Roles', 'Shows the Admin Roles menu item.'
  UNION ALL SELECT 'MENU_ADMIN_USER_GROUP', 'MENU_ITEM', 'MENU', 'admin/user-group', 'Access Admin User Group', 'Shows the Admin User Group menu item.'
  UNION ALL SELECT 'MENU_ADMIN_AUDIT_LOG', 'MENU_ITEM', 'MENU', 'admin/audit-log', 'Access Admin Audit Log', 'Shows the Admin Audit Log menu item.'
  UNION ALL SELECT 'ORGANIZATION_READ', 'ORGANIZATION', 'READ', '*', 'Read Organizations', 'Allows viewing organization records.'
  UNION ALL SELECT 'ORGANIZATION_WRITE', 'ORGANIZATION', 'WRITE', '*', 'Maintain Organizations', 'Allows requesting organization changes.'
  UNION ALL SELECT 'ORGANIZATION_APPROVE', 'ORGANIZATION', 'APPROVE', '*', 'Approve Organization Changes', 'Allows approving organization changes.'
  UNION ALL SELECT 'USER_READ', 'USER', 'READ', '*', 'Read Users', 'Allows viewing user records.'
  UNION ALL SELECT 'USER_WRITE', 'USER', 'WRITE', '*', 'Maintain Users', 'Allows requesting user changes.'
  UNION ALL SELECT 'USER_APPROVE', 'USER', 'APPROVE', '*', 'Approve User Changes', 'Allows approving user changes.'
  UNION ALL SELECT 'USER_GROUP_READ', 'USER_GROUP', 'READ', '*', 'Read User Groups', 'Allows viewing user groups.'
  UNION ALL SELECT 'USER_GROUP_WRITE', 'USER_GROUP', 'WRITE', '*', 'Maintain User Groups', 'Allows requesting user group changes.'
  UNION ALL SELECT 'USER_GROUP_APPROVE', 'USER_GROUP', 'APPROVE', '*', 'Approve User Group Changes', 'Allows approving user group changes.'
  UNION ALL SELECT 'GROUP_PERMISSION_WRITE', 'GROUP_PERMISSION', 'WRITE', '*', 'Maintain Group Permissions', 'Allows requesting permission assignments for user groups.'
  UNION ALL SELECT 'GROUP_PERMISSION_APPROVE', 'GROUP_PERMISSION', 'APPROVE', '*', 'Approve Group Permission Changes', 'Allows approving permission assignments for user groups.'
  UNION ALL SELECT 'GROUP_MEMBERSHIP_WRITE', 'GROUP_MEMBERSHIP', 'WRITE', '*', 'Maintain Group Memberships', 'Allows requesting user-to-group assignments.'
  UNION ALL SELECT 'GROUP_MEMBERSHIP_APPROVE', 'GROUP_MEMBERSHIP', 'APPROVE', '*', 'Approve Group Membership Changes', 'Allows approving user-to-group assignments.'
  UNION ALL SELECT 'AUDIT_LOG_READ', 'AUDIT_LOG', 'READ', '*', 'Read Audit Log', 'Allows viewing audit log entries.'
  UNION ALL SELECT 'MENU_ADMIN_APPROVAL_REQUEST', 'MENU_ITEM', 'MENU', 'admin/approval-request', 'Access Admin Approval Request', 'Shows the Admin Approval Request menu item.'
  UNION ALL SELECT 'APPROVAL_REQUEST_READ', 'APPROVAL_REQUEST', 'READ', '*', 'Read Approval Requests', 'Allows viewing pending and historical approval requests.'
  UNION ALL SELECT 'APPROVAL_REQUEST_APPROVE', 'APPROVAL_REQUEST', 'APPROVE', '*', 'Approve Pending Changes', 'Allows approving or rejecting pending changes.'
) AS seed
INNER JOIN permission_resource_types prt
  ON prt.resource_code = seed.resource_code;