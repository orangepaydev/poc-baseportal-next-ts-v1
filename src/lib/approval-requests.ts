import 'server-only';

import { db } from '@/lib/db';
import { getAuthenticatedUserContext } from '@/lib/auth/authorization';
import {
  applyApprovedOrganizationPatch,
  revertRejectedCreateOrganizationPatch,
} from '@/lib/organizations';
import type { SystemPropertyChangePatch } from '@/lib/system-properties';
import type { SystemCodeChangePatch } from '@/lib/system-codes';

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'ADD' | 'REMOVE';

type ApprovalRequestListRow = {
  id: number | string;
  resource_type: string;
  resource_key: string;
  action_type: ActionType;
  status: ApprovalStatus;
  summary: string;
  submitted_by_display_name: string | null;
  submitted_at: Date | string;
  reviewed_by_display_name: string | null;
  reviewed_at: Date | string | null;
};

type ApprovalRequestDetailRow = ApprovalRequestListRow & {
  before_state: unknown;
  after_state: unknown;
  changed_fields: unknown;
  change_patch: unknown;
  review_comment: string | null;
  submitted_by_user_id: number | string | null;
  reviewed_by_user_id: number | string | null;
};

type ApprovalRequestActionRow = {
  id: number | string;
  action_type: string;
  acted_by_display_name: string | null;
  acted_at: Date | string;
  comment_text: string | null;
};

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

export type ApprovalRequestListItem = {
  id: number;
  resourceType: string;
  resourceKey: string;
  actionType: ActionType;
  status: ApprovalStatus;
  summary: string;
  submittedByDisplayName: string | null;
  submittedAt: string;
  reviewedByDisplayName: string | null;
  reviewedAt: string | null;
};

export type ApprovalRequestDetail = ApprovalRequestListItem & {
  beforeState: unknown;
  afterState: unknown;
  changedFields: unknown;
  changePatch: unknown;
  reviewComment: string | null;
  submittedByUserId: number | null;
  reviewedByUserId: number | null;
  actions: ApprovalRequestActionItem[];
};

export type ApprovalRequestActionItem = {
  id: number;
  actionType: string;
  actedByDisplayName: string | null;
  actedAt: string;
  commentText: string | null;
};

export type PaginatedApprovalRequestResult = {
  rows: ApprovalRequestListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
};

function mapListItem(row: ApprovalRequestListRow): ApprovalRequestListItem {
  return {
    id: toNumber(row.id),
    resourceType: row.resource_type,
    resourceKey: row.resource_key,
    actionType: row.action_type,
    status: row.status,
    summary: row.summary,
    submittedByDisplayName: row.submitted_by_display_name,
    submittedAt: toIsoString(row.submitted_at),
    reviewedByDisplayName: row.reviewed_by_display_name,
    reviewedAt: row.reviewed_at ? toIsoString(row.reviewed_at) : null,
  };
}

function mapActionItem(row: ApprovalRequestActionRow): ApprovalRequestActionItem {
  return {
    id: toNumber(row.id),
    actionType: row.action_type,
    actedByDisplayName: row.acted_by_display_name,
    actedAt: toIsoString(row.acted_at),
    commentText: row.comment_text,
  };
}

export async function searchApprovalRequestsPage(input: {
  organizationId: number;
  statusFilter?: string;
  resourceTypeFilter?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedApprovalRequestResult> {
  const statusFilter = (input.statusFilter ?? '').trim();
  const resourceTypeFilter = (input.resourceTypeFilter ?? '').trim();
  const pageSize = Math.max(1, Math.min(input.pageSize ?? 10, 100));
  const page = Math.max(1, input.page ?? 1);
  const offset = (page - 1) * pageSize;

  const totalRow = await db.queryOne<{ total_count: number | string }>(
    `
      select
        count(*) as total_count
      from approval_requests ar
      where ar.organization_id = ?
        and (? = '' or ar.status = ?)
        and (? = '' or ar.resource_type = ?)
    `,
    [
      input.organizationId,
      statusFilter, statusFilter,
      resourceTypeFilter, resourceTypeFilter,
    ]
  );

  const rows = await db.query<ApprovalRequestListRow>(
    `
      select
        ar.id,
        ar.resource_type,
        ar.resource_key,
        ar.action_type,
        ar.status,
        ar.summary,
        submitter.display_name as submitted_by_display_name,
        ar.submitted_at,
        reviewer.display_name as reviewed_by_display_name,
        ar.reviewed_at
      from approval_requests ar
      left join users submitter
        on submitter.id = ar.submitted_by_user_id
      left join users reviewer
        on reviewer.id = ar.reviewed_by_user_id
      where ar.organization_id = ?
        and (? = '' or ar.status = ?)
        and (? = '' or ar.resource_type = ?)
      order by
        case when ar.status = 'PENDING' then 0 else 1 end,
        ar.submitted_at desc
      limit ? offset ?
    `,
    [
      input.organizationId,
      statusFilter, statusFilter,
      resourceTypeFilter, resourceTypeFilter,
      pageSize, offset,
    ]
  );

  return {
    rows: rows.map(mapListItem),
    totalCount: toNumber(totalRow?.total_count),
    page,
    pageSize,
  };
}

export async function getApprovalRequestById(
  organizationId: number,
  requestId: number
): Promise<ApprovalRequestDetail | null> {
  const row = await db.queryOne<ApprovalRequestDetailRow>(
    `
      select
        ar.id,
        ar.resource_type,
        ar.resource_key,
        ar.action_type,
        ar.status,
        ar.summary,
        ar.before_state,
        ar.after_state,
        ar.changed_fields,
        ar.change_patch,
        ar.review_comment,
        ar.submitted_by_user_id,
        submitter.display_name as submitted_by_display_name,
        ar.submitted_at,
        ar.reviewed_by_user_id,
        reviewer.display_name as reviewed_by_display_name,
        ar.reviewed_at
      from approval_requests ar
      left join users submitter
        on submitter.id = ar.submitted_by_user_id
      left join users reviewer
        on reviewer.id = ar.reviewed_by_user_id
      where ar.organization_id = ?
        and ar.id = ?
    `,
    [organizationId, requestId]
  );

  if (!row) {
    return null;
  }

  const actionRows = await db.query<ApprovalRequestActionRow>(
    `
      select
        ara.id,
        ara.action_type,
        actor.display_name as acted_by_display_name,
        ara.acted_at,
        ara.comment_text
      from approval_request_actions ara
      left join users actor
        on actor.id = ara.acted_by_user_id
      where ara.approval_request_id = ?
      order by ara.acted_at asc
    `,
    [requestId]
  );

  return {
    ...mapListItem(row),
    beforeState: parseJsonColumn(row.before_state),
    afterState: parseJsonColumn(row.after_state),
    changedFields: parseJsonColumn(row.changed_fields),
    changePatch: parseJsonColumn(row.change_patch),
    reviewComment: row.review_comment,
    submittedByUserId:
      row.submitted_by_user_id === null
        ? null
        : toNumber(row.submitted_by_user_id),
    reviewedByUserId:
      row.reviewed_by_user_id === null
        ? null
        : toNumber(row.reviewed_by_user_id),
    actions: actionRows.map(mapActionItem),
  };
}

// ---------------------------------------------------------------------------
// Approve / Reject
// ---------------------------------------------------------------------------

type ChangePatchPayload = Record<string, unknown>;

function requirePendingRequest(row: ApprovalRequestDetailRow | null) {
  if (!row || row.status !== 'PENDING') {
    throw new Error('Only pending requests can be approved or rejected.');
  }

  return row;
}

function normalizeComment(comment: string) {
  const normalized = comment.trim();

  return normalized || null;
}

async function completeReview(input: {
  requestId: number;
  status: 'APPROVED' | 'REJECTED';
  actorUserId: number;
  organizationId: number;
  resourceType: string;
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
      `${input.resourceType}_CHANGE_${input.status}`,
      input.resourceType,
      input.resourceKey,
      input.requestId,
      JSON.stringify({ comment: input.comment, summary: input.summary }),
    ]
  );
}

// ---------------------------------------------------------------------------
// Resource-type specific change-patch handlers
// ---------------------------------------------------------------------------

async function applyApprovedUserGroupPatch(patch: ChangePatchPayload) {
  switch (patch.op) {
    case 'CREATE_USER_GROUP': {
      const values = patch.values as {
        organization_id: number;
        group_code: string;
        group_name: string;
        description: string | null;
      };

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
        [values.group_name, values.description, values.organization_id, values.group_code]
      );
      return;
    }
    case 'UPDATE_USER_GROUP': {
      const target = patch.target as { id: number; organization_id: number };
      const values = patch.values as {
        group_name: string;
        description: string | null;
        status: string;
      };

      await db.execute(
        `
          update user_groups
          set group_name = ?,
              description = ?,
              status = ?
          where id = ?
            and organization_id = ?
        `,
        [values.group_name, values.description, values.status, target.id, target.organization_id]
      );
      return;
    }
    case 'DELETE_USER_GROUP': {
      const target = patch.target as { id: number; organization_id: number };

      await db.execute(
        `
          delete from user_groups
          where id = ?
            and organization_id = ?
        `,
        [target.id, target.organization_id]
      );
      return;
    }
    default:
      throw new Error(`Unsupported user group patch operation: ${String(patch.op)}`);
  }
}

async function applyApprovedSystemCodePatch(patch: SystemCodeChangePatch) {
  switch (patch.op) {
    case 'CREATE_SYSTEM_CODE': {
      await db.execute(
        `
          update system_codes
          set description = ?,
              status = ?
          where id = ?
        `,
        [patch.values.description, patch.values.status, patch.target.id]
      );
      return;
    }
    case 'UPDATE_SYSTEM_CODE': {
      await db.execute(
        `
          update system_codes
          set description = ?,
              status = ?
          where id = ?
        `,
        [patch.values.description, patch.values.status, patch.target.id]
      );

      for (const valueId of patch.values.remove_value_ids) {
        await db.execute(
          `
            delete from system_code_values
            where id = ?
              and system_code_id = ?
          `,
          [valueId, patch.target.id]
        );
      }

      for (const value of patch.values.add_values) {
        await db.execute(
          `
            insert into system_code_values (
              system_code_id,
              system_code_value,
              description,
              status,
              sort_order
            )
            values (?, ?, ?, ?, ?)
          `,
          [
            patch.target.id,
            value.system_code_value,
            value.description,
            value.status,
            value.sort_order,
          ]
        );
      }

      return;
    }
    default:
      {
        const unsupportedPatch = patch as { op?: unknown };

      throw new Error(
        `Unsupported system code patch operation: ${String(unsupportedPatch.op)}`
      );
      }
  }
}

async function applyApprovedSystemPropertyPatch(
  patch: SystemPropertyChangePatch
) {
  switch (patch.op) {
    case 'CREATE_SYSTEM_PROPERTY': {
      await db.execute(
        `
          insert into system_properties (
            property_code,
            description
          )
          values (?, ?)
        `,
        [patch.values.property_code, patch.values.description]
      );
      return;
    }
    case 'CREATE_SYSTEM_PROPERTY_VALUE': {
      await db.execute(
        `
          insert into system_property_codes (
            system_property_id,
            property_item_code,
            property_value,
            description
          )
          values (?, ?, ?, ?)
        `,
        [
          patch.target.system_property_id,
          patch.values.property_item_code,
          patch.values.property_value,
          patch.values.description,
        ]
      );
      return;
    }
    case 'UPDATE_SYSTEM_PROPERTY_VALUE': {
      await db.execute(
        `
          update system_property_codes
          set property_item_code = ?,
              property_value = ?,
              description = ?
          where id = ?
            and system_property_id = ?
        `,
        [
          patch.values.property_item_code,
          patch.values.property_value,
          patch.values.description,
          patch.target.id,
          patch.target.system_property_id,
        ]
      );
      return;
    }
    case 'DELETE_SYSTEM_PROPERTY_VALUE': {
      await db.execute(
        `
          delete from system_property_codes
          where id = ?
            and system_property_id = ?
        `,
        [patch.target.id, patch.target.system_property_id]
      );
      return;
    }
    default:
      {
        const unsupportedPatch = patch as { op?: unknown };

        throw new Error(
          `Unsupported system property patch operation: ${String(unsupportedPatch.op)}`
        );
      }
  }
}

async function revertRejectedCreate(
  resourceType: string,
  patch: ChangePatchPayload
) {
  if (resourceType === 'ORGANIZATION') {
    await revertRejectedCreateOrganizationPatch(patch);
    return;
  }

  if (resourceType === 'SYSTEM_CODE' && patch.op === 'CREATE_SYSTEM_CODE') {
    const systemCodePatch = patch as SystemCodeChangePatch;

    await db.execute('delete from system_codes where id = ? and status = ?', [
      systemCodePatch.target.id,
      'INACTIVE',
    ]);
    return;
  }

  if (resourceType === 'SYSTEM_PROPERTY') {
    return;
  }

  if (resourceType === 'USER_GROUP' && patch.op === 'CREATE_USER_GROUP') {
    const values = patch.values as {
      organization_id: number;
      group_code: string;
    };

    await db.execute(
      `
        delete from user_groups
        where organization_id = ?
          and group_code = ?
          and status = 'INACTIVE'
      `,
      [values.organization_id, values.group_code]
    );
  }
}

async function applyApprovedPatch(
  resourceType: string,
  patch: ChangePatchPayload
) {
  switch (resourceType) {
    case 'ORGANIZATION':
      return applyApprovedOrganizationPatch(patch);
    case 'SYSTEM_CODE':
      return applyApprovedSystemCodePatch(patch as SystemCodeChangePatch);
    case 'SYSTEM_PROPERTY':
      return applyApprovedSystemPropertyPatch(
        patch as SystemPropertyChangePatch
      );
    case 'USER_GROUP':
      return applyApprovedUserGroupPatch(patch);
    default:
      throw new Error(`Unsupported resource type for approval: ${resourceType}`);
  }
}

async function loadPendingRequest(requestId: number, organizationId: number) {
  return db.queryOne<ApprovalRequestDetailRow>(
    `
      select
        ar.id,
        ar.resource_type,
        ar.resource_key,
        ar.action_type,
        ar.status,
        ar.summary,
        ar.before_state,
        ar.after_state,
        ar.changed_fields,
        ar.change_patch,
        ar.review_comment,
        ar.submitted_by_user_id,
        submitter.display_name as submitted_by_display_name,
        ar.submitted_at,
        ar.reviewed_by_user_id,
        reviewer.display_name as reviewed_by_display_name,
        ar.reviewed_at
      from approval_requests ar
      left join users submitter
        on submitter.id = ar.submitted_by_user_id
      left join users reviewer
        on reviewer.id = ar.reviewed_by_user_id
      where ar.id = ?
        and ar.organization_id = ?
    `,
    [requestId, organizationId]
  );
}

export async function approveRequest(input: {
  requestId: number;
  comment: string;
}) {
  const context = await getAuthenticatedUserContext();

  if (
    context.session.userType !== 'ADMIN' &&
    !context.permissionCodes.includes('APPROVAL_REQUEST_APPROVE')
  ) {
    throw new Error('You do not have permission to approve requests.');
  }

  const row = requirePendingRequest(
    await loadPendingRequest(input.requestId, context.session.organizationId)
  );

  if (toNumber(row.submitted_by_user_id) === context.session.userId) {
    throw new Error('You cannot approve a request you submitted.');
  }

  const patch = parseJsonColumn<ChangePatchPayload>(row.change_patch);

  if (!patch) {
    throw new Error('The stored approval request payload is invalid.');
  }

  await applyApprovedPatch(row.resource_type, patch);

  await completeReview({
    requestId: toNumber(row.id),
    status: 'APPROVED',
    actorUserId: context.session.userId,
    organizationId: context.session.organizationId,
    resourceType: row.resource_type,
    resourceKey: row.resource_key,
    comment: normalizeComment(input.comment),
    summary: row.summary,
  });
}

export async function rejectRequest(input: {
  requestId: number;
  comment: string;
}) {
  const context = await getAuthenticatedUserContext();

  if (
    context.session.userType !== 'ADMIN' &&
    !context.permissionCodes.includes('APPROVAL_REQUEST_APPROVE')
  ) {
    throw new Error('You do not have permission to reject requests.');
  }

  const row = requirePendingRequest(
    await loadPendingRequest(input.requestId, context.session.organizationId)
  );

  if (toNumber(row.submitted_by_user_id) === context.session.userId) {
    throw new Error('You cannot reject a request you submitted.');
  }

  const patch = parseJsonColumn<ChangePatchPayload>(row.change_patch);

  await completeReview({
    requestId: toNumber(row.id),
    status: 'REJECTED',
    actorUserId: context.session.userId,
    organizationId: context.session.organizationId,
    resourceType: row.resource_type,
    resourceKey: row.resource_key,
    comment: normalizeComment(input.comment),
    summary: row.summary,
  });

  // For CREATE requests, the record was already inserted as INACTIVE — clean it up.
  if (
    patch &&
    (row.action_type === 'CREATE' || row.action_type === 'ADD')
  ) {
    await revertRejectedCreate(row.resource_type, patch);
  }
}
