import 'server-only';

import { createHash, randomBytes } from 'node:crypto';

import { db } from '@/lib/db';
import { getAuthenticatedUserContext } from '@/lib/auth/authorization';
import { sendOrganizationAdminAccountCreatedEmail } from '@/lib/organization-admin-account-email';

type OrganizationStatus = 'ACTIVE' | 'INACTIVE';
type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
type OrganizationRequestAction = 'CREATE' | 'UPDATE' | 'DELETE';

type OrganizationListRow = {
  id: number | string;
  organization_code: string;
  organization_name: string;
  status: OrganizationStatus;
  user_count: number | string;
  updated_at: Date | string;
};

type ExistingOrganizationRow = OrganizationListRow;

type ApprovalRequestRow = {
  id: number | string;
  resource_key: string;
  action_type: OrganizationRequestAction;
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

type OrganizationSnapshot = {
  id?: number;
  organization_code: string;
  organization_name: string;
  status: OrganizationStatus;
  admin_user_1_username?: string;
  admin_user_1_email?: string;
  admin_user_2_username?: string;
  admin_user_2_email?: string;
};

type OrganizationAdminUser = {
  username: string;
  display_name: string;
  email: string;
  user_type: 'ADMIN';
  status: 'ACTIVE';
};

type OrganizationChangedFields = Record<
  string,
  {
    before: unknown;
    after: unknown;
  }
>;

type CreateOrganizationPatch = {
  op: 'CREATE_ORGANIZATION';
  values: {
    organization_code: string;
    organization_name: string;
    status: OrganizationStatus;
    admin_users: [OrganizationAdminUser, OrganizationAdminUser];
  };
};

type UpdateOrganizationPatch = {
  op: 'UPDATE_ORGANIZATION';
  target: {
    id: number;
  };
  values: {
    organization_name: string;
    status: OrganizationStatus;
  };
};

type DeleteOrganizationPatch = {
  op: 'DELETE_ORGANIZATION';
  target: {
    id: number;
  };
};

type OrganizationChangePatch =
  | CreateOrganizationPatch
  | UpdateOrganizationPatch
  | DeleteOrganizationPatch;

export type ManagedOrganization = {
  id: number;
  organizationCode: string;
  organizationName: string;
  status: OrganizationStatus;
  userCount: number;
  updatedAt: string;
};

export type PaginatedOrganizationSearchResult = {
  rows: ManagedOrganization[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type PendingOrganizationRequest = {
  id: number;
  resourceKey: string;
  actionType: OrganizationRequestAction;
  summary: string;
  submittedByUserId: number | null;
  submittedByDisplayName: string | null;
  submittedAt: string;
};

const ORGANIZATION_RESOURCE_TYPE = 'ORGANIZATION';
const OWNER_ORGANIZATION_CODE = 'owner';
const ORGANIZATION_FIELDS = [
  'organization_code',
  'organization_name',
  'status',
  'admin_user_1_username',
  'admin_user_1_email',
  'admin_user_2_username',
  'admin_user_2_email',
] as const;
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function validateOrganizationCode(code: string) {
  const normalized = code.trim();

  if (!/^[A-Za-z0-9_-]{2,100}$/.test(normalized)) {
    throw new Error(
      'Organization code must be 2 to 100 characters and use only letters, numbers, hyphens, or underscores.'
    );
  }

  return normalized;
}

function validateOrganizationName(name: string) {
  const normalized = name.trim();

  if (normalized.length < 2 || normalized.length > 200) {
    throw new Error(
      'Organization name must be between 2 and 200 characters.'
    );
  }

  return normalized;
}

function validateStatus(status: string): OrganizationStatus {
  if (status !== 'ACTIVE' && status !== 'INACTIVE') {
    throw new Error('Status must be ACTIVE or INACTIVE.');
  }

  return status;
}

function validateUsername(username: string, label: string) {
  const normalized = username.trim();

  if (!/^[A-Za-z0-9_.-]{3,100}$/.test(normalized)) {
    throw new Error(
      `${label} must be 3 to 100 characters and use only letters, numbers, hyphens, underscores, or periods.`
    );
  }

  return normalized;
}

function validateEmail(email: string, label: string) {
  const normalized = email.trim();

  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  if (!EMAIL_FORMAT.test(normalized)) {
    throw new Error(`${label} must be a valid email address.`);
  }

  return normalized;
}

function buildOrganizationAdminUser(input: {
  username: string;
  email: string;
  usernameLabel: string;
  emailLabel: string;
}): OrganizationAdminUser {
  const username = validateUsername(input.username, input.usernameLabel);

  return {
    username,
    display_name: username,
    email: validateEmail(input.email, input.emailLabel),
    user_type: 'ADMIN',
    status: 'ACTIVE',
  };
}

function validateOrganizationAdminUsers(input: {
  adminUser1Username: string;
  adminUser1Email: string;
  adminUser2Username: string;
  adminUser2Email: string;
}): [OrganizationAdminUser, OrganizationAdminUser] {
  const adminUser1 = buildOrganizationAdminUser({
    username: input.adminUser1Username,
    email: input.adminUser1Email,
    usernameLabel: 'Admin User 1 Username',
    emailLabel: 'Admin User 1 Email',
  });
  const adminUser2 = buildOrganizationAdminUser({
    username: input.adminUser2Username,
    email: input.adminUser2Email,
    usernameLabel: 'Admin User 2 Username',
    emailLabel: 'Admin User 2 Email',
  });

  if (adminUser1.username === adminUser2.username) {
    throw new Error('Admin user usernames must be different from each other.');
  }

  if (adminUser1.email.toLowerCase() === adminUser2.email.toLowerCase()) {
    throw new Error('Admin user email addresses must be different from each other.');
  }

  return [adminUser1, adminUser2];
}

function createPasswordDigest(password: string) {
  return createHash('sha256').update(password).digest('hex');
}

function createSecurePassword() {
  return randomBytes(18).toString('base64url');
}

function buildOrganizationResourceKey(organizationCode: string) {
  return `ORG:${organizationCode}`;
}

function mapManagedOrganization(
  row: OrganizationListRow
): ManagedOrganization {
  return {
    id: toNumber(row.id),
    organizationCode: row.organization_code,
    organizationName: row.organization_name,
    status: row.status,
    userCount: toNumber(row.user_count),
    updatedAt: toIsoString(row.updated_at),
  };
}

function mapPendingOrganizationRequest(
  row: ApprovalRequestRow
): PendingOrganizationRequest {
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

function buildSnapshot(org: {
  id?: number;
  organizationCode: string;
  organizationName: string;
  status: OrganizationStatus;
  adminUsers?: readonly OrganizationAdminUser[];
}): OrganizationSnapshot {
  const [adminUser1, adminUser2] = org.adminUsers ?? [];

  return {
    ...(org.id ? { id: org.id } : {}),
    organization_code: org.organizationCode,
    organization_name: org.organizationName,
    status: org.status,
    ...(adminUser1
      ? {
          admin_user_1_username: adminUser1.username,
          admin_user_1_email: adminUser1.email,
        }
      : {}),
    ...(adminUser2
      ? {
          admin_user_2_username: adminUser2.username,
          admin_user_2_email: adminUser2.email,
        }
      : {}),
  };
}

function buildChangedFields(
  beforeState: OrganizationSnapshot | null,
  afterState: OrganizationSnapshot | null
) {
  const changedFields: OrganizationChangedFields = {};

  for (const field of ORGANIZATION_FIELDS) {
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

  if (context.session.organizationCode !== OWNER_ORGANIZATION_CODE) {
    throw new Error(
      'Only users in the Owner organization can access organization management.'
    );
  }

  if (
    context.session.userType !== 'ADMIN' &&
    !context.permissionCodes.includes(permissionCode)
  ) {
    throw new Error('You do not have permission to perform this action.');
  }

  return context;
}

async function findExistingOrganizationById(organizationId: number) {
  return db.queryOne<ExistingOrganizationRow>(
    `
      select
        o.id,
        o.organization_code,
        o.organization_name,
        o.status,
        count(distinct u.id) as user_count,
        o.updated_at
      from organizations o
      left join users u
        on u.organization_id = o.id
      where o.id = ?
      group by
        o.id,
        o.organization_code,
        o.organization_name,
        o.status,
        o.updated_at
    `,
    [organizationId]
  );
}

async function findExistingOrganizationByCode(organizationCode: string) {
  return db.queryOne<{ id: number | string; status: OrganizationStatus }>(
    `
      select
        id,
        status
      from organizations
      where organization_code = ?
    `,
    [organizationCode]
  );
}

async function findExistingUserByUsername(
  organizationId: number,
  username: string
) {
  return db.queryOne<{ id: number | string }>(
    `
      select
        id
      from users
      where organization_id = ?
        and username = ?
    `,
    [organizationId, username]
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
    [ORGANIZATION_RESOURCE_TYPE, resourceKey]
  );

  if (existingLock) {
    throw new Error(
      'A pending organization request already exists for this resource.'
    );
  }
}

async function recordApprovalSubmission(
  organizationId: number | null,
  actorUserId: number,
  resourceKey: string,
  approvalRequestId: number,
  actionType: OrganizationRequestAction,
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
      values (?, ?, 'ORGANIZATION_CHANGE_SUBMITTED', ?, ?, ?, ?)
    `,
    [
      organizationId,
      actorUserId,
      ORGANIZATION_RESOURCE_TYPE,
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
  actionType: OrganizationRequestAction;
  summary: string;
  beforeState: OrganizationSnapshot | null;
  afterState: OrganizationSnapshot | null;
  changedFields: OrganizationChangedFields | null;
  changePatch: OrganizationChangePatch;
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
      ORGANIZATION_RESOURCE_TYPE,
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
      [ORGANIZATION_RESOURCE_TYPE, input.resourceKey, approvalRequestId]
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
        'Failed to acquire the approval lock for this organization.',
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
        'Failed to acquire the approval lock for this organization.',
        JSON.stringify({ resource_key: input.resourceKey }),
      ]
    );

    throw new Error(
      'A pending organization request already exists for this resource.'
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

function buildCreatePatch(org: {
  organizationCode: string;
  organizationName: string;
  status: OrganizationStatus;
  adminUsers: [OrganizationAdminUser, OrganizationAdminUser];
}): CreateOrganizationPatch {
  return {
    op: 'CREATE_ORGANIZATION',
    values: {
      organization_code: org.organizationCode,
      organization_name: org.organizationName,
      status: org.status,
      admin_users: org.adminUsers,
    },
  };
}

function buildUpdatePatch(
  organizationId: number,
  org: {
    organizationName: string;
    status: OrganizationStatus;
  }
): UpdateOrganizationPatch {
  return {
    op: 'UPDATE_ORGANIZATION',
    target: {
      id: organizationId,
    },
    values: {
      organization_name: org.organizationName,
      status: org.status,
    },
  };
}

function buildDeletePatch(organizationId: number): DeleteOrganizationPatch {
  return {
    op: 'DELETE_ORGANIZATION',
    target: {
      id: organizationId,
    },
  };
}

function parseChangePatch(value: unknown) {
  const patch = parseJsonColumn<OrganizationChangePatch>(value);

  if (!patch) {
    throw new Error('The stored approval request payload is invalid.');
  }

  return patch;
}

function ensureActionMatchesPatch(
  actionType: OrganizationRequestAction,
  patch: OrganizationChangePatch
) {
  const expectedActionType =
    patch.op === 'CREATE_ORGANIZATION'
      ? 'CREATE'
      : patch.op === 'UPDATE_ORGANIZATION'
        ? 'UPDATE'
        : 'DELETE';

  if (actionType !== expectedActionType) {
    throw new Error(
      'The approval request payload does not match its action type.'
    );
  }
}

async function applyApprovedChange(patch: OrganizationChangePatch) {
  switch (patch.op) {
    case 'CREATE_ORGANIZATION': {
      const existingOrganization = await findExistingOrganizationByCode(
        patch.values.organization_code
      );

      if (!existingOrganization) {
        throw new Error('The organization placeholder no longer exists.');
      }

      if (existingOrganization.status !== 'INACTIVE') {
        throw new Error(
          'Only inactive organization placeholders can be approved.'
        );
      }

      const adminUsers = validateOrganizationAdminUsers({
        adminUser1Username: patch.values.admin_users[0]?.username ?? '',
        adminUser1Email: patch.values.admin_users[0]?.email ?? '',
        adminUser2Username: patch.values.admin_users[1]?.username ?? '',
        adminUser2Email: patch.values.admin_users[1]?.email ?? '',
      });
      const organizationId = toNumber(existingOrganization.id);
      const activateResult = await db.execute(
        `
          update organizations
          set organization_name = ?,
              status = 'ACTIVE'
          where organization_code = ?
            and status = 'INACTIVE'
        `,
        [patch.values.organization_name, patch.values.organization_code]
      );

      if (activateResult.affectedRows !== 1) {
        throw new Error('The organization could not be activated for approval.');
      }

      const generatedAdmins = adminUsers.map((adminUser) => ({
        ...adminUser,
        password: createSecurePassword(),
      }));
      const createdUsernames: string[] = [];

      try {
        for (const adminUser of generatedAdmins) {
          const existingUser = await findExistingUserByUsername(
            organizationId,
            adminUser.username
          );

          if (existingUser) {
            throw new Error(
              `A user with username ${adminUser.username} already exists for this organization.`
            );
          }

          await db.execute(
            `
              insert into users (
                organization_id,
                username,
                display_name,
                email,
                password_sha256,
                password_algo,
                user_type,
                status
              )
              values (?, ?, ?, ?, ?, 'SHA256', 'ADMIN', 'ACTIVE')
            `,
            [
              organizationId,
              adminUser.username,
              adminUser.display_name,
              adminUser.email,
              createPasswordDigest(adminUser.password),
            ]
          );

          createdUsernames.push(adminUser.username);
        }

        for (const adminUser of generatedAdmins) {
          await sendOrganizationAdminAccountCreatedEmail({
            organizationCode: patch.values.organization_code,
            organizationName: patch.values.organization_name,
            username: adminUser.username,
            email: adminUser.email,
            password: adminUser.password,
          });
        }
      } catch (error) {
        if (createdUsernames.length > 0) {
          const placeholders = createdUsernames.map(() => '?').join(', ');

          await db.execute(
            `
              delete from users
              where organization_id = ?
                and username in (${placeholders})
            `,
            [organizationId, ...createdUsernames]
          );
        }

        await db.execute(
          `
            update organizations
            set status = 'INACTIVE'
            where id = ?
          `,
          [organizationId]
        );

        if (error instanceof Error && error.message) {
          throw new Error(
            `The organization approval could not be completed: ${error.message}`
          );
        }

        throw new Error(
          'The organization approval could not be completed.'
        );
      }

      return;
    }
    case 'UPDATE_ORGANIZATION': {
      const existing = await findExistingOrganizationById(patch.target.id);

      if (!existing) {
        throw new Error('The organization no longer exists.');
      }

      await db.execute(
        `
          update organizations
          set organization_name = ?,
              status = ?
          where id = ?
        `,
        [patch.values.organization_name, patch.values.status, patch.target.id]
      );
      return;
    }
    case 'DELETE_ORGANIZATION': {
      const existing = await findExistingOrganizationById(patch.target.id);

      if (!existing) {
        throw new Error('The organization no longer exists.');
      }

      if (toNumber(existing.user_count) > 0) {
        throw new Error(
          'An organization with users cannot be deleted.'
        );
      }

      await db.execute(
        `
          delete from organizations
          where id = ?
        `,
        [patch.target.id]
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
        ? 'ORGANIZATION_CHANGE_APPROVED'
        : 'ORGANIZATION_CHANGE_REJECTED',
      ORGANIZATION_RESOURCE_TYPE,
      input.resourceKey,
      input.requestId,
      JSON.stringify({ comment: input.comment, summary: input.summary }),
    ]
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function searchOrganizationsPage(input: {
  organizationNameQuery?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedOrganizationSearchResult> {
  const normalizedQuery = (input.organizationNameQuery ?? '').trim();
  const likeQuery = `%${normalizedQuery}%`;
  const pageSize = Math.max(1, Math.min(input.pageSize ?? 10, 100));
  const page = Math.max(1, input.page ?? 1);
  const offset = (page - 1) * pageSize;

  const totalRow = await db.queryOne<{ total_count: number | string }>(
    `
      select
        count(*) as total_count
      from organizations o
      where (? = '%%' or o.organization_name like ?)
    `,
    [likeQuery, likeQuery]
  );

  const rows = await db.query<OrganizationListRow>(
    `
      select
        o.id,
        o.organization_code,
        o.organization_name,
        o.status,
        count(distinct u.id) as user_count,
        o.updated_at
      from organizations o
      left join users u
        on u.organization_id = o.id
      where (? = '%%' or o.organization_name like ?)
      group by
        o.id,
        o.organization_code,
        o.organization_name,
        o.status,
        o.updated_at
      order by o.organization_name asc
      limit ? offset ?
    `,
    [likeQuery, likeQuery, pageSize, offset]
  );

  return {
    rows: rows.map(mapManagedOrganization),
    totalCount: toNumber(totalRow?.total_count),
    page,
    pageSize,
  };
}

export async function getOrganizationById(organizationId: number) {
  requirePositiveInteger(organizationId, 'Organization');

  const row = await findExistingOrganizationById(organizationId);

  return row ? mapManagedOrganization(row) : null;
}

export async function listPendingOrganizationRequests() {
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
      where approval_request.resource_type = ?
        and approval_request.status = 'PENDING'
      order by approval_request.submitted_at desc
    `,
    [ORGANIZATION_RESOURCE_TYPE]
  );

  return rows.map(mapPendingOrganizationRequest);
}

export function buildOrganizationRouteResourceKey(organizationCode: string) {
  return buildOrganizationResourceKey(organizationCode);
}

export async function submitCreateOrganizationRequest(input: {
  organizationCode: string;
  organizationName: string;
  adminUser1Username: string;
  adminUser1Email: string;
  adminUser2Username: string;
  adminUser2Email: string;
}) {
  const context = await requirePermission('ORGANIZATION_WRITE');
  const organizationCode = validateOrganizationCode(input.organizationCode);
  const organizationName = validateOrganizationName(input.organizationName);
  const adminUsers = validateOrganizationAdminUsers(input);
  const status: OrganizationStatus = 'ACTIVE';
  const resourceKey = buildOrganizationResourceKey(organizationCode);

  await ensureNoPendingLock(resourceKey);

  const existing = await findExistingOrganizationByCode(organizationCode);

  if (existing) {
    throw new Error('An organization with this code already exists.');
  }

  const afterState = buildSnapshot({
    organizationCode,
    organizationName,
    status,
    adminUsers,
  });

  await createApprovalRequest({
    organizationId: context.session.organizationId,
    actorUserId: context.session.userId,
    resourceKey,
    actionType: 'CREATE',
    summary: `Create organization ${organizationCode}`,
    beforeState: null,
    afterState,
    changedFields: buildChangedFields(null, afterState),
    changePatch: buildCreatePatch({
      organizationCode,
      organizationName,
      status,
      adminUsers,
    }),
  });

  // Insert organization in INACTIVE state; will be activated upon approval
  await db.execute(
    `
      insert into organizations (
        organization_code,
        organization_name,
        status
      )
      values (?, ?, 'INACTIVE')
    `,
    [organizationCode, organizationName]
  );
}

export async function submitUpdateOrganizationRequest(input: {
  organizationId: number;
  organizationName: string;
  status: string;
}) {
  const context = await requirePermission('ORGANIZATION_WRITE');

  requirePositiveInteger(input.organizationId, 'Organization');

  const existing = await findExistingOrganizationById(input.organizationId);

  if (!existing) {
    throw new Error('The requested organization could not be found.');
  }

  const resourceKey = buildOrganizationResourceKey(
    existing.organization_code
  );

  await ensureNoPendingLock(resourceKey);

  const organizationName = validateOrganizationName(input.organizationName);
  const status = validateStatus(input.status);
  const beforeState = buildSnapshot({
    id: toNumber(existing.id),
    organizationCode: existing.organization_code,
    organizationName: existing.organization_name,
    status: existing.status,
  });
  const afterState = buildSnapshot({
    id: toNumber(existing.id),
    organizationCode: existing.organization_code,
    organizationName,
    status,
  });
  const changedFields = buildChangedFields(beforeState, afterState);

  if (!changedFields) {
    throw new Error('No changes were detected for this organization.');
  }

  await createApprovalRequest({
    organizationId: context.session.organizationId,
    actorUserId: context.session.userId,
    resourceKey,
    actionType: 'UPDATE',
    summary: `Update organization ${existing.organization_code}`,
    beforeState,
    afterState,
    changedFields,
    changePatch: buildUpdatePatch(toNumber(existing.id), {
      organizationName,
      status,
    }),
  });
}

export async function submitDeleteOrganizationRequest(input: {
  organizationId: number;
}) {
  const context = await requirePermission('ORGANIZATION_WRITE');

  requirePositiveInteger(input.organizationId, 'Organization');

  const existing = await findExistingOrganizationById(input.organizationId);

  if (!existing) {
    throw new Error('The requested organization could not be found.');
  }

  if (toNumber(existing.user_count) > 0) {
    throw new Error('An organization with users cannot be deleted.');
  }

  const resourceKey = buildOrganizationResourceKey(
    existing.organization_code
  );

  await ensureNoPendingLock(resourceKey);

  const beforeState = buildSnapshot({
    id: toNumber(existing.id),
    organizationCode: existing.organization_code,
    organizationName: existing.organization_name,
    status: existing.status,
  });

  await createApprovalRequest({
    organizationId: context.session.organizationId,
    actorUserId: context.session.userId,
    resourceKey,
    actionType: 'DELETE',
    summary: `Delete organization ${existing.organization_code}`,
    beforeState,
    afterState: null,
    changedFields: buildChangedFields(beforeState, null),
    changePatch: buildDeletePatch(toNumber(existing.id)),
  });
}

export async function approveOrganizationRequest(input: {
  requestId: number;
  comment: string;
}) {
  const context = await requirePermission('ORGANIZATION_APPROVE');

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
        and resource_type = ?
    `,
    [input.requestId, ORGANIZATION_RESOURCE_TYPE]
  );

  if (!request || request.status !== 'PENDING') {
    throw new Error('Only pending organization requests can be approved.');
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

export async function rejectOrganizationRequest(input: {
  requestId: number;
  comment: string;
}) {
  const context = await requirePermission('ORGANIZATION_APPROVE');

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
        and resource_type = ?
    `,
    [input.requestId, ORGANIZATION_RESOURCE_TYPE]
  );

  if (!request || request.status !== 'PENDING') {
    throw new Error('Only pending organization requests can be rejected.');
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

  if (patch.op === 'CREATE_ORGANIZATION') {
    await revertRejectedCreateOrganizationPatch(patch);
  }
}

export async function applyApprovedOrganizationPatch(patch: unknown) {
  await applyApprovedChange(parseChangePatch(patch));
}

export async function revertRejectedCreateOrganizationPatch(patch: unknown) {
  const parsedPatch = parseChangePatch(patch);

  if (parsedPatch.op !== 'CREATE_ORGANIZATION') {
    return;
  }

  await db.execute(
    `
      delete from organizations
      where organization_code = ?
        and status = 'INACTIVE'
    `,
    [parsedPatch.values.organization_code]
  );
}
