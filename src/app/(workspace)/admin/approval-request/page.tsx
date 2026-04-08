import Link from 'next/link';
import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { requireNavigationItemAccess } from '@/lib/auth/authorization';
import { searchApprovalRequestsPage } from '@/lib/approval-requests';

type ApprovalRequestPageProps = {
  searchParams: Promise<{
    status?: string;
    resourceType?: string;
    page?: string;
    notice?: string;
    error?: string;
  }>;
};

const PAGE_SIZE = 10;

const STATUS_OPTIONS = ['', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
const STATUS_LABELS: Record<string, string> = {
  '': 'All',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

const STATUS_STYLE: Record<string, string> = {
  PENDING:
    'border-amber-200 bg-amber-50 text-amber-700',
  APPROVED:
    'border-emerald-200 bg-emerald-50 text-emerald-700',
  REJECTED:
    'border-rose-200 bg-rose-50 text-rose-700',
  CANCELLED:
    'border-slate-200 bg-slate-50 text-slate-500',
};

function buildPageHref(
  statusFilter: string,
  resourceTypeFilter: string,
  page: number
) {
  const params = new URLSearchParams();

  if (statusFilter) {
    params.set('status', statusFilter);
  }

  if (resourceTypeFilter) {
    params.set('resourceType', resourceTypeFilter);
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  const query = params.toString();

  return query
    ? `/admin/approval-request?${query}`
    : '/admin/approval-request';
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-SG', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatDate(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

export default async function ApprovalRequestPage({
  searchParams,
}: ApprovalRequestPageProps) {
  const params = await searchParams;
  const statusFilter = (params.status ?? '').trim();
  const resourceTypeFilter = (params.resourceType ?? '').trim();
  const currentPage = Math.max(
    1,
    Number.parseInt(params.page ?? '1', 10) || 1
  );

  const { session } = await requireNavigationItemAccess(
    'admin',
    'approval-request'
  );

  const result = await searchApprovalRequestsPage({
    organizationId: session.organizationId,
    statusFilter,
    resourceTypeFilter,
    page: currentPage,
    pageSize: PAGE_SIZE,
  });

  const { rows: requests, totalCount, page, pageSize } = result;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="grid gap-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[1.05rem] font-semibold tracking-tight text-slate-950">
              Approval Request search
            </h2>
          </div>
        </div>

        <form
          action="/admin/approval-request"
          className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_auto]"
        >
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Status</span>
            <select
              name="status"
              defaultValue={statusFilter}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
            >
              {STATUS_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Resource Type</span>
            <input
              name="resourceType"
              type="text"
              defaultValue={resourceTypeFilter}
              placeholder="e.g. USER_GROUP"
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Summary
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Resource Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Submitted
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {requests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      No approval requests matched the current filters.
                    </td>
                  </tr>
                ) : null}

                {requests.map((request) => (
                  <tr key={request.id} className="align-top">
                    <td className="px-4 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        asChild
                      >
                        <Link
                          href={`/admin/approval-request/${request.id}`}
                        >
                          {request.id}
                        </Link>
                      </Button>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-900">
                        {request.summary}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {request.resourceKey}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {request.resourceType}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {request.actionType}
                    </td>
                    <td className="px-4 py-4">
                      <div
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                          STATUS_STYLE[request.status] ??
                          'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        {request.status}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-slate-700">
                        {formatDate(request.submittedAt)}
                      </p>
                      {request.submittedByDisplayName ? (
                        <p className="mt-1 text-sm text-slate-500">
                          {request.submittedByDisplayName}
                        </p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 px-5 py-5">
          {page > 1 ? (
            <Button variant="outline" className="rounded-2xl" asChild>
              <Link
                href={buildPageHref(
                  statusFilter,
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
                  statusFilter,
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
