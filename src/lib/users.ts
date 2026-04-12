import 'server-only';

import { createHash, randomBytes } from 'node:crypto';

import { getAuthenticatedUserContext } from '@/lib/auth/authorization';
import { requireSession } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { sendUserAccountCreatedEmail } from '@/lib/user-account-email';
import { sendUserPasswordResetEmail } from '@/lib/user-password-reset-email';

type UserStatus = 'ACTIVE' | 'LOCKED' | 'DISABLED';
type UserType = 'ADMIN' | 'NORMAL';
type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
type UserRequestAction = 'CREATE' | 'UPDATE' | 'DELETE';

type UserListRow = {
  id: number | string;
  username: string;
  display_name: string;
  email: string | null;
  password_reset_required: number;
  user_type: UserType;
  status: UserStatus;
  last_login_at: Date | string | null;
  updated_at: Date | string;
};

type ExistingUserRow = UserListRow & {
  organization_id: number | string;
  password_sha256: string;
  password_reset_required: number;
};

type ExistingOrganizationRow = {
  id: number | string;
  organization_code: string;
  organization_name: string;
};

type ApprovalRequestRow = {
  id: number | string;
  resource_key: string;
  action_type: UserRequestAction;
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

type UserSnapshot = {
  id?: number;
  username: string;
  display_name: string;
  email: string | null;
  user_type: UserType;
  status: UserStatus;
};

type UserChangedFields = Record<
  string,
  {
    before: unknown;
    after: unknown;
  }
>;

type CreateUserPatch = {
  op: 'CREATE_USER';
  values: {
    organization_id: number;
    username: string;
    display_name: string;
    email: string;
    user_type: UserType;
    status: UserStatus;
  };
};

type UpdateUserPatch = {
  op: 'UPDATE_USER';
  target: {
    id: number;
    organization_id: number;
  };
  values: {
    display_name: string;
    email: string | null;
    user_type: UserType;
    status: UserStatus;
  };
};

type DeleteUserPatch = {
  op: 'DELETE_USER';
  target: {
    id: number;
    organization_id: number;
  };
};

type ResetUserPasswordPatch = {
  op: 'RESET_USER_PASSWORD';
  target: {
    id: number;
    organization_id: number;
  };
};

type UserChangePatch =
  | CreateUserPatch
  | UpdateUserPatch
  | DeleteUserPatch
  | ResetUserPasswordPatch;

export type ManagedUser = {
  id: number;
  username: string;
  displayName: string;
  email: string | null;
  passwordResetRequired: boolean;
  userType: UserType;
  status: UserStatus;
  lastLoginAt: string | null;
  updatedAt: string;
};

export type PaginatedUserSearchResult = {
  rows: ManagedUser[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type PendingUserRequest = {
  id: number;
  resourceKey: string;
  actionType: UserRequestAction;
  summary: string;
  submittedByUserId: number | null;
  submittedByDisplayName: string | null;
  submittedAt: string;
};

export type UserApprovalRequest = {
  id: number;
  resourceKey: string;
  actionType: UserRequestAction;
  status: ApprovalStatus;
  summary: string;
  beforeState: UserSnapshot | null;
  afterState: UserSnapshot | null;
  changedFields: UserChangedFields | null;
  reviewComment: string | null;
  submittedByUserId: number | null;
  submittedByDisplayName: string | null;
  reviewedByDisplayName: string | null;
  submittedAt: string;
  reviewedAt: string | null;
};

const USER_RESOURCE_TYPE = 'USER';
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER_FIELDS = [
  'username',
  'display_name',
  'email',
  'user_type',
  'status',
] as const;
const USER_PASSWORD_RESET_MESSAGE =
  'Generate a secure password and email it to the user upon approval.';

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

function normalizeEmail(email: string) {
  const normalized = email.trim();

  return normalized ? normalized : null;
}

function validateRequiredEmail(email: string, label: string) {
  const normalized = email.trim();

  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  if (!EMAIL_FORMAT.test(normalized)) {
    throw new Error(`${label} must be a valid email address.`);
  }

  return normalized;
}

function normalizeDescription(description: string) {
  const normalized = description.trim();

  return normalized ? normalized : null;
}

function validateUsername(username: string) {
  const normalized = username.trim();

  if (!/^[A-Za-z0-9_.-]{3,100}$/.test(normalized)) {
    throw new Error(
      'Username must be 3 to 100 characters and use only letters, numbers, hyphens, underscores, or periods.'
    );
  }

  return normalized;
}

function validateDisplayName(displayName: string) {
  const normalized = displayName.trim();

  if (normalized.length < 2 || normalized.length > 150) {
    throw new Error('Display name must be between 2 and 150 characters.');
  }

  return normalized;
}

function validateStatus(status: string): UserStatus {
  if (status !== 'ACTIVE' && status !== 'LOCKED' && status !== 'DISABLED') {
    throw new Error('Status must be ACTIVE, LOCKED, or DISABLED.');
  }

  return status;
}

function validateUserType(userType: string): UserType {
  if (userType !== 'ADMIN' && userType !== 'NORMAL') {
    throw new Error('User type must be ADMIN or NORMAL.');
  }

  return userType;
}

function createPasswordDigest(password: string) {
  return createHash('sha256').update(password).digest('hex');
}

function createSecurePassword() {
  return randomBytes(18).toString('base64url');
}

function validateReplacementPassword(
  newPassword: string,
  confirmPassword: string
) {
  if (newPassword !== confirmPassword) {
    throw new Error('The new password and confirmation must match.');
  }

  if (newPassword.length < 12 || newPassword.length > 200) {
    throw new Error('The new password must be between 12 and 200 characters.');
  }

  if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    throw new Error('The new password must contain at least one letter and one number.');
  }

  return newPassword;
}

function buildUserResourceKey(organizationCode: string, username: string) {
  return `ORG:${organizationCode}:USER:${username}`;
}

function mapManagedUser(row: UserListRow): ManagedUser {
  return {
    id: toNumber(row.id),
    username: row.username,
    displayName: row.display_name,
    email: row.email,
    passwordResetRequired: row.password_reset_required === 1,
    userType: row.user_type,
    status: row.status,
    lastLoginAt: row.last_login_at
      ? toIsoString(row.last_login_at)
      : null,
    updatedAt: toIsoString(row.updated_at),
  };
}

function mapPendingUserRequest(row: ApprovalRequestRow): PendingUserRequest {
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

function buildSnapshot(user: {
  id?: number;
  username: string;
  displayName: string;
  email: string | null;
  userType: UserType;
  status: UserStatus;
}): UserSnapshot {
  return {
    ...(user.id ? { id: user.id } : {}),
    username: user.username,
    display_name: user.displayName,
    email: user.email,
    user_type: user.userType,
    status: user.status,
  };
}

function buildChangedFields(
  beforeState: UserSnapshot | null,
  afterState: UserSnapshot | null
) {
  const changedFields: UserChangedFields = {};

  for (const field of USER_FIELDS) {
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

async function findExistingUserById(organizationId: number, userId: number) {
  return db.queryOne<ExistingUserRow>(
    `
      select
        u.id,
        u.organization_id,
        u.username,
        u.display_name,
        u.email,
        u.password_sha256,
        u.password_reset_required,
        u.user_type,
        u.status,
        CONCAT(DATE_FORMAT(u.last_login_at, '%Y-%m-%dT%T.000'), 'Z') AS last_login_at,
        CONCAT(DATE_FORMAT(u.updated_at, '%Y-%m-%dT%T.000'), 'Z') AS updated_at
      from users u
      where u.organization_id = ?
        and u.id = ?
    `,
    [organizationId, userId]
  );
}

async function findExistingUserByUsername(
  organizationId: number,
  username: string
) {
  return db.queryOne<{
    id: number | string;
    password_sha256: string;
    password_reset_required: number;
    status: UserStatus;
  }>(
    `
      select
        id,
        password_sha256,
        password_reset_required,
        status
      from users
      where organization_id = ?
        and username = ?
    `,
    [organizationId, username]
  );
}

async function findExistingOrganizationById(organizationId: number) {
  return db.queryOne<ExistingOrganizationRow>(
    `
      select
        id,
        organization_code,
        organization_name
      from organizations
      where id = ?
    `,
    [organizationId]
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
    [USER_RESOURCE_TYPE, resourceKey]
  );

  if (existingLock) {
    throw new Error(
      'A pending user request already exists for this resource.'
    );
  }
}

async function recordApprovalSubmission(
  organizationId: number,
  actorUserId: number,
  resourceKey: string,
  approvalRequestId: number,
  actionType: UserRequestAction,
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
      values (?, ?, 'USER_CHANGE_SUBMITTED', ?, ?, ?, ?)
    `,
    [
      organizationId,
      actorUserId,
      USER_RESOURCE_TYPE,
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
  actionType: UserRequestAction;
  summary: string;
  beforeState: UserSnapshot | null;
  afterState: UserSnapshot | null;
  changedFields: UserChangedFields | null;
  changePatch: UserChangePatch;
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
      USER_RESOURCE_TYPE,
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
      [USER_RESOURCE_TYPE, input.resourceKey, approvalRequestId]
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
        'Failed to acquire the approval lock for this user.',
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
        'Failed to acquire the approval lock for this user.',
        JSON.stringify({ resource_key: input.resourceKey }),
      ]
    );

    throw new Error(
      'A pending user request already exists for this resource.'
    );
  }

  await recordApprovalSubmission(
    input.organizationId,
    input.actorUserId,
    input.resourceKey,
    approvalRequestId,
    input.actionType,
    input.summary,
  );

  return approvalRequestId;
}

function buildCreatePatch(
  organizationId: number,
  user: {
    username: string;
    displayName: string;
    email: string;
    userType: UserType;
    status: UserStatus;
  }
): CreateUserPatch {
  return {
    op: 'CREATE_USER',
    values: {
      organization_id: organizationId,
      username: user.username,
      display_name: user.displayName,
      email: user.email,
      user_type: user.userType,
      status: user.status,
    },
  };
}

function buildUpdatePatch(
  organizationId: number,
  userId: number,
  user: {
    displayName: string;
    email: string | null;
    userType: UserType;
    status: UserStatus;
  }
): UpdateUserPatch {
  return {
    op: 'UPDATE_USER',
    target: {
      id: userId,
      organization_id: organizationId,
    },
    values: {
      display_name: user.displayName,
      email: user.email,
      user_type: user.userType,
      status: user.status,
    },
  };
}

function buildDeletePatch(
  organizationId: number,
  userId: number
): DeleteUserPatch {
  return {
    op: 'DELETE_USER',
    target: {
      id: userId,
      organization_id: organizationId,
    },
  };
}

function buildResetPasswordPatch(
  organizationId: number,
  userId: number
): ResetUserPasswordPatch {
  return {
    op: 'RESET_USER_PASSWORD',
    target: {
      id: userId,
      organization_id: organizationId,
    },
  };
}

function parseChangePatch(value: unknown) {
  const patch = parseJsonColumn<UserChangePatch>(value);

  if (!patch) {
    throw new Error('The stored approval request payload is invalid.');
  }

  return patch;
}

function ensureActionMatchesPatch(
  actionType: UserRequestAction,
  patch: UserChangePatch
) {
  const expectedActionType =
    patch.op === 'CREATE_USER'
      ? 'CREATE'
      : patch.op === 'UPDATE_USER' || patch.op === 'RESET_USER_PASSWORD'
        ? 'UPDATE'
        : 'DELETE';

  if (actionType !== expectedActionType) {
    throw new Error(
      'The approval request payload does not match its action type.'
    );
  }
}

async function applyApprovedChange(patch: UserChangePatch) {
  switch (patch.op) {
    case 'CREATE_USER': {
      const organization = await findExistingOrganizationById(
        patch.values.organization_id
      );

      if (!organization) {
        throw new Error('The organization for this user no longer exists.');
      }

      const existingUser = await findExistingUserByUsername(
        patch.values.organization_id,
        patch.values.username
      );

      if (!existingUser) {
        throw new Error('The user placeholder no longer exists.');
      }

      if (existingUser.status !== 'DISABLED') {
        throw new Error('Only disabled user placeholders can be approved.');
      }

      const generatedPassword = createSecurePassword();
      const generatedPasswordDigest = createPasswordDigest(generatedPassword);
      const activateResult = await db.execute(
        `
          update users
          set display_name = ?,
              email = ?,
              user_type = ?,
              password_sha256 = ?,
              password_reset_required = 1,
              status = 'ACTIVE'
          where organization_id = ?
            and username = ?
            and status = 'DISABLED'
        `,
        [
          patch.values.display_name,
          patch.values.email,
          patch.values.user_type,
          generatedPasswordDigest,
          patch.values.organization_id,
          patch.values.username,
        ]
      );

      if (activateResult.affectedRows !== 1) {
        throw new Error('The user could not be activated for approval.');
      }

      try {
        await sendUserAccountCreatedEmail({
          organizationCode: organization.organization_code,
          organizationName: organization.organization_name,
          username: patch.values.username,
          email: patch.values.email,
          password: generatedPassword,
        });
      } catch (error) {
        await db.execute(
          `
            update users
            set password_sha256 = ?,
                password_reset_required = 0,
                status = 'DISABLED'
            where organization_id = ?
              and username = ?
          `,
          [
            existingUser.password_sha256,
            patch.values.organization_id,
            patch.values.username,
          ]
        );

        if (error instanceof Error && error.message) {
          throw new Error(
            `The user approval could not be completed: ${error.message}`
          );
        }

        throw new Error('The user approval could not be completed.');
      }

      return;
    }
    case 'UPDATE_USER': {
      const existingUser = await findExistingUserById(
        patch.target.organization_id,
        patch.target.id
      );

      if (!existingUser) {
        throw new Error('The user no longer exists.');
      }

      await db.execute(
        `
          update users
          set display_name = ?,
              email = ?,
              user_type = ?,
              status = ?
          where id = ?
            and organization_id = ?
        `,
        [
          patch.values.display_name,
          patch.values.email,
          patch.values.user_type,
          patch.values.status,
          patch.target.id,
          patch.target.organization_id,
        ]
      );
      return;
    }
    case 'RESET_USER_PASSWORD': {
      const existingUser = await findExistingUserById(
        patch.target.organization_id,
        patch.target.id
      );

      if (!existingUser) {
        throw new Error('The user no longer exists.');
      }

      if (!existingUser.email) {
        throw new Error(
          'The user no longer has an email address for password delivery.'
        );
      }

      const organization = await findExistingOrganizationById(
        patch.target.organization_id
      );

      if (!organization) {
        throw new Error('The organization for this user no longer exists.');
      }

      const generatedPassword = createSecurePassword();
      const generatedPasswordDigest = createPasswordDigest(generatedPassword);

      await db.execute(
        `
          update users
          set password_sha256 = ?,
              password_reset_required = 1
          where id = ?
            and organization_id = ?
        `,
        [
          generatedPasswordDigest,
          patch.target.id,
          patch.target.organization_id,
        ]
      );

      try {
        await sendUserPasswordResetEmail({
          organizationCode: organization.organization_code,
          organizationName: organization.organization_name,
          username: existingUser.username,
          email: existingUser.email,
          password: generatedPassword,
        });
      } catch (error) {
        await db.execute(
          `
            update users
            set password_sha256 = ?,
                password_reset_required = ?
            where id = ?
              and organization_id = ?
          `,
          [
            existingUser.password_sha256,
              existingUser.password_reset_required,
            patch.target.id,
            patch.target.organization_id,
          ]
        );

        if (error instanceof Error && error.message) {
          throw new Error(
            `The password reset approval could not be completed: ${error.message}`
          );
        }

        throw new Error(
          'The password reset approval could not be completed.'
        );
      }

      return;
    }
    case 'DELETE_USER': {
      const existingUser = await findExistingUserById(
        patch.target.organization_id,
        patch.target.id
      );

      if (!existingUser) {
        throw new Error('The user no longer exists.');
      }

      await db.execute(
        `
          delete from user_group_memberships
          where user_id = ?
        `,
        [patch.target.id]
      );

      await db.execute(
        `
          delete from users
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
        ? 'USER_CHANGE_APPROVED'
        : 'USER_CHANGE_REJECTED',
      USER_RESOURCE_TYPE,
      input.resourceKey,
      input.requestId,
      JSON.stringify({ comment: input.comment, summary: input.summary }),
    ]
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function searchApprovedUsersPage(input: {
  organizationId: number;
  displayNameQuery?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedUserSearchResult> {
  const normalizedQuery = (input.displayNameQuery ?? '').trim();
  const likeQuery = `%${normalizedQuery}%`;
  const pageSize = Math.max(1, Math.min(input.pageSize ?? 10, 100));
  const page = Math.max(1, input.page ?? 1);
  const offset = (page - 1) * pageSize;

  const totalRow = await db.queryOne<{ total_count: number | string }>(
    `
      select
        count(*) as total_count
      from users u
      where u.organization_id = ?
        and (? = '%%' or u.display_name like ?)
    `,
    [input.organizationId, likeQuery, likeQuery]
  );

  const rows = await db.query<UserListRow>(
    `
      select
        u.id,
        u.username,
        u.display_name,
        u.email,
        u.user_type,
        u.status,
        u.last_login_at,
        u.updated_at
      from users u
      where u.organization_id = ?
        and (? = '%%' or u.display_name like ?)
      order by u.display_name asc, u.id desc
      limit ? offset ?
    `,
    [input.organizationId, likeQuery, likeQuery, pageSize, offset]
  );

  return {
    rows: rows.map(mapManagedUser),
    totalCount: toNumber(totalRow?.total_count),
    page,
    pageSize,
  };
}

export async function getApprovedUserById(
  organizationId: number,
  userId: number
) {
  requirePositiveInteger(userId, 'User');

  const row = await findExistingUserById(organizationId, userId);

  return row ? mapManagedUser(row) : null;
}

export async function listPendingUserRequests(organizationId: number) {
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
      order by approval_request.submitted_at desc, approval_request.id desc
    `,
    [organizationId, USER_RESOURCE_TYPE]
  );

  return rows.map(mapPendingUserRequest);
}

export function buildUserRouteResourceKey(
  organizationCode: string,
  username: string
) {
  return buildUserResourceKey(organizationCode, username);
}

export async function submitCreateUserRequest(input: {
  username: string;
  displayName: string;
  email: string;
  userType: string;
}) {
  const context = await requirePermission('USER_WRITE');
  const username = validateUsername(input.username);
  const displayName = validateDisplayName(input.displayName);
  const email = validateRequiredEmail(input.email, 'Email');
  const userType = validateUserType(input.userType);
  const status: UserStatus = 'ACTIVE';
  const resourceKey = buildUserResourceKey(
    context.session.organizationCode,
    username
  );

  await ensureNoPendingLock(resourceKey);

  const existingUser = await findExistingUserByUsername(
    context.session.organizationId,
    username
  );

  if (existingUser) {
    throw new Error('A user with this username already exists.');
  }

  const afterState = buildSnapshot({
    username,
    displayName,
    email,
    userType,
    status,
  });

  await createApprovalRequest({
    organizationId: context.session.organizationId,
    actorUserId: context.session.userId,
    resourceKey,
    actionType: 'CREATE',
    summary: `Create user ${username}`,
    beforeState: null,
    afterState,
    changedFields: buildChangedFields(null, afterState),
    changePatch: buildCreatePatch(context.session.organizationId, {
      username,
      displayName,
      email,
      userType,
      status,
    }),
  });

  const placeholderPasswordDigest = createPasswordDigest(createSecurePassword());

  // Insert user in DISABLED state; approval will replace the placeholder password and activate the account.
  await db.execute(
    `
      insert into users (
        organization_id,
        username,
        display_name,
        email,
        password_sha256,
        password_algo,
        password_reset_required,
        user_type,
        status
      )
      values (?, ?, ?, ?, ?, 'SHA256', 0, ?, 'DISABLED')
    `,
    [
      context.session.organizationId,
      username,
      displayName,
      email,
      placeholderPasswordDigest,
      userType,
    ]
  );
}

export async function submitUpdateUserRequest(input: {
  userId: number;
  displayName: string;
  email: string;
  userType: string;
  status: string;
}) {
  const context = await requirePermission('USER_WRITE');

  requirePositiveInteger(input.userId, 'User');

  const existingUser = await findExistingUserById(
    context.session.organizationId,
    input.userId
  );

  if (!existingUser) {
    throw new Error('The requested user could not be found.');
  }

  const resourceKey = buildUserResourceKey(
    context.session.organizationCode,
    existingUser.username
  );

  await ensureNoPendingLock(resourceKey);

  const displayName = validateDisplayName(input.displayName);
  const email = normalizeEmail(input.email);
  const userType = validateUserType(input.userType);
  const status = validateStatus(input.status);
  const beforeState = buildSnapshot({
    id: toNumber(existingUser.id),
    username: existingUser.username,
    displayName: existingUser.display_name,
    email: existingUser.email,
    userType: existingUser.user_type,
    status: existingUser.status,
  });
  const afterState = buildSnapshot({
    id: toNumber(existingUser.id),
    username: existingUser.username,
    displayName,
    email,
    userType,
    status,
  });
  const changedFields = buildChangedFields(beforeState, afterState);

  if (!changedFields) {
    throw new Error('No changes were detected for this user.');
  }

  await createApprovalRequest({
    organizationId: context.session.organizationId,
    actorUserId: context.session.userId,
    resourceKey,
    actionType: 'UPDATE',
    summary: `Update user ${existingUser.username}`,
    beforeState,
    afterState,
    changedFields,
    changePatch: buildUpdatePatch(
      context.session.organizationId,
      toNumber(existingUser.id),
      {
        displayName,
        email,
        userType,
        status,
      }
    ),
  });
}

export async function submitDeleteUserRequest(input: { userId: number }) {
  const context = await requirePermission('USER_WRITE');

  requirePositiveInteger(input.userId, 'User');

  const existingUser = await findExistingUserById(
    context.session.organizationId,
    input.userId
  );

  if (!existingUser) {
    throw new Error('The requested user could not be found.');
  }

  const resourceKey = buildUserResourceKey(
    context.session.organizationCode,
    existingUser.username
  );

  await ensureNoPendingLock(resourceKey);

  const beforeState = buildSnapshot({
    id: toNumber(existingUser.id),
    username: existingUser.username,
    displayName: existingUser.display_name,
    email: existingUser.email,
    userType: existingUser.user_type,
    status: existingUser.status,
  });

  await createApprovalRequest({
    organizationId: context.session.organizationId,
    actorUserId: context.session.userId,
    resourceKey,
    actionType: 'DELETE',
    summary: `Delete user ${existingUser.username}`,
    beforeState,
    afterState: null,
    changedFields: buildChangedFields(beforeState, null),
    changePatch: buildDeletePatch(
      context.session.organizationId,
      toNumber(existingUser.id)
    ),
  });
}

export async function submitResetUserPasswordRequest(input: {
  userId: number;
}) {
  const context = await requirePermission('USER_WRITE');

  requirePositiveInteger(input.userId, 'User');

  if (input.userId === context.session.userId) {
    throw new Error(
      'You cannot request a password reset for your own account.'
    );
  }

  const existingUser = await findExistingUserById(
    context.session.organizationId,
    input.userId
  );

  if (!existingUser) {
    throw new Error('The requested user could not be found.');
  }

  if (existingUser.status !== 'ACTIVE') {
    throw new Error('Only active users can receive a password reset request.');
  }

  if (!existingUser.email) {
    throw new Error(
      'The user must have an email address before a password reset can be requested.'
    );
  }

  const resourceKey = buildUserResourceKey(
    context.session.organizationCode,
    existingUser.username
  );

  await ensureNoPendingLock(resourceKey);

  const beforeState = buildSnapshot({
    id: toNumber(existingUser.id),
    username: existingUser.username,
    displayName: existingUser.display_name,
    email: existingUser.email,
    userType: existingUser.user_type,
    status: existingUser.status,
  });

  const changedFields: UserChangedFields = {
    password_reset: {
      before: null,
      after: USER_PASSWORD_RESET_MESSAGE,
    },
  };

  await createApprovalRequest({
    organizationId: context.session.organizationId,
    actorUserId: context.session.userId,
    resourceKey,
    actionType: 'UPDATE',
    summary: `Reset password for user ${existingUser.username}`,
    beforeState,
    afterState: beforeState,
    changedFields,
    changePatch: buildResetPasswordPatch(
      context.session.organizationId,
      toNumber(existingUser.id)
    ),
  });
}

export async function approveUserRequest(input: {
  requestId: number;
  comment: string;
}) {
  const context = await requirePermission('USER_APPROVE');

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
    [input.requestId, context.session.organizationId, USER_RESOURCE_TYPE]
  );

  if (!request || request.status !== 'PENDING') {
    throw new Error('Only pending user requests can be approved.');
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

export async function rejectUserRequest(input: {
  requestId: number;
  comment: string;
}) {
  const context = await requirePermission('USER_APPROVE');

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
    [input.requestId, context.session.organizationId, USER_RESOURCE_TYPE]
  );

  if (!request || request.status !== 'PENDING') {
    throw new Error('Only pending user requests can be rejected.');
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

  if (patch.op === 'CREATE_USER') {
    await revertRejectedCreateUserPatch(patch);
  }
}

export async function applyApprovedUserPatch(patch: unknown) {
  await applyApprovedChange(parseChangePatch(patch));
}

export async function revertRejectedCreateUserPatch(patch: unknown) {
  const parsedPatch = parseChangePatch(patch);

  if (parsedPatch.op !== 'CREATE_USER') {
    return;
  }

  await db.execute(
    `
      delete from users
      where organization_id = ?
        and username = ?
        and status = 'DISABLED'
    `,
    [parsedPatch.values.organization_id, parsedPatch.values.username]
  );
}

export async function completePasswordResetForCurrentUser(input: {
  newPassword: string;
  confirmPassword: string;
}) {
  const session = await requireSession({ allowPasswordResetRequired: true });

  if (!session.passwordResetRequired) {
    throw new Error('A forced password change is not required for this session.');
  }

  const user = await findExistingUserById(session.organizationId, session.userId);

  if (!user || user.status !== 'ACTIVE') {
    throw new Error('The current user account is not available for password change.');
  }

  if (user.password_reset_required !== 1) {
    throw new Error('The password reset requirement is no longer active for this account.');
  }

  const newPassword = validateReplacementPassword(
    input.newPassword,
    input.confirmPassword
  );
  const newPasswordDigest = createPasswordDigest(newPassword);

  if (newPasswordDigest === user.password_sha256) {
    throw new Error('The new password must be different from the current password.');
  }

  await db.execute(
    `
      update users
      set password_sha256 = ?,
          password_reset_required = 0
      where id = ?
        and organization_id = ?
        and status = 'ACTIVE'
    `,
    [newPasswordDigest, session.userId, session.organizationId]
  );

  await db.execute(
    `
      insert into audit_events (
        organization_id,
        actor_user_id,
        event_type,
        resource_type,
        resource_key,
        event_data
      )
      values (?, ?, 'USER_PASSWORD_CHANGED', ?, ?, ?)
    `,
    [
      session.organizationId,
      session.userId,
      USER_RESOURCE_TYPE,
      buildUserResourceKey(session.organizationCode, user.username),
      JSON.stringify({
        initiated_by: 'SELF_SERVICE',
        session_id: session.sessionId,
      }),
    ]
  );
}
