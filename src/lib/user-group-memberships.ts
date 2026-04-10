import 'server-only';

import { getAuthenticatedUserContext } from '@/lib/auth/authorization';
import { db } from '@/lib/db';

type UserGroupStatus = 'ACTIVE' | 'INACTIVE';
type UserStatus = 'ACTIVE' | 'LOCKED' | 'DISABLED';
type UserType = 'ADMIN' | 'NORMAL';
type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
type GroupMembershipRequestAction = 'UPDATE';

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

type MemberAssignmentRow = {
  user_id: number | string;
  username: string;
  display_name: string;
  email: string | null;
  status: UserStatus;
  user_type: UserType;
};

type ApprovalRequestRow = {
  id: number | string;
  resource_key: string;
  action_type: GroupMembershipRequestAction;
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

type MembershipUserSnapshot = {
  user_id: number;
  username: string;
  display_name: string;
  email: string | null;
  status: UserStatus;
  user_type: UserType;
};

type GroupMembershipSnapshot = {
  user_group: UserGroupSummarySnapshot;
  users: MembershipUserSnapshot[];
};

type GroupMembershipChangedFields = {
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
  added_users?: {
    before: null;
    after: Array<{
      username: string;
      display_name: string;
      email: string | null;
    }>;
  };
  removed_users?: {
    before: Array<{
      username: string;
      display_name: string;
      email: string | null;
    }>;
    after: null;
  };
};

export type UserGroupMembershipChangePatch = {
  op: 'UPDATE_GROUP_MEMBERSHIPS';
  target: {
    organization_id: number;
    user_group_id: number;
  };
  values: {
    add_user_ids: number[];
    remove_user_ids: number[];
  };
};

export type ManagedUserGroupMembership = {
  userId: number;
  username: string;
  displayName: string;
  email: string | null;
  status: UserStatus;
  userType: UserType;
};

export type AvailableUserOption = ManagedUserGroupMembership;

export type ManagedUserGroupMembershipTarget = {
  id: number;
  groupCode: string;
  groupName: string;
  description: string | null;
  status: UserGroupStatus;
  memberCount: number;
  permissionCount: number;
  updatedAt: string;
};

export type ManagedUserGroupMembershipDetail = {
  group: ManagedUserGroupMembershipTarget;
  members: ManagedUserGroupMembership[];
};

export type PaginatedUserGroupMembershipSearchResult = {
  rows: ManagedUserGroupMembershipTarget[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type PendingUserGroupMembershipRequest = {
  id: number;
  resourceKey: string;
  actionType: GroupMembershipRequestAction;
  summary: string;
  submittedByUserId: number | null;
  submittedByDisplayName: string | null;
  submittedAt: string;
};

const GROUP_MEMBERSHIP_RESOURCE_TYPE = 'GROUP_MEMBERSHIP';

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

function mapUserGroup(row: UserGroupListRow): ManagedUserGroupMembershipTarget {
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

function mapMember(row: MemberAssignmentRow): ManagedUserGroupMembership {
  return {
    userId: toNumber(row.user_id),
    username: row.username,
    displayName: row.display_name,
    email: row.email,
    status: row.status,
    userType: row.user_type,
  };
}

function mapPendingRequest(
  row: ApprovalRequestRow
): PendingUserGroupMembershipRequest {
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

async function listAssignedMembers(organizationId: number, userGroupId: number) {
  const rows = await db.query<MemberAssignmentRow>(
    `
      select
        user.id as user_id,
        user.username,
        user.display_name,
        user.email,
        user.status,
        user.user_type
      from user_group_memberships membership
      inner join users user
        on user.id = membership.user_id
      where membership.user_group_id = ?
        and user.organization_id = ?
      order by user.username asc, user.id desc
    `,
    [userGroupId, organizationId]
  );

  return rows.map(mapMember);
}

async function listUnassignedUsers(organizationId: number, userGroupId: number) {
  const rows = await db.query<MemberAssignmentRow>(
    `
      select
        user.id as user_id,
        user.username,
        user.display_name,
        user.email,
        user.status,
        user.user_type
      from users user
      where user.organization_id = ?
        and user.id not in (
          select membership.user_id
          from user_group_memberships membership
          where membership.user_group_id = ?
        )
      order by user.username asc, user.id desc
    `,
    [organizationId, userGroupId]
  );

  return rows.map(mapMember);
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
    [GROUP_MEMBERSHIP_RESOURCE_TYPE, resourceKey]
  );

  if (existingLock) {
    throw new Error(
      'A pending user group membership request already exists for this resource.'
    );
  }
}

function buildGroupMembershipResourceKey(
  organizationCode: string,
  groupCode: string
) {
  return `ORG:${organizationCode}:GROUP:${groupCode}:MEMBERSHIPS`;
}

function buildMemberSnapshot(
  member: ManagedUserGroupMembership
): MembershipUserSnapshot {
  return {
    user_id: member.userId,
    username: member.username,
    display_name: member.displayName,
    email: member.email,
    status: member.status,
    user_type: member.userType,
  };
}

function buildSnapshot(input: {
  group: ManagedUserGroupMembershipTarget;
  members: ManagedUserGroupMembership[];
}): GroupMembershipSnapshot {
  return {
    user_group: {
      id: input.group.id,
      group_code: input.group.groupCode,
      group_name: input.group.groupName,
      description: input.group.description,
      status: input.group.status,
    },
    users: input.members
      .map(buildMemberSnapshot)
      .sort((left, right) => left.username.localeCompare(right.username)),
  };
}

function buildChangedFields(input: {
  group: ManagedUserGroupMembershipTarget;
  addedUsers: ManagedUserGroupMembership[];
  removedUsers: ManagedUserGroupMembership[];
}): GroupMembershipChangedFields | null {
  const changedFields: GroupMembershipChangedFields = {
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

  if (input.addedUsers.length > 0) {
    changedFields.added_users = {
      before: null,
      after: input.addedUsers.map((user) => ({
        username: user.username,
        display_name: user.displayName,
        email: user.email,
      })),
    };
  }

  if (input.removedUsers.length > 0) {
    changedFields.removed_users = {
      before: input.removedUsers.map((user) => ({
        username: user.username,
        display_name: user.displayName,
        email: user.email,
      })),
      after: null,
    };
  }

  return input.addedUsers.length > 0 || input.removedUsers.length > 0
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
      values (?, ?, 'GROUP_MEMBERSHIP_CHANGE_SUBMITTED', ?, ?, ?, ?)
    `,
    [
      input.organizationId,
      input.actorUserId,
      GROUP_MEMBERSHIP_RESOURCE_TYPE,
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
  beforeState: GroupMembershipSnapshot;
  afterState: GroupMembershipSnapshot;
  changedFields: GroupMembershipChangedFields;
  changePatch: UserGroupMembershipChangePatch;
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
      GROUP_MEMBERSHIP_RESOURCE_TYPE,
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
      [GROUP_MEMBERSHIP_RESOURCE_TYPE, input.resourceKey, approvalRequestId]
    );
  } catch {
    await db.execute('delete from approval_requests where id = ?', [
      approvalRequestId,
    ]);
    throw new Error(
      'A pending user group membership request already exists for this resource.'
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

export async function searchApprovedUserGroupMembershipTargetsPage(input: {
  organizationId: number;
  groupNameQuery?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedUserGroupMembershipSearchResult> {
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

export async function getApprovedUserGroupMembershipDetailById(
  organizationId: number,
  groupId: number
): Promise<ManagedUserGroupMembershipDetail | null> {
  requirePositiveInteger(groupId, 'User group');

  const group = await findExistingGroupById(organizationId, groupId);

  if (!group) {
    return null;
  }

  const members = await listAssignedMembers(organizationId, groupId);

  return {
    group: mapUserGroup(group),
    members,
  };
}

export async function listAvailableUsersForUserGroup(
  organizationId: number,
  userGroupId: number
) {
  requirePositiveInteger(userGroupId, 'User group');

  return listUnassignedUsers(organizationId, userGroupId);
}

export async function listPendingUserGroupMembershipRequests(
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
    [organizationId, GROUP_MEMBERSHIP_RESOURCE_TYPE]
  );

  return rows.map(mapPendingRequest);
}

export function buildUserGroupMembershipRouteResourceKey(
  organizationCode: string,
  groupCode: string
) {
  return buildGroupMembershipResourceKey(organizationCode, groupCode);
}

export async function submitUpdateUserGroupMembershipRequest(input: {
  groupId: number;
  addUserIds: number[];
  removeUserIds: number[];
}) {
  const context = await requirePermission('GROUP_MEMBERSHIP_WRITE');

  requirePositiveInteger(input.groupId, 'User group');

  const groupRow = await findExistingGroupById(
    context.session.organizationId,
    input.groupId
  );

  if (!groupRow) {
    throw new Error('The requested user group could not be found.');
  }

  const group = mapUserGroup(groupRow);
  const resourceKey = buildGroupMembershipResourceKey(
    context.session.organizationCode,
    group.groupCode
  );

  await ensureNoPendingLock(resourceKey);

  const existingMembers = await listAssignedMembers(
    context.session.organizationId,
    group.id
  );
  const existingMemberMap = new Map(
    existingMembers.map((member) => [member.userId, member])
  );
  const addUserIds = Array.from(
    new Set(
      input.addUserIds.filter(
        (userId) => Number.isInteger(userId) && userId > 0
      )
    )
  );
  const removeUserIds = Array.from(
    new Set(
      input.removeUserIds.filter(
        (userId) => Number.isInteger(userId) && userId > 0
      )
    )
  );

  const overlappingIds = addUserIds.filter((userId) =>
    removeUserIds.includes(userId)
  );

  if (overlappingIds.length > 0) {
    throw new Error(
      'A user cannot be requested for both add and remove in the same update.'
    );
  }

  const removedUsers = removeUserIds.map((userId) => {
    const user = existingMemberMap.get(userId);

    if (!user) {
      throw new Error('One or more users selected for removal are invalid.');
    }

    return user;
  });

  const availableUsers = await listUnassignedUsers(
    context.session.organizationId,
    group.id
  );
  const availableUserMap = new Map(
    availableUsers.map((user) => [user.userId, user])
  );
  const addedUsers = addUserIds.map((userId) => {
    const user = availableUserMap.get(userId);

    if (!user) {
      throw new Error('One or more users selected for addition are invalid.');
    }

    return user;
  });

  if (addedUsers.length === 0 && removedUsers.length === 0) {
    throw new Error('No changes were detected for this user group membership set.');
  }

  const remainingMembers = existingMembers.filter(
    (member) => !removeUserIds.includes(member.userId)
  );
  const afterMembers = [...remainingMembers, ...addedUsers].sort((left, right) =>
    left.username.localeCompare(right.username)
  );
  const beforeState = buildSnapshot({
    group,
    members: existingMembers,
  });
  const afterState = buildSnapshot({
    group,
    members: afterMembers,
  });
  const changedFields = buildChangedFields({
    group,
    addedUsers,
    removedUsers,
  });

  if (!changedFields) {
    throw new Error('No changes were detected for this user group membership set.');
  }

  await createApprovalRequest({
    organizationId: context.session.organizationId,
    actorUserId: context.session.userId,
    resourceKey,
    summary: `Update memberships for user group ${group.groupCode}`,
    beforeState,
    afterState,
    changedFields,
    changePatch: {
      op: 'UPDATE_GROUP_MEMBERSHIPS',
      target: {
        organization_id: context.session.organizationId,
        user_group_id: group.id,
      },
      values: {
        add_user_ids: addUserIds,
        remove_user_ids: removeUserIds,
      },
    },
  });
}