import Link from 'next/link';
import { Search } from 'lucide-react';

import {
  SortableQueryTable,
  type SortableQueryTableColumn,
  type SortableQueryTableRow,
} from '@/components/sortable-query-table';
import { Button } from '@/components/ui/button';
import { requireNavigationItemAccess } from '@/lib/auth/authorization';
import {
  buildUserGroupMembershipRouteResourceKey,
  listPendingUserGroupMembershipRequests,
  searchApprovedUserGroupMembershipTargetsPage,
} from '@/lib/user-group-memberships';

type UserGroupMembershipPageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    notice?: string;
    error?: string;
  }>;
};

const PAGE_SIZE = 10;

const USER_GROUP_MEMBERSHIP_TABLE_COLUMNS: readonly SortableQueryTableColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'members', label: 'Members', align: 'right' },
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

  return query
    ? `/admin/user-group-membership?${query}`
    : '/admin/user-group-membership';
}

export default async function UserGroupMembershipPage({
  searchParams,
}: UserGroupMembershipPageProps) {
  const params = await searchParams;
  const searchQuery = (params.q ?? '').trim();
  const currentPage = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);
  const { session } = await requireNavigationItemAccess(
    'admin',
    'user-group-membership'
  );
  const [groupSearchResult, pendingRequests] = await Promise.all([
    searchApprovedUserGroupMembershipTargetsPage({
      organizationId: session.organizationId,
      groupNameQuery: searchQuery,
      page: currentPage,
      pageSize: PAGE_SIZE,
    }),
    listPendingUserGroupMembershipRequests(session.organizationId),
  ]);
  const { rows: groups, totalCount, page, pageSize } = groupSearchResult;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pendingRequestByResourceKey = new Map(
    pendingRequests.map((request) => [request.resourceKey, request])
  );
  const groupRows: SortableQueryTableRow[] = groups.map((group) => {
    const resourceKey = buildUserGroupMembershipRouteResourceKey(
      session.organizationCode,
      group.groupCode
    );
    const pendingRequest = pendingRequestByResourceKey.get(resourceKey);

    return {
      id: group.id,
      cells: {
        id: {
          kind: 'link',
          href: `/admin/user-group-membership/${group.id}`,
          primary: String(group.id),
          sortValue: group.id,
        },
        name: {
          kind: 'text',
          primary: group.groupName,
          secondary: group.groupCode,
          sortValue: group.groupName,
        },
        members: {
          kind: 'text',
          primary: String(group.memberCount),
          sortValue: group.memberCount,
          align: 'right',
        },
        approvalRequest: {
          kind: 'badge',
          primary: pendingRequest
            ? 'Pending membership update approval'
            : 'No approval',
          sortValue: pendingRequest ? 1 : 0,
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
              User Group Membership search
            </h2>
          </div>
        </div>

        <form
          action="/admin/user-group-membership"
          className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]"
        >
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>User Group Name</span>
            <input
              name="q"
              type="text"
              defaultValue={searchQuery}
              placeholder="Search by user group name"
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
            columns={USER_GROUP_MEMBERSHIP_TABLE_COLUMNS}
            rows={groupRows}
            emptyMessage="No user groups matched the current query."
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