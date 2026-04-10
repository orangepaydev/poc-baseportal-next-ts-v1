import Link from 'next/link';
import { Plus, Search } from 'lucide-react';

import {
  SortableQueryTable,
  type SortableQueryTableColumn,
  type SortableQueryTableRow,
} from '@/components/sortable-query-table';
import { Button } from '@/components/ui/button';
import { requireNavigationItemAccess } from '@/lib/auth/authorization';
import {
  buildUserRouteResourceKey,
  listPendingUserRequests,
  searchApprovedUsersPage,
} from '@/lib/users';

type UsersPageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    notice?: string;
    error?: string;
  }>;
};

const PAGE_SIZE = 10;

const USER_TABLE_COLUMNS: readonly SortableQueryTableColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'approvalRequest', label: 'Approval Request' },
];

function buildPageHref(searchQuery: string, page: number) {
  const params = new URLSearchParams();

  if (searchQuery) {
    params.set('q', searchQuery);
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  const query = params.toString();

  return query ? `/admin/users?${query}` : '/admin/users';
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  const searchQuery = (params.q ?? '').trim();
  const currentPage = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);
  const { permissionCodes, session } = await requireNavigationItemAccess(
    'admin',
    'users'
  );
  const canManage = permissionCodes.includes('USER_WRITE');
  const [userSearchResult, pendingRequests] = await Promise.all([
    searchApprovedUsersPage({
      organizationId: session.organizationId,
      displayNameQuery: searchQuery,
      page: currentPage,
      pageSize: PAGE_SIZE,
    }),
    listPendingUserRequests(session.organizationId),
  ]);
  const { rows: users, totalCount, page, pageSize } = userSearchResult;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pendingRequestByResourceKey = new Map(
    pendingRequests.map((request) => [request.resourceKey, request])
  );
  const userRows: SortableQueryTableRow[] = users.map((user) => {
    const resourceKey = buildUserRouteResourceKey(
      session.organizationCode,
      user.username
    );
    const pendingRequest = pendingRequestByResourceKey.get(resourceKey);
    const approvalLabel = pendingRequest
      ? pendingRequest.actionType === 'CREATE'
        ? 'Pending create approval'
        : pendingRequest.actionType === 'UPDATE'
          ? 'Pending edit approval'
          : 'Pending delete approval'
      : 'No approval';

    return {
      id: user.id,
      cells: {
        id: {
          kind: 'link',
          href: `/admin/users/${user.id}`,
          primary: String(user.id),
          sortValue: user.id,
        },
        name: {
          kind: 'text',
          primary: user.displayName,
          secondary: user.username,
          sortValue: user.displayName,
        },
        status: {
          kind: 'badge',
          primary: user.status,
          sortValue: user.status,
        },
        approvalRequest: {
          kind: 'badge',
          primary: approvalLabel,
          sortValue: approvalLabel,
          tone: pendingRequest ? 'warning' : 'success',
        },
      },
    };
  });

  return (
    <div className="grid gap-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[1.05rem] font-semibold tracking-tight text-slate-950">
              User search
            </h2>
          </div>
        </div>

        <form
          action="/admin/users"
          className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto_auto]"
        >
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Display Name</span>
            <input
              name="q"
              type="text"
              defaultValue={searchQuery}
              placeholder="Search by display name"
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
                <Link href="/admin/users/new">
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
          <SortableQueryTable
            columns={USER_TABLE_COLUMNS}
            rows={userRows}
            emptyMessage="No users matched the current query."
          />
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
