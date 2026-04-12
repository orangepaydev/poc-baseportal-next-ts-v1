import 'server-only';

import { db } from '@/lib/db';

type AuditEventListRow = {
  id: number | string;
  event_type: string;
  resource_type: string;
  resource_key: string;
  actor_display_name: string | null;
  occurred_at: Date | string;
};

type AuditEventDetailRow = AuditEventListRow & {
  organization_id: number | string | null;
  organization_code: string | null;
  actor_user_id: number | string | null;
  actor_username: string | null;
  approval_request_id: number | string | null;
  event_data: unknown;
  ip_address: string | null;
  user_agent: string | null;
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

type ParsedLocalDateTime = {
  date: Date;
};

const UTC_DATE_TIME_WITH_TIMEZONE_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

function parseUtcDateTime(value: string): ParsedLocalDateTime | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (!UTC_DATE_TIME_WITH_TIMEZONE_PATTERN.test(trimmedValue)) {
    return null;
  }

  const date = new Date(trimmedValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    date,
  };
}

function formatSqlDateTimePart(value: number) {
  return String(value).padStart(2, '0');
}

function formatUtcSqlDateTime(date: Date) {
  return `${date.getUTCFullYear()}-${formatSqlDateTimePart(
    date.getUTCMonth() + 1
  )}-${formatSqlDateTimePart(date.getUTCDate())} ${formatSqlDateTimePart(
    date.getUTCHours()
  )}:${formatSqlDateTimePart(date.getUTCMinutes())}:${formatSqlDateTimePart(
    date.getUTCSeconds()
  )}`;
}

function getOccurredAtRangeFilters(input: {
  occurredAtStartFilter?: string;
  occurredAtEndFilter?: string;
}) {
  const startDateTime = parseUtcDateTime(input.occurredAtStartFilter ?? '');
  const endDateTime = parseUtcDateTime(input.occurredAtEndFilter ?? '');

  const occurredAtStart = startDateTime
    ? formatUtcSqlDateTime(startDateTime.date)
    : '';

  let occurredAtEndExclusive = '';

  if (endDateTime) {
    const endDate = new Date(endDateTime.date.getTime());
    endDate.setUTCSeconds(endDate.getUTCSeconds() + 1);
    occurredAtEndExclusive = formatUtcSqlDateTime(endDate);
  }

  return {
    occurredAtStart,
    occurredAtEndExclusive,
  };
}

export type AuditEventListItem = {
  id: number;
  eventType: string;
  resourceType: string;
  resourceKey: string;
  actorDisplayName: string | null;
  occurredAt: string;
};

export type AuditEventDetail = AuditEventListItem & {
  organizationId: number | null;
  organizationCode: string | null;
  actorUserId: number | null;
  actorUsername: string | null;
  approvalRequestId: number | null;
  eventData: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
};

export type PaginatedAuditEventResult = {
  rows: AuditEventListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
};

function mapListItem(row: AuditEventListRow): AuditEventListItem {
  return {
    id: toNumber(row.id),
    eventType: row.event_type,
    resourceType: row.resource_type,
    resourceKey: row.resource_key,
    actorDisplayName: row.actor_display_name,
    occurredAt: toIsoString(row.occurred_at),
  };
}

function mapDetail(row: AuditEventDetailRow): AuditEventDetail {
  return {
    id: toNumber(row.id),
    eventType: row.event_type,
    resourceType: row.resource_type,
    resourceKey: row.resource_key,
    actorDisplayName: row.actor_display_name,
    occurredAt: toIsoString(row.occurred_at),
    organizationId:
      row.organization_id === null ? null : toNumber(row.organization_id),
    organizationCode: row.organization_code,
    actorUserId:
      row.actor_user_id === null ? null : toNumber(row.actor_user_id),
    actorUsername: row.actor_username,
    approvalRequestId:
      row.approval_request_id === null
        ? null
        : toNumber(row.approval_request_id),
    eventData: parseJsonColumn<Record<string, unknown>>(row.event_data),
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
  };
}

export async function searchAuditEventsPage(input: {
  organizationId: number;
  eventTypeFilter?: string;
  resourceTypeFilter?: string;
  occurredAtStartFilter?: string;
  occurredAtEndFilter?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedAuditEventResult> {
  const eventTypeFilter = (input.eventTypeFilter ?? '').trim();
  const resourceTypeFilter = (input.resourceTypeFilter ?? '').trim();
  const { occurredAtStart, occurredAtEndExclusive } =
    getOccurredAtRangeFilters(input);
  const pageSize = Math.max(1, Math.min(input.pageSize ?? 10, 100));
  const page = Math.max(1, input.page ?? 1);
  const offset = (page - 1) * pageSize;

  const totalRow = await db.queryOne<{ total_count: number | string }>(
    `
      select
        count(*) as total_count
      from audit_events ae
      where ae.organization_id = ?
        and (? = '' or ae.event_type = ?)
        and (? = '' or ae.resource_type = ?)
        and (? = '' or ae.occurred_at >= ?)
        and (? = '' or ae.occurred_at < ?)
    `,
    [
      input.organizationId,
      eventTypeFilter,
      eventTypeFilter,
      resourceTypeFilter,
      resourceTypeFilter,
      occurredAtStart,
      occurredAtStart,
      occurredAtEndExclusive,
      occurredAtEndExclusive,
    ]
  );

  const rows = await db.query<AuditEventListRow>(
    `
      select
        ae.id,
        ae.event_type,
        ae.resource_type,
        ae.resource_key,
        actor.display_name as actor_display_name,
        CONCAT(DATE_FORMAT(ae.occurred_at, '%Y-%m-%dT%T.000'), 'Z') AS occurred_at
      from audit_events ae
      left join users actor
        on actor.id = ae.actor_user_id
      where ae.organization_id = ?
        and (? = '' or ae.event_type = ?)
        and (? = '' or ae.resource_type = ?)
        and (? = '' or ae.occurred_at >= ?)
        and (? = '' or ae.occurred_at < ?)
      order by ae.occurred_at desc, ae.id desc
      limit ? offset ?
    `,
    [
      input.organizationId,
      eventTypeFilter,
      eventTypeFilter,
      resourceTypeFilter,
      resourceTypeFilter,
      occurredAtStart,
      occurredAtStart,
      occurredAtEndExclusive,
      occurredAtEndExclusive,
      pageSize,
      offset,
    ]
  );

  return {
    rows: rows.map(mapListItem),
    totalCount: toNumber(totalRow?.total_count),
    page,
    pageSize,
  };
}

export async function getAuditEventById(
  organizationId: number,
  eventId: number
): Promise<AuditEventDetail | null> {
  const row = await db.queryOne<AuditEventDetailRow>(
    `
      select
        ae.id,
        ae.organization_id,
        org.organization_code,
        ae.actor_user_id,
        actor.username as actor_username,
        actor.display_name as actor_display_name,
        ae.event_type,
        ae.resource_type,
        ae.resource_key,
        ae.approval_request_id,
        ae.event_data,
        ae.ip_address,
        ae.user_agent,
        CONCAT(DATE_FORMAT(ae.occurred_at, '%Y-%m-%dT%T.000'), 'Z') AS occurred_at
      from audit_events ae
      left join organizations org
        on org.id = ae.organization_id
      left join users actor
        on actor.id = ae.actor_user_id
      where ae.organization_id = ?
        and ae.id = ?
    `,
    [organizationId, eventId]
  );

  if (!row) {
    return null;
  }

  return mapDetail(row);
}
