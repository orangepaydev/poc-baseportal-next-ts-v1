import Link from 'next/link';
import { Search } from 'lucide-react';

import {
  SortableQueryTable,
  type SortableQueryTableColumn,
  type SortableQueryTableRow,
} from '@/components/sortable-query-table';
import { Button } from '@/components/ui/button';
import { requireNavigationItemAccess } from '@/lib/auth/authorization';
import { searchAuditEventsPage } from '@/lib/audit-events';

type AuditLogPageProps = {
  searchParams: Promise<{
    eventType?: string;
    resourceType?: string;
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
  page: number
) {
  const params = new URLSearchParams();

  if (eventTypeFilter) {
    params.set('eventType', eventTypeFilter);
  }

  if (resourceTypeFilter) {
    params.set('resourceType', resourceTypeFilter);
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  const query = params.toString();

  return query ? `/admin/audit-log?${query}` : '/admin/audit-log';
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-SG', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatDate(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

export default async function AuditLogPage({
  searchParams,
}: AuditLogPageProps) {
  const params = await searchParams;
  const eventTypeFilter = (params.eventType ?? '').trim();
  const resourceTypeFilter = (params.resourceType ?? '').trim();
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
        kind: 'text',
        primary: formatDate(event.occurredAt),
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

        <form
          action="/admin/audit-log"
          className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_auto]"
        >
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Event Type</span>
            <input
              name="eventType"
              type="text"
              defaultValue={eventTypeFilter}
              placeholder="e.g. AUTH_LOGIN_SUCCEEDED"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Resource Type</span>
            <input
              name="resourceType"
              type="text"
              defaultValue={resourceTypeFilter}
              placeholder="e.g. USER"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
            />
          </label>

          <div className="flex items-end">
            <Button
              type="submit"
              className="w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-800 lg:w-auto"
            >
              <Search className="size-4" />
              Search
            </Button>
          </div>
        </form>

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
