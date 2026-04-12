import Link from 'next/link';

import {
  SortableQueryTable,
  type SortableQueryTableColumn,
  type SortableQueryTableRow,
} from '@/components/sortable-query-table';
import { Button } from '@/components/ui/button';
import { requireNavigationItemAccess } from '@/lib/auth/authorization';
import { searchAuditEventsPage } from '@/lib/audit-events';

import { AuditLogSearchForm } from './audit-log-search-form';

type AuditLogPageProps = {
  searchParams: Promise<{
    eventType?: string;
    resourceType?: string;
    occurredAtStart?: string;
    occurredAtEnd?: string;
    page?: string;
    notice?: string;
    error?: string;
  }>;
};

const PAGE_SIZE = 10;

const AUDIT_LOG_TABLE_COLUMNS: readonly SortableQueryTableColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'eventType', label: 'Event Type' },
  { key: 'resource', label: 'Resource' },
  { key: 'actor', label: 'Actor' },
  { key: 'occurredAt', label: 'Occurred At' },
];

function buildPageHref(
  eventTypeFilter: string,
  resourceTypeFilter: string,
  occurredAtStartFilter: string,
  occurredAtEndFilter: string,
  page: number
) {
  const params = new URLSearchParams();

  if (eventTypeFilter) {
    params.set('eventType', eventTypeFilter);
  }

  if (resourceTypeFilter) {
    params.set('resourceType', resourceTypeFilter);
  }

  if (occurredAtStartFilter) {
    params.set('occurredAtStart', occurredAtStartFilter);
  }

  if (occurredAtEndFilter) {
    params.set('occurredAtEnd', occurredAtEndFilter);
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  const query = params.toString();

  return query ? `/admin/audit-log?${query}` : '/admin/audit-log';
}

export default async function AuditLogPage({
  searchParams,
}: AuditLogPageProps) {
  const params = await searchParams;
  const eventTypeFilter = (params.eventType ?? '').trim();
  const resourceTypeFilter = (params.resourceType ?? '').trim();
  const occurredAtStartFilter = (params.occurredAtStart ?? '').trim();
  const occurredAtEndFilter = (params.occurredAtEnd ?? '').trim();
  const currentPage = Math.max(
    1,
    Number.parseInt(params.page ?? '1', 10) || 1
  );

  const { session } = await requireNavigationItemAccess(
    'admin',
    'audit-log'
  );

  const result = await searchAuditEventsPage({
    organizationId: session.organizationId,
    eventTypeFilter,
    resourceTypeFilter,
    occurredAtStartFilter,
    occurredAtEndFilter,
    page: currentPage,
    pageSize: PAGE_SIZE,
  });

  const { rows: events, totalCount, page, pageSize } = result;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const eventRows: SortableQueryTableRow[] = events.map((event) => ({
    id: event.id,
    cells: {
      id: {
        kind: 'link',
        href: `/admin/audit-log/${event.id}`,
        primary: String(event.id),
        sortValue: event.id,
      },
      eventType: {
        kind: 'text',
        primary: event.eventType,
        sortValue: event.eventType,
      },
      resource: {
        kind: 'text',
        primary: event.resourceType,
        secondary: event.resourceKey,
        sortValue: event.resourceType,
      },
      actor: {
        kind: 'text',
        primary: event.actorDisplayName ?? '-',
        sortValue: event.actorDisplayName ?? '',
      },
      occurredAt: {
        kind: 'datetime',
        value: event.occurredAt,
        primary: event.occurredAt,
        sortValue: new Date(event.occurredAt).getTime(),
      },
    },
  }));

  return (
    <div className="grid gap-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[1.05rem] font-semibold tracking-tight text-slate-950">
              Audit Log search
            </h2>
          </div>
        </div>

        <AuditLogSearchForm
          action="/admin/audit-log"
          eventTypeFilter={eventTypeFilter}
          resourceTypeFilter={resourceTypeFilter}
          occurredAtStartFilter={occurredAtStartFilter}
          occurredAtEndFilter={occurredAtEndFilter}
        />

        {params.notice ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {params.notice}
          </div>
        ) : null}

        {params.error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {params.error}
          </div>
        ) : null}
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-1 shadow-sm">
        <div className="flex flex-wrap items-center justify-end gap-3 px-5 pt-5 text-sm text-slate-600">
          <p>
            Page {page} of {totalPages}
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200">
          <SortableQueryTable
            columns={AUDIT_LOG_TABLE_COLUMNS}
            rows={eventRows}
            emptyMessage="No audit events matched the current filters."
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 px-5 py-5">
          {page > 1 ? (
            <Button variant="outline" className="rounded-2xl" asChild>
              <Link
                href={buildPageHref(
                  eventTypeFilter,
                  resourceTypeFilter,
                  occurredAtStartFilter,
                  occurredAtEndFilter,
                  page - 1
                )}
              >
                Previous
              </Link>
            </Button>
          ) : (
            <Button variant="outline" className="rounded-2xl" disabled>
              Previous
            </Button>
          )}

          {page < totalPages ? (
            <Button variant="outline" className="rounded-2xl" asChild>
              <Link
                href={buildPageHref(
                  eventTypeFilter,
                  resourceTypeFilter,
                  occurredAtStartFilter,
                  occurredAtEndFilter,
                  page + 1
                )}
              >
                Next
              </Link>
            </Button>
          ) : (
            <Button variant="outline" className="rounded-2xl" disabled>
              Next
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
