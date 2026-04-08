import 'server-only';

import { db } from '@/lib/db';
import { getAuthenticatedUserContext } from '@/lib/auth/authorization';

type UserGroupStatus = 'ACTIVE' | 'INACTIVE';
type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
type UserGroupRequestAction = 'CREATE' | 'UPDATE' | 'DELETE';

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

type ExistingUserGroupRow = UserGroupListRow & {
  organization_id: number | string;
};

type ApprovalRequestRow = {
  id: number | string;
  resource_key: string;
  action_type: UserGroupRequestAction;
  status: ApprovalStatus;
  summary: string;
  before_state: unknown;
  after_state: unknown;
  changed_fields: unknown;
  change_patch: unknown;
  review_comment: string | null;
  submitted_by_user_id: number | string | null;
  submitted_by_display_name: string | null;
  reviewed_by_display_name: string | null;
  submitted_at: Date | string;
  reviewed_at: Date | string | null;
};

type UserGroupSnapshot = {
  id?: number;
  group_code: string;
  group_name: string;
  description: string | null;
  status: UserGroupStatus;
};

type UserGroupChangedFields = Record<
  string,
  {
    before: unknown;
    after: unknown;
  }
>;

type CreateUserGroupPatch = {
  op: 'CREATE_USER_GROUP';
  values: {
    organization_id: number;
    group_code: string;
    group_name: string;
    description: string | null;
    status: UserGroupStatus;
  };
};

type UpdateUserGroupPatch = {
  op: 'UPDATE_USER_GROUP';
  target: {
    id: number;
    organization_id: number;
  };
  values: {
    group_name: string;
    description: string | null;
    status: UserGroupStatus;
  };
};

type DeleteUserGroupPatch = {
  op: 'DELETE_USER_GROUP';
  target: {
    id: number;
    organization_id: number;
  };
};

type UserGroupChangePatch =
  | CreateUserGroupPatch
  | UpdateUserGroupPatch
  | DeleteUserGroupPatch;

export type ManagedUserGroup = {
  id: number;
  groupCode: string;
  groupName: string;
  description: string | null;
  status: UserGroupStatus;
  memberCount: number;
  permissionCount: number;
  updatedAt: string;
};

export type PaginatedUserGroupSearchResult = {
  rows: ManagedUserGroup[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type PendingUserGroupRequest = {
  id: number;
  resourceKey: string;
  actionType: UserGroupRequestAction;
  summary: string;
  submittedByUserId: number | null;
  submittedByDisplayName: string | null;
  submittedAt: string;
};

export type UserGroupApprovalRequest = {
  id: number;
  resourceKey: string;
  actionType: UserGroupRequestAction;
  status: ApprovalStatus;
  summary: string;
  beforeState: UserGroupSnapshot | null;
  afterState: UserGroupSnapshot | null;
  changedFields: UserGroupChangedFields | null;
  reviewComment: string | null;
  submittedByUserId: number | null;
  submittedByDisplayName: string | null;
  reviewedByDisplayName: string | null;
  submittedAt: string;
  reviewedAt: string | null;
};

const USER_GROUP_RESOURCE_TYPE = 'USER_GROUP';
const USER_GROUP_FIELDS = [
  'group_code',
  'group_name',
  'description',
  'status',
] as const;

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function toIsoString(value: Date | string) {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

function parseJsonColumn<T>(value: unknown): T | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  return value as T;
}

function requirePositiveInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} is invalid.`);
  }
}

function normalizeDescription(description: string) {
  const normalized = description.trim();

  return normalized ? normalized : null;
}

function validateGroupCode(groupCode: string) {
  const normalized = groupCode.trim();

  if (!/^[A-Za-z0-9_-]{3,100}$/.test(normalized)) {
    throw new Error(
      'Group code must be 3 to 100 characters and use only letters, numbers, hyphens, or underscores.'
    );
  }

  return normalized;
}

function validateGroupName(groupName: string) {
  const normalized = groupName.trim();

  if (normalized.length < 3 || normalized.length > 150) {
    throw new Error('Group name must be between 3 and 150 characters.');
  }

  return normalized;
}

function validateStatus(status: string): UserGroupStatus {
  if (status !== 'ACTIVE' && status !== 'INACTIVE') {
    throw new Error('Status must be ACTIVE or INACTIVE.');
  }

  return status;
}

function buildUserGroupResourceKey(
  organizationCode: string,
  groupCode: string
) {
  return `ORG:${organizationCode}:GROUP:${groupCode}`;
}

function mapManagedUserGroup(row: UserGroupListRow): ManagedUserGroup {
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

function mapApprovalRequest(row: ApprovalRequestRow): UserGroupApprovalRequest {
  return {
    id: toNumber(row.id),
    resourceKey: row.resource_key,
    actionType: row.action_type,
    status: row.status,
    summary: row.summary,
    beforeState: parseJsonColumn<UserGroupSnapshot>(row.before_state),
    afterState: parseJsonColumn<UserGroupSnapshot>(row.after_state),
    changedFields: parseJsonColumn<UserGroupChangedFields>(row.changed_fields),
    reviewComment: row.review_comment,
    submittedByUserId:
      row.submitted_by_user_id === null
        ? null
        : toNumber(row.submitted_by_user_id),
    submittedByDisplayName: row.submitted_by_display_name,
    reviewedByDisplayName: row.reviewed_by_display_name,
    submittedAt: toIsoString(row.submitted_at),
    reviewedAt: row.reviewed_at ? toIsoString(row.reviewed_at) : null,
  };
}

function mapPendingUserGroupRequest(
  row: ApprovalRequestRow
): PendingUserGroupRequest {
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

function buildSnapshot(group: {
  id?: number;
  groupCode: string;
  groupName: string;
  description: string | null;
  status: UserGroupStatus;
}): UserGroupSnapshot {
  return {
    ...(group.id ? { id: group.id } : {}),
    group_code: group.groupCode,
    group_name: group.groupName,
    description: group.description,
    status: group.status,
  };
}

function buildChangedFields(
  beforeState: UserGroupSnapshot | null,
  afterState: UserGroupSnapshot | null
) {
  const changedFields: UserGroupChangedFields = {};

  for (const field of USER_GROUP_FIELDS) {
    const beforeValue = beforeState?.[field] ?? null;
    const afterValue = afterState?.[field] ?? null;

    if (beforeValue === afterValue) {
      continue;
    }

    changedFields[field] = {
      before: beforeValue,
      after: afterValue,
    };
  }

  return Object.keys(changedFields).length > 0 ? changedFields : null;
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
  return db.queryOne<ExistingUserGroupRow>(
    `
      select
        user_group.id,
        user_group.organization_id,
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
        user_group.organization_id,
        user_group.group_code,
        user_group.group_name,
        user_group.description,
        user_group.status,
        user_group.updated_at
    `,
    [organizationId, groupId]
  );
}

async function findExistingGroupByCode(
  organizationId: number,
  groupCode: string
) {
  return db.queryOne<{ id: number | string }>(
    `
      select
        id
      from user_groups
      where organization_id = ?
        and group_code = ?
    `,
    [organizationId, groupCode]
  );
}

async function ensureNoPendingLock(resourceKey: string) {
  const existingLock = await db.queryOne<{
    approval_request_id: number | string;
  }>(
    `
      select
        approval_request_id
      from approval_locks
      where resource_type = ?
        and resource_key = ?
    `,
    [USER_GROUP_RESOURCE_TYPE, resourceKey]
  );

  if (existingLock) {
    throw new Error(
      'A pending user group request already exists for this resource.'
    );
  }
}

async function recordApprovalSubmission(
  organizationId: number,
  actorUserId: number,
  resourceKey: string,
  approvalRequestId: number,
  actionType: UserGroupRequestAction,
  summary: string
) {
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
      approvalRequestId,
      actorUserId,
      JSON.stringify({ action_type: actionType, resource_key: resourceKey }),
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
      values (?, ?, 'USER_GROUP_CHANGE_SUBMITTED', ?, ?, ?, ?)
    `,
    [
      organizationId,
      actorUserId,
      USER_GROUP_RESOURCE_TYPE,
      resourceKey,
      approvalRequestId,
      JSON.stringify({ action_type: actionType, summary }),
    ]
  );
}

async function createApprovalRequest(input: {
  organizationId: number;
  actorUserId: number;
  resourceKey: string;
  actionType: UserGroupRequestAction;
  summary: string;
  beforeState: UserGroupSnapshot | null;
  afterState: UserGroupSnapshot | null;
  changedFields: UserGroupChangedFields | null;
  changePatch: UserGroupChangePatch;
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
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.organizationId,
      USER_GROUP_RESOURCE_TYPE,
      input.resourceKey,
      input.actionType,
      input.summary,
      input.beforeState ? JSON.stringify(input.beforeState) : null,
      input.afterState ? JSON.stringify(input.afterState) : null,
      input.changedFields ? JSON.stringify(input.changedFields) : null,
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
      [USER_GROUP_RESOURCE_TYPE, input.resourceKey, approvalRequestId]
    );
  } catch {
    await db.execute(
      `
        update approval_requests
        set status = 'CANCELLED',
            review_comment = ?
        where id = ?
          and status = 'PENDING'
      `,
      [
        'Failed to acquire the approval lock for this user group.',
        approvalRequestId,
      ]
    );

    await db.execute(
      `
        insert into approval_request_actions (
          approval_request_id,
          action_type,
          acted_by_user_id,
          comment_text,
          state_snapshot
        )
        values (?, 'CANCELLED', ?, ?, ?)
      `,
      [
        approvalRequestId,
        input.actorUserId,
        'Failed to acquire the approval lock for this user group.',
        JSON.stringify({ resource_key: input.resourceKey }),
      ]
    );

    throw new Error(
      'A pending user group request already exists for this resource.'
    );
  }

  await recordApprovalSubmission(
    input.organizationId,
    input.actorUserId,
    input.resourceKey,
    approvalRequestId,
    input.actionType,
    input.summary
  );

  return approvalRequestId;
}

function buildCreatePatch(
  organizationId: number,
  group: {
    groupCode: string;
    groupName: string;
    description: string | null;
    status: UserGroupStatus;
  }
): CreateUserGroupPatch {
  return {
    op: 'CREATE_USER_GROUP',
    values: {
      organization_id: organizationId,
      group_code: group.groupCode,
      group_name: group.groupName,
      description: group.description,
      status: group.status,
    },
  };
}

function buildUpdatePatch(
  organizationId: number,
  groupId: number,
  group: {
    groupName: string;
    description: string | null;
    status: UserGroupStatus;
  }
): UpdateUserGroupPatch {
  return {
    op: 'UPDATE_USER_GROUP',
    target: {
      id: groupId,
      organization_id: organizationId,
    },
    values: {
      group_name: group.groupName,
      description: group.description,
      status: group.status,
    },
  };
}

function buildDeletePatch(
  organizationId: number,
  groupId: number
): DeleteUserGroupPatch {
  return {
    op: 'DELETE_USER_GROUP',
    target: {
      id: groupId,
      organization_id: organizationId,
    },
  };
}

function parseChangePatch(value: unknown) {
  const patch = parseJsonColumn<UserGroupChangePatch>(value);

  if (!patch) {
    throw new Error('The stored approval request payload is invalid.');
  }

  return patch;
}

function ensureActionMatchesPatch(
  actionType: UserGroupRequestAction,
  patch: UserGroupChangePatch
) {
  const expectedActionType =
    patch.op === 'CREATE_USER_GROUP'
      ? 'CREATE'
      : patch.op === 'UPDATE_USER_GROUP'
        ? 'UPDATE'
        : 'DELETE';

  if (actionType !== expectedActionType) {
    throw new Error(
      'The approval request payload does not match its action type.'
    );
  }
}

async function applyApprovedChange(patch: UserGroupChangePatch) {
  switch (patch.op) {
    case 'CREATE_USER_GROUP': {
      await db.execute(
        `
          update user_groups
          set group_name = ?,
              description = ?,
              status = 'ACTIVE'
          where organization_id = ?
            and group_code = ?
            and status = 'INACTIVE'
        `,
        [
          patch.values.group_name,
          patch.values.description,
          patch.values.organization_id,
          patch.values.group_code,
        ]
      );
      return;
    }
    case 'UPDATE_USER_GROUP': {
      const existingGroup = await findExistingGroupById(
        patch.target.organization_id,
        patch.target.id
      );

      if (!existingGroup) {
        throw new Error('The user group no longer exists.');
      }

      await db.execute(
        `
          update user_groups
          set group_name = ?,
              description = ?,
              status = ?
          where id = ?
            and organization_id = ?
        `,
        [
          patch.values.group_name,
          patch.values.description,
          patch.values.status,
          patch.target.id,
          patch.target.organization_id,
        ]
      );
      return;
    }
    case 'DELETE_USER_GROUP': {
      const existingGroup = await findExistingGroupById(
        patch.target.organization_id,
        patch.target.id
      );

      if (!existingGroup) {
        throw new Error('The user group no longer exists.');
      }

      if (
        toNumber(existingGroup.member_count) > 0 ||
        toNumber(existingGroup.permission_count) > 0
      ) {
        throw new Error(
          'A user group with members or permissions cannot be deleted.'
        );
      }

      await db.execute(
        `
          delete from user_groups
          where id = ?
            and organization_id = ?
        `,
        [patch.target.id, patch.target.organization_id]
      );
      return;
    }
  }
}

async function completeReview(input: {
  requestId: number;
  status: 'APPROVED' | 'REJECTED';
  actorUserId: number;
  organizationId: number;
  resourceKey: string;
  comment: string | null;
  summary: string;
}) {
  await db.execute(
    `
      update approval_requests
      set status = ?,
          reviewed_by_user_id = ?,
          reviewed_at = current_timestamp,
          review_comment = ?
      where id = ?
        and status = 'PENDING'
    `,
    [input.status, input.actorUserId, input.comment, input.requestId]
  );

  await db.execute(
    `
      insert into approval_request_actions (
        approval_request_id,
        action_type,
        acted_by_user_id,
        comment_text,
        state_snapshot
      )
      values (?, ?, ?, ?, ?)
    `,
    [
      input.requestId,
      input.status,
      input.actorUserId,
      input.comment,
      JSON.stringify({
        resource_key: input.resourceKey,
        summary: input.summary,
      }),
    ]
  );

  await db.execute(
    `
      delete from approval_locks
      where approval_request_id = ?
    `,
    [input.requestId]
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
      values (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.organizationId,
      input.actorUserId,
      input.status === 'APPROVED'
        ? 'USER_GROUP_CHANGE_APPROVED'
        : 'USER_GROUP_CHANGE_REJECTED',
      USER_GROUP_RESOURCE_TYPE,
      input.resourceKey,
      input.requestId,
      JSON.stringify({ comment: input.comment, summary: input.summary }),
    ]
  );
}

export async function listApprovedUserGroups(organizationId: number) {
  return searchApprovedUserGroups(organizationId);
}

export async function searchApprovedUserGroupsPage(input: {
  organizationId: number;
  groupNameQuery?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedUserGroupSearchResult> {
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
      order by user_group.group_name asc
      limit ? offset ?
    `,
    [input.organizationId, likeQuery, likeQuery, pageSize, offset]
  );

  return {
    rows: rows.map(mapManagedUserGroup),
    totalCount: toNumber(totalRow?.total_count),
    page,
    pageSize,
  };
}

export async function searchApprovedUserGroups(
  organizationId: number,
  groupNameQuery = ''
) {
  const normalizedQuery = groupNameQuery.trim();
  const likeQuery = `%${normalizedQuery}%`;

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
      order by user_group.group_name asc
    `,
    [organizationId, likeQuery, likeQuery]
  );

  return rows.map(mapManagedUserGroup);
}

export async function getApprovedUserGroupById(
  organizationId: number,
  groupId: number
) {
  requirePositiveInteger(groupId, 'User group');

  const row = await findExistingGroupById(organizationId, groupId);

  return row ? mapManagedUserGroup(row) : null;
}

export async function listPendingUserGroupRequests(organizationId: number) {
  const rows = await db.query<ApprovalRequestRow>(
    `
      select
        approval_request.id,
        approval_request.resource_key,
        approval_request.action_type,
        approval_request.status,
        approval_request.summary,
        approval_request.before_state,
        approval_request.after_state,
        approval_request.changed_fields,
        approval_request.change_patch,
        approval_request.review_comment,
        approval_request.submitted_by_user_id,
        submitter.display_name as submitted_by_display_name,
        null as reviewed_by_display_name,
        approval_request.submitted_at,
        approval_request.reviewed_at
      from approval_requests approval_request
      left join users submitter
        on submitter.id = approval_request.submitted_by_user_id
      where approval_request.organization_id = ?
        and approval_request.resource_type = ?
        and approval_request.status = 'PENDING'
      order by approval_request.submitted_at desc
    `,
    [organizationId, USER_GROUP_RESOURCE_TYPE]
  );

  return rows.map(mapPendingUserGroupRequest);
}

export function buildUserGroupRouteResourceKey(
  organizationCode: string,
  groupCode: string
) {
  return buildUserGroupResourceKey(organizationCode, groupCode);
}

export async function listUserGroupApprovalRequests(
  organizationId: number,
  limit = 12
) {
  const rows = await db.query<ApprovalRequestRow>(
    `
      select
        approval_request.id,
        approval_request.resource_key,
        approval_request.action_type,
        approval_request.status,
        approval_request.summary,
        approval_request.before_state,
        approval_request.after_state,
        approval_request.changed_fields,
        approval_request.change_patch,
        approval_request.review_comment,
        approval_request.submitted_by_user_id,
        submitter.display_name as submitted_by_display_name,
        reviewer.display_name as reviewed_by_display_name,
        approval_request.submitted_at,
        approval_request.reviewed_at
      from approval_requests approval_request
      left join users submitter
        on submitter.id = approval_request.submitted_by_user_id
      left join users reviewer
        on reviewer.id = approval_request.reviewed_by_user_id
      where approval_request.organization_id = ?
        and approval_request.resource_type = ?
      order by
        case when approval_request.status = 'PENDING' then 0 else 1 end,
        approval_request.submitted_at desc
      limit ?
    `,
    [organizationId, USER_GROUP_RESOURCE_TYPE, limit]
  );

  return rows.map(mapApprovalRequest);
}

export async function submitCreateUserGroupRequest(input: {
  groupCode: string;
  groupName: string;
  description: string;
  status: string;
}) {
  const context = await requirePermission('USER_GROUP_WRITE');
  const groupCode = validateGroupCode(input.groupCode);
  const groupName = validateGroupName(input.groupName);
  const description = normalizeDescription(input.description);
  const status = validateStatus(input.status);
  const resourceKey = buildUserGroupResourceKey(
    context.session.organizationCode,
    groupCode
  );

  await ensureNoPendingLock(resourceKey);

  const existingGroup = await findExistingGroupByCode(
    context.session.organizationId,
    groupCode
  );

  if (existingGroup) {
    throw new Error('A user group with this code already exists.');
  }

  const afterState = buildSnapshot({
    groupCode,
    groupName,
    description,
    status,
  });

  await createApprovalRequest({
    organizationId: context.session.organizationId,
    actorUserId: context.session.userId,
    resourceKey,
    actionType: 'CREATE',
    summary: `Create user group ${groupCode}`,
    beforeState: null,
    afterState,
    changedFields: buildChangedFields(null, afterState),
    changePatch: buildCreatePatch(context.session.organizationId, {
      groupCode,
      groupName,
      description,
      status,
    }),
  });

  await db.execute(
    `
      insert into user_groups (
        organization_id,
        group_code,
        group_name,
        description,
        status
      )
      values (?, ?, ?, ?, 'INACTIVE')
    `,
    [
      context.session.organizationId,
      groupCode,
      groupName,
      description,
    ]
  );
}

export async function submitUpdateUserGroupRequest(input: {
  groupId: number;
  groupName: string;
  description: string;
  status: string;
}) {
  const context = await requirePermission('USER_GROUP_WRITE');

  requirePositiveInteger(input.groupId, 'User group');

  const existingGroup = await findExistingGroupById(
    context.session.organizationId,
    input.groupId
  );

  if (!existingGroup) {
    throw new Error('The requested user group could not be found.');
  }

  const resourceKey = buildUserGroupResourceKey(
    context.session.organizationCode,
    existingGroup.group_code
  );

  await ensureNoPendingLock(resourceKey);

  const groupName = validateGroupName(input.groupName);
  const description = normalizeDescription(input.description);
  const status = validateStatus(input.status);
  const beforeState = buildSnapshot({
    id: toNumber(existingGroup.id),
    groupCode: existingGroup.group_code,
    groupName: existingGroup.group_name,
    description: existingGroup.description,
    status: existingGroup.status,
  });
  const afterState = buildSnapshot({
    id: toNumber(existingGroup.id),
    groupCode: existingGroup.group_code,
    groupName,
    description,
    status,
  });
  const changedFields = buildChangedFields(beforeState, afterState);

  if (!changedFields) {
    throw new Error('No changes were detected for this user group.');
  }

  await createApprovalRequest({
    organizationId: context.session.organizationId,
    actorUserId: context.session.userId,
    resourceKey,
    actionType: 'UPDATE',
    summary: `Update user group ${existingGroup.group_code}`,
    beforeState,
    afterState,
    changedFields,
    changePatch: buildUpdatePatch(
      context.session.organizationId,
      toNumber(existingGroup.id),
      {
        groupName,
        description,
        status,
      }
    ),
  });
}

export async function submitDeleteUserGroupRequest(input: { groupId: number }) {
  const context = await requirePermission('USER_GROUP_WRITE');

  requirePositiveInteger(input.groupId, 'User group');

  const existingGroup = await findExistingGroupById(
    context.session.organizationId,
    input.groupId
  );

  if (!existingGroup) {
    throw new Error('The requested user group could not be found.');
  }

  if (
    toNumber(existingGroup.member_count) > 0 ||
    toNumber(existingGroup.permission_count) > 0
  ) {
    throw new Error(
      'A user group with members or permissions cannot be deleted.'
    );
  }

  const resourceKey = buildUserGroupResourceKey(
    context.session.organizationCode,
    existingGroup.group_code
  );

  await ensureNoPendingLock(resourceKey);

  const beforeState = buildSnapshot({
    id: toNumber(existingGroup.id),
    groupCode: existingGroup.group_code,
    groupName: existingGroup.group_name,
    description: existingGroup.description,
    status: existingGroup.status,
  });

  await createApprovalRequest({
    organizationId: context.session.organizationId,
    actorUserId: context.session.userId,
    resourceKey,
    actionType: 'DELETE',
    summary: `Delete user group ${existingGroup.group_code}`,
    beforeState,
    afterState: null,
    changedFields: buildChangedFields(beforeState, null),
    changePatch: buildDeletePatch(
      context.session.organizationId,
      toNumber(existingGroup.id)
    ),
  });
}

export async function approveUserGroupRequest(input: {
  requestId: number;
  comment: string;
}) {
  const context = await requirePermission('USER_GROUP_APPROVE');

  requirePositiveInteger(input.requestId, 'Approval request');

  const request = await db.queryOne<ApprovalRequestRow>(
    `
      select
        id,
        resource_key,
        action_type,
        status,
        summary,
        before_state,
        after_state,
        changed_fields,
        change_patch,
        review_comment,
        submitted_by_user_id,
        null as submitted_by_display_name,
        null as reviewed_by_display_name,
        submitted_at,
        reviewed_at
      from approval_requests
      where id = ?
        and organization_id = ?
        and resource_type = ?
    `,
    [input.requestId, context.session.organizationId, USER_GROUP_RESOURCE_TYPE]
  );

  if (!request || request.status !== 'PENDING') {
    throw new Error('Only pending user group requests can be approved.');
  }

  if (toNumber(request.submitted_by_user_id) === context.session.userId) {
    throw new Error('You cannot approve or reject a request you submitted.');
  }

  const patch = parseChangePatch(request.change_patch);

  ensureActionMatchesPatch(request.action_type, patch);
  await applyApprovedChange(patch);

  await completeReview({
    requestId: toNumber(request.id),
    status: 'APPROVED',
    actorUserId: context.session.userId,
    organizationId: context.session.organizationId,
    resourceKey: request.resource_key,
    comment: normalizeDescription(input.comment),
    summary: request.summary,
  });
}

export async function rejectUserGroupRequest(input: {
  requestId: number;
  comment: string;
}) {
  const context = await requirePermission('USER_GROUP_APPROVE');

  requirePositiveInteger(input.requestId, 'Approval request');

  const request = await db.queryOne<ApprovalRequestRow>(
    `
      select
        id,
        resource_key,
        action_type,
        status,
        summary,
        before_state,
        after_state,
        changed_fields,
        change_patch,
        review_comment,
        submitted_by_user_id,
        null as submitted_by_display_name,
        null as reviewed_by_display_name,
        submitted_at,
        reviewed_at
      from approval_requests
      where id = ?
        and organization_id = ?
        and resource_type = ?
    `,
    [input.requestId, context.session.organizationId, USER_GROUP_RESOURCE_TYPE]
  );

  if (!request || request.status !== 'PENDING') {
    throw new Error('Only pending user group requests can be rejected.');
  }

  if (toNumber(request.submitted_by_user_id) === context.session.userId) {
    throw new Error('You cannot approve or reject a request you submitted.');
  }

  await completeReview({
    requestId: toNumber(request.id),
    status: 'REJECTED',
    actorUserId: context.session.userId,
    organizationId: context.session.organizationId,
    resourceKey: request.resource_key,
    comment: normalizeDescription(input.comment),
    summary: request.summary,
  });

  const patch = parseChangePatch(request.change_patch);

  if (patch.op === 'CREATE_USER_GROUP') {
    await db.execute(
      `
        delete from user_groups
        where organization_id = ?
          and group_code = ?
          and status = 'INACTIVE'
      `,
      [patch.values.organization_id, patch.values.group_code]
    );
  }
}
