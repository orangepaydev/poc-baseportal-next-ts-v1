import 'server-only';

import { db } from '@/lib/db';
import { getAuthenticatedUserContext } from '@/lib/auth/authorization';

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
const ORGANIZATION_FIELDS = [
  'organization_code',
  'organization_name',
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
}): OrganizationSnapshot {
  return {
    ...(org.id ? { id: org.id } : {}),
    organization_code: org.organizationCode,
    organization_name: org.organizationName,
    status: org.status,
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
  return db.queryOne<{ id: number | string }>(
    `
      select
        id
      from organizations
      where organization_code = ?
    `,
    [organizationCode]
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
}): CreateOrganizationPatch {
  return {
    op: 'CREATE_ORGANIZATION',
    values: {
      organization_code: org.organizationCode,
      organization_name: org.organizationName,
      status: org.status,
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
      await db.execute(
        `
          update organizations
          set organization_name = ?,
              status = 'ACTIVE'
          where organization_code = ?
            and status = 'INACTIVE'
        `,
        [patch.values.organization_name, patch.values.organization_code]
      );
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
}) {
  const context = await requirePermission('ORGANIZATION_WRITE');
  const organizationCode = validateOrganizationCode(input.organizationCode);
  const organizationName = validateOrganizationName(input.organizationName);
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
    await db.execute(
      `
        delete from organizations
        where organization_code = ?
          and status = 'INACTIVE'
      `,
      [patch.values.organization_code]
    );
  }
}
