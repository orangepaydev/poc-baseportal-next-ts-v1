import Link from 'next/link';
import { Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { requireNavigationItemAccess } from '@/lib/auth/authorization';
import {
  buildSystemCodeRouteResourceKey,
  listPendingSystemCodeRequests,
  searchApprovedSystemCodesPage,
} from '@/lib/system-codes';

type SystemCodePageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    notice?: string;
    error?: string;
  }>;
};

const PAGE_SIZE = 10;

function buildPageHref(searchQuery: string, page: number) {
  const params = new URLSearchParams();

  if (searchQuery) {
    params.set('q', searchQuery);
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  const query = params.toString();

  return query ? `/admin/system-code?${query}` : '/admin/system-code';
}

export default async function SystemCodePage({
  searchParams,
}: SystemCodePageProps) {
  const params = await searchParams;
  const searchQuery = (params.q ?? '').trim();
  const currentPage = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);
  const { permissionCodes } = await requireNavigationItemAccess(
    'system',
    'system-code'
  );
  const canManage = permissionCodes.includes('SYSTEM_CODE_WRITE');
  const [systemCodeSearchResult, pendingRequests] = await Promise.all([
    searchApprovedSystemCodesPage({
      systemCodeQuery: searchQuery,
      page: currentPage,
      pageSize: PAGE_SIZE,
    }),
    listPendingSystemCodeRequests(),
  ]);
  const { rows: systemCodes, totalCount, page, pageSize } = systemCodeSearchResult;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pendingRequestByResourceKey = new Map(
    pendingRequests.map((request) => [request.resourceKey, request])
  );

  return (
    <div className="grid gap-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[1.05rem] font-semibold tracking-tight text-slate-950">
              System Code search
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Manage global lookup codes. System Code Values are maintained from the detail edit flow.
            </p>
          </div>
        </div>

        <form
          action="/admin/system-code"
          className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto_auto]"
        >
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>System Code / Description</span>
            <input
              name="q"
              type="text"
              defaultValue={searchQuery}
              placeholder="Search by code or description"
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

          <div className="flex items-end">
            {canManage ? (
              <Button
                variant="outline"
                className="w-full rounded-2xl lg:w-auto"
                asChild
              >
                <Link href="/admin/system-code/new">
                  <Plus className="size-4" />
                  Add
                </Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full rounded-2xl lg:w-auto"
                disabled
              >
                <Plus className="size-4" />
                Add
              </Button>
            )}
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
                    System Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Values
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Approval Request
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {systemCodes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      No System Codes matched the current query.
                    </td>
                  </tr>
                ) : null}

                {systemCodes.map((systemCode) => {
                  const pendingRequest = pendingRequestByResourceKey.get(
                    buildSystemCodeRouteResourceKey(systemCode.systemCode)
                  );

                  return (
                    <tr key={systemCode.id} className="align-top">
                      <td className="px-4 py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          asChild
                        >
                          <Link href={`/admin/system-code/${systemCode.id}`}>
                            {systemCode.id}
                          </Link>
                        </Button>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {systemCode.systemCode}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {systemCode.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                          {systemCode.status}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {systemCode.valueCount}
                      </td>
                      <td className="px-4 py-4">
                        {pendingRequest ? (
                          <div className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                            {pendingRequest.actionType === 'CREATE'
                              ? 'Pending create approval'
                              : 'Pending edit approval'}
                          </div>
                        ) : (
                          <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            No approval
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 px-5 py-5">
          {page > 1 ? (
            <Button variant="outline" className="rounded-2xl" asChild>
              <Link href={buildPageHref(searchQuery, page - 1)}>Previous</Link>
            </Button>
          ) : (
            <Button variant="outline" className="rounded-2xl" disabled>
              Previous
            </Button>
          )}

          {page < totalPages ? (
            <Button variant="outline" className="rounded-2xl" asChild>
              <Link href={buildPageHref(searchQuery, page + 1)}>Next</Link>
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