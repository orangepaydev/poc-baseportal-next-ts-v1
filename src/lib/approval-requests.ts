import 'server-only';

import { db } from '@/lib/db';

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
