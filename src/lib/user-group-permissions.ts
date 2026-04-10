import 'server-only';

import { db } from '@/lib/db';
import { getAuthenticatedUserContext } from '@/lib/auth/authorization';

type UserGroupStatus = 'ACTIVE' | 'INACTIVE';
type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
type GroupPermissionRequestAction = 'UPDATE';

type UserGroupListRow = {
  id: number | string;
  group_code: string;
  group_name: string;
  description: string | null;
  status: UserGroupStatus;
  member_count: number | string;
  permission_count: number | string;
  updated_at: Date | string;
};

type PermissionAssignmentRow = {
  permission_id: number | string;
  permission_code: string;
  permission_name: string;
  action_code: string;
  resource_code: string;
  description: string | null;
};

type ApprovalRequestRow = {
  id: number | string;
  resource_key: string;
  action_type: GroupPermissionRequestAction;
  status: ApprovalStatus;
  summary: string;
  submitted_by_user_id: number | string | null;
  submitted_by_display_name: string | null;
  submitted_at: Date | string;
};

type UserGroupSummarySnapshot = {
  id: number;
  group_code: string;
  group_name: string;
  description: string | null;
  status: UserGroupStatus;
};

type PermissionSnapshot = {
  permission_id: number;
  permission_code: string;
  permission_name: string;
  action_code: string;
  resource_code: string;
  description: string | null;
};

type GroupPermissionSnapshot = {
  user_group: UserGroupSummarySnapshot;
  permissions: PermissionSnapshot[];
};

type GroupPermissionChangedFields = {
  user_group: {
    before: {
      group_code: string;
      group_name: string;
    };
    after: {
      group_code: string;
      group_name: string;
    };
  };
  added_permissions?: {
    before: null;
    after: Array<{
      permission_code: string;
      action_code: string;
      description: string | null;
    }>;
  };
  removed_permissions?: {
    before: Array<{
      permission_code: string;
      action_code: string;
      description: string | null;
    }>;
    after: null;
  };
};

export type UserGroupPermissionChangePatch = {
  op: 'UPDATE_GROUP_PERMISSIONS';
  target: {
    organization_id: number;
    user_group_id: number;
  };
  values: {
    add_permission_ids: number[];
    remove_permission_ids: number[];
  };
};

export type ManagedPermissionAssignment = {
  permissionId: number;
  permissionCode: string;
  permissionName: string;
  actionCode: string;
  resourceCode: string;
  description: string | null;
};

export type AvailablePermissionOption = ManagedPermissionAssignment;

export type ManagedUserGroupPermissionTarget = {
  id: number;
  groupCode: string;
  groupName: string;
  description: string | null;
  status: UserGroupStatus;
  memberCount: number;
  permissionCount: number;
  updatedAt: string;
};

export type ManagedUserGroupPermissionDetail = {
  group: ManagedUserGroupPermissionTarget;
  permissions: ManagedPermissionAssignment[];
};

export type PaginatedUserGroupPermissionSearchResult = {
  rows: ManagedUserGroupPermissionTarget[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type PendingUserGroupPermissionRequest = {
  id: number;
  resourceKey: string;
  actionType: GroupPermissionRequestAction;
  summary: string;
  submittedByUserId: number | null;
  submittedByDisplayName: string | null;
  submittedAt: string;
};

const GROUP_PERMISSION_RESOURCE_TYPE = 'GROUP_PERMISSION';

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function toIsoString(value: Date | string) {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

function requirePositiveInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} is invalid.`);
  }
}

function mapUserGroup(row: UserGroupListRow): ManagedUserGroupPermissionTarget {
  return {
    id: toNumber(row.id),
    groupCode: row.group_code,
    groupName: row.group_name,
    description: row.description,
    status: row.status,
    memberCount: toNumber(row.member_count),
    permissionCount: toNumber(row.permission_count),
    updatedAt: toIsoString(row.updated_at),
  };
}

function mapPermission(row: PermissionAssignmentRow): ManagedPermissionAssignment {
  return {
    permissionId: toNumber(row.permission_id),
    permissionCode: row.permission_code,
    permissionName: row.permission_name,
    actionCode: row.action_code,
    resourceCode: row.resource_code,
    description: row.description,
  };
}

function mapPendingRequest(
  row: ApprovalRequestRow
): PendingUserGroupPermissionRequest {
  return {
    id: toNumber(row.id),
    resourceKey: row.resource_key,
    actionType: row.action_type,
    summary: row.summary,
    submittedByUserId:
      row.submitted_by_user_id === null
        ? null
        : toNumber(row.submitted_by_user_id),
    submittedByDisplayName: row.submitted_by_display_name,
    submittedAt: toIsoString(row.submitted_at),
  };
}

async function requirePermission(permissionCode: string) {
  const context = await getAuthenticatedUserContext();

  if (
    context.session.userType !== 'ADMIN' &&
    !context.permissionCodes.includes(permissionCode)
  ) {
    throw new Error('You do not have permission to perform this action.');
  }

  return context;
}

async function findExistingGroupById(organizationId: number, groupId: number) {
  return db.queryOne<UserGroupListRow>(
    `
      select
        user_group.id,
        user_group.group_code,
        user_group.group_name,
        user_group.description,
        user_group.status,
        count(distinct membership.user_id) as member_count,
        count(distinct group_permission.permission_id) as permission_count,
        user_group.updated_at
      from user_groups user_group
      left join user_group_memberships membership
        on membership.user_group_id = user_group.id
      left join user_group_permissions group_permission
        on group_permission.user_group_id = user_group.id
      where user_group.organization_id = ?
        and user_group.id = ?
      group by
        user_group.id,
        user_group.group_code,
        user_group.group_name,
        user_group.description,
        user_group.status,
        user_group.updated_at
    `,
    [organizationId, groupId]
  );
}

async function listAssignedPermissions(userGroupId: number) {
  const rows = await db.query<PermissionAssignmentRow>(
    `
      select
        permission.id as permission_id,
        permission.permission_code,
        permission.permission_name,
        permission.action_code,
        resource_type.resource_code,
        permission.description
      from user_group_permissions group_permission
      inner join permissions permission
        on permission.id = group_permission.permission_id
      inner join permission_resource_types resource_type
        on resource_type.id = permission.resource_type_id
      where group_permission.user_group_id = ?
      order by permission.permission_code asc, permission.id desc
    `,
    [userGroupId]
  );

  return rows.map(mapPermission);
}

async function listUnassignedPermissions(userGroupId: number) {
  const rows = await db.query<PermissionAssignmentRow>(
    `
      select
        permission.id as permission_id,
        permission.permission_code,
        permission.permission_name,
        permission.action_code,
        resource_type.resource_code,
        permission.description
      from permissions permission
      inner join permission_resource_types resource_type
        on resource_type.id = permission.resource_type_id
      where permission.id not in (
        select group_permission.permission_id
        from user_group_permissions group_permission
        where group_permission.user_group_id = ?
      )
      order by permission.permission_code asc, permission.id desc
    `,
    [userGroupId]
  );

  return rows.map(mapPermission);
}

async function ensureNoPendingLock(resourceKey: string) {
  const existingLock = await db.queryOne<{ approval_request_id: number | string }>(
    `
      select
        approval_request_id
      from approval_locks
      where resource_type = ?
        and resource_key = ?
    `,
    [GROUP_PERMISSION_RESOURCE_TYPE, resourceKey]
  );

  if (existingLock) {
    throw new Error(
      'A pending user group permission request already exists for this resource.'
    );
  }
}

function buildGroupPermissionResourceKey(
  organizationCode: string,
  groupCode: string
) {
  return `ORG:${organizationCode}:GROUP:${groupCode}:PERMISSIONS`;
}

function buildPermissionSnapshot(
  permission: ManagedPermissionAssignment
): PermissionSnapshot {
  return {
    permission_id: permission.permissionId,
    permission_code: permission.permissionCode,
    permission_name: permission.permissionName,
    action_code: permission.actionCode,
    resource_code: permission.resourceCode,
    description: permission.description,
  };
}

function buildSnapshot(input: {
  group: ManagedUserGroupPermissionTarget;
  permissions: ManagedPermissionAssignment[];
}): GroupPermissionSnapshot {
  return {
    user_group: {
      id: input.group.id,
      group_code: input.group.groupCode,
      group_name: input.group.groupName,
      description: input.group.description,
      status: input.group.status,
    },
    permissions: input.permissions
      .map(buildPermissionSnapshot)
      .sort((left, right) =>
        left.permission_code.localeCompare(right.permission_code)
      ),
  };
}

function buildChangedFields(input: {
  group: ManagedUserGroupPermissionTarget;
  addedPermissions: ManagedPermissionAssignment[];
  removedPermissions: ManagedPermissionAssignment[];
}): GroupPermissionChangedFields | null {
  const changedFields: GroupPermissionChangedFields = {
    user_group: {
      before: {
        group_code: input.group.groupCode,
        group_name: input.group.groupName,
      },
      after: {
        group_code: input.group.groupCode,
        group_name: input.group.groupName,
      },
    },
  };

  if (input.addedPermissions.length > 0) {
    changedFields.added_permissions = {
      before: null,
      after: input.addedPermissions.map((permission) => ({
        permission_code: permission.permissionCode,
        action_code: permission.actionCode,
        description: permission.description,
      })),
    };
  }

  if (input.removedPermissions.length > 0) {
    changedFields.removed_permissions = {
      before: input.removedPermissions.map((permission) => ({
        permission_code: permission.permissionCode,
        action_code: permission.actionCode,
        description: permission.description,
      })),
      after: null,
    };
  }

  return input.addedPermissions.length > 0 || input.removedPermissions.length > 0
    ? changedFields
    : null;
}

async function recordApprovalSubmission(input: {
  organizationId: number;
  actorUserId: number;
  approvalRequestId: number;
  resourceKey: string;
  summary: string;
}) {
  await db.execute(
    `
      insert into approval_request_actions (
        approval_request_id,
        action_type,
        acted_by_user_id,
        comment_text,
        state_snapshot
      )
      values (?, 'SUBMITTED', ?, null, ?)
    `,
    [
      input.approvalRequestId,
      input.actorUserId,
      JSON.stringify({
        resource_key: input.resourceKey,
        summary: input.summary,
      }),
    ]
  );

  await db.execute(
    `
      insert into audit_events (
        organization_id,
        actor_user_id,
        event_type,
        resource_type,
        resource_key,
        approval_request_id,
        event_data
      )
      values (?, ?, 'GROUP_PERMISSION_CHANGE_SUBMITTED', ?, ?, ?, ?)
    `,
    [
      input.organizationId,
      input.actorUserId,
      GROUP_PERMISSION_RESOURCE_TYPE,
      input.resourceKey,
      input.approvalRequestId,
      JSON.stringify({ summary: input.summary }),
    ]
  );
}

async function createApprovalRequest(input: {
  organizationId: number;
  actorUserId: number;
  resourceKey: string;
  summary: string;
  beforeState: GroupPermissionSnapshot;
  afterState: GroupPermissionSnapshot;
  changedFields: GroupPermissionChangedFields;
  changePatch: UserGroupPermissionChangePatch;
}) {
  const result = await db.execute(
    `
      insert into approval_requests (
        organization_id,
        resource_type,
        resource_key,
        action_type,
        summary,
        before_state,
        after_state,
        changed_fields,
        change_patch,
        submitted_by_user_id
      )
      values (?, ?, ?, 'UPDATE', ?, ?, ?, ?, ?, ?)
    `,
    [
      input.organizationId,
      GROUP_PERMISSION_RESOURCE_TYPE,
      input.resourceKey,
      input.summary,
      JSON.stringify(input.beforeState),
      JSON.stringify(input.afterState),
      JSON.stringify(input.changedFields),
      JSON.stringify(input.changePatch),
      input.actorUserId,
    ]
  );

  const approvalRequestId = toNumber(result.insertId);

  requirePositiveInteger(approvalRequestId, 'Approval request');

  try {
    await db.execute(
      `
        insert into approval_locks (
          resource_type,
          resource_key,
          approval_request_id
        )
        values (?, ?, ?)
      `,
      [GROUP_PERMISSION_RESOURCE_TYPE, input.resourceKey, approvalRequestId]
    );
  } catch {
    await db.execute('delete from approval_requests where id = ?', [
      approvalRequestId,
    ]);
    throw new Error(
      'A pending user group permission request already exists for this resource.'
    );
  }

  await recordApprovalSubmission({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    approvalRequestId,
    resourceKey: input.resourceKey,
    summary: input.summary,
  });
}

export async function searchApprovedUserGroupPermissionTargetsPage(input: {
  organizationId: number;
  groupNameQuery?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedUserGroupPermissionSearchResult> {
  const normalizedQuery = (input.groupNameQuery ?? '').trim();
  const likeQuery = `%${normalizedQuery}%`;
  const pageSize = Math.max(1, Math.min(input.pageSize ?? 10, 100));
  const page = Math.max(1, input.page ?? 1);
  const offset = (page - 1) * pageSize;

  const totalRow = await db.queryOne<{ total_count: number | string }>(
    `
      select
        count(*) as total_count
      from user_groups user_group
      where user_group.organization_id = ?
        and (? = '%%' or user_group.group_name like ?)
    `,
    [input.organizationId, likeQuery, likeQuery]
  );

  const rows = await db.query<UserGroupListRow>(
    `
      select
        user_group.id,
        user_group.group_code,
        user_group.group_name,
        user_group.description,
        user_group.status,
        count(distinct membership.user_id) as member_count,
        count(distinct group_permission.permission_id) as permission_count,
        user_group.updated_at
      from user_groups user_group
      left join user_group_memberships membership
        on membership.user_group_id = user_group.id
      left join user_group_permissions group_permission
        on group_permission.user_group_id = user_group.id
      where user_group.organization_id = ?
        and (? = '%%' or user_group.group_name like ?)
      group by
        user_group.id,
        user_group.group_code,
        user_group.group_name,
        user_group.description,
        user_group.status,
        user_group.updated_at
      order by user_group.group_name asc, user_group.id desc
      limit ? offset ?
    `,
    [input.organizationId, likeQuery, likeQuery, pageSize, offset]
  );

  return {
    rows: rows.map(mapUserGroup),
    totalCount: toNumber(totalRow?.total_count),
    page,
    pageSize,
  };
}

export async function getApprovedUserGroupPermissionDetailById(
  organizationId: number,
  groupId: number
): Promise<ManagedUserGroupPermissionDetail | null> {
  requirePositiveInteger(groupId, 'User group');

  const group = await findExistingGroupById(organizationId, groupId);

  if (!group) {
    return null;
  }

  const permissions = await listAssignedPermissions(groupId);

  return {
    group: mapUserGroup(group),
    permissions,
  };
}

export async function listAvailablePermissionsForUserGroup(userGroupId: number) {
  requirePositiveInteger(userGroupId, 'User group');

  return listUnassignedPermissions(userGroupId);
}

export async function listPendingUserGroupPermissionRequests(
  organizationId: number
) {
  const rows = await db.query<ApprovalRequestRow>(
    `
      select
        approval_request.id,
        approval_request.resource_key,
        approval_request.action_type,
        approval_request.status,
        approval_request.summary,
        approval_request.submitted_by_user_id,
        submitter.display_name as submitted_by_display_name,
        approval_request.submitted_at
      from approval_requests approval_request
      left join users submitter
        on submitter.id = approval_request.submitted_by_user_id
      where approval_request.organization_id = ?
        and approval_request.resource_type = ?
        and approval_request.status = 'PENDING'
      order by approval_request.submitted_at desc, approval_request.id desc
    `,
    [organizationId, GROUP_PERMISSION_RESOURCE_TYPE]
  );

  return rows.map(mapPendingRequest);
}

export function buildUserGroupPermissionRouteResourceKey(
  organizationCode: string,
  groupCode: string
) {
  return buildGroupPermissionResourceKey(organizationCode, groupCode);
}

export async function submitUpdateUserGroupPermissionRequest(input: {
  groupId: number;
  addPermissionIds: number[];
  removePermissionIds: number[];
}) {
  const context = await requirePermission('GROUP_PERMISSION_WRITE');

  requirePositiveInteger(input.groupId, 'User group');

  const groupRow = await findExistingGroupById(
    context.session.organizationId,
    input.groupId
  );

  if (!groupRow) {
    throw new Error('The requested user group could not be found.');
  }

  const group = mapUserGroup(groupRow);
  const resourceKey = buildGroupPermissionResourceKey(
    context.session.organizationCode,
    group.groupCode
  );

  await ensureNoPendingLock(resourceKey);

  const existingPermissions = await listAssignedPermissions(group.id);
  const existingPermissionMap = new Map(
    existingPermissions.map((permission) => [permission.permissionId, permission])
  );
  const addPermissionIds = Array.from(
    new Set(
      input.addPermissionIds.filter(
        (permissionId) => Number.isInteger(permissionId) && permissionId > 0
      )
    )
  );
  const removePermissionIds = Array.from(
    new Set(
      input.removePermissionIds.filter(
        (permissionId) => Number.isInteger(permissionId) && permissionId > 0
      )
    )
  );

  const overlappingIds = addPermissionIds.filter((permissionId) =>
    removePermissionIds.includes(permissionId)
  );

  if (overlappingIds.length > 0) {
    throw new Error(
      'A permission cannot be requested for both add and remove in the same update.'
    );
  }

  const removedPermissions = removePermissionIds.map((permissionId) => {
    const permission = existingPermissionMap.get(permissionId);

    if (!permission) {
      throw new Error('One or more permissions selected for removal are invalid.');
    }

    return permission;
  });

  const availablePermissions = await listUnassignedPermissions(group.id);
  const availablePermissionMap = new Map(
    availablePermissions.map((permission) => [permission.permissionId, permission])
  );
  const addedPermissions = addPermissionIds.map((permissionId) => {
    const permission = availablePermissionMap.get(permissionId);

    if (!permission) {
      throw new Error('One or more permissions selected for addition are invalid.');
    }

    return permission;
  });

  if (addedPermissions.length === 0 && removedPermissions.length === 0) {
    throw new Error('No changes were detected for this user group permission set.');
  }

  const remainingPermissions = existingPermissions.filter(
    (permission) => !removePermissionIds.includes(permission.permissionId)
  );
  const afterPermissions = [...remainingPermissions, ...addedPermissions].sort(
    (left, right) => left.permissionCode.localeCompare(right.permissionCode)
  );
  const beforeState = buildSnapshot({
    group,
    permissions: existingPermissions,
  });
  const afterState = buildSnapshot({
    group,
    permissions: afterPermissions,
  });
  const changedFields = buildChangedFields({
    group,
    addedPermissions,
    removedPermissions,
  });

  if (!changedFields) {
    throw new Error('No changes were detected for this user group permission set.');
  }

  await createApprovalRequest({
    organizationId: context.session.organizationId,
    actorUserId: context.session.userId,
    resourceKey,
    summary: `Update permissions for user group ${group.groupCode}`,
    beforeState,
    afterState,
    changedFields,
    changePatch: {
      op: 'UPDATE_GROUP_PERMISSIONS',
      target: {
        organization_id: context.session.organizationId,
        user_group_id: group.id,
      },
      values: {
        add_permission_ids: addPermissionIds,
        remove_permission_ids: removePermissionIds,
      },
    },
  });
}