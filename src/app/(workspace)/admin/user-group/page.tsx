import Link from 'next/link';
import { Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { requireNavigationItemAccess } from '@/lib/auth/authorization';
import {
  buildUserGroupRouteResourceKey,
  listPendingUserGroupRequests,
  searchApprovedUserGroups,
} from '@/lib/user-groups';

type UserGroupPageProps = {
  searchParams: Promise<{
    q?: string;
    notice?: string;
    error?: string;
  }>;
};

export default async function UserGroupPage({
  searchParams,
}: UserGroupPageProps) {
  const params = await searchParams;
  const searchQuery = (params.q ?? '').trim();
  const { permissionCodes, session } = await requireNavigationItemAccess(
    'admin',
    'user-group'
  );
  const canManage = permissionCodes.includes('USER_GROUP_WRITE');
  const [groups, pendingRequests] = await Promise.all([
    searchApprovedUserGroups(session.organizationId, searchQuery),
    listPendingUserGroupRequests(session.organizationId),
  ]);
  const pendingRequestByResourceKey = new Map(
    pendingRequests.map((request) => [request.resourceKey, request])
  );

  return (
    <div className="grid gap-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase">
              Query Panel
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              User Group search
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              Search user groups in {session.organizationCode} by wildcard name
              match. The query result panel below shows the internal ID, group
              name, and whether a pending approval request already exists for
              each record.
            </p>
          </div>

          <div className="rounded-2xl bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
            {groups.length} result{groups.length === 1 ? '' : 's'}
          </div>
        </div>

        <form
          action="/admin/user-group"
          className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto_auto]"
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

          <div className="flex items-end">
            {canManage ? (
              <Button
                variant="outline"
                className="w-full rounded-2xl lg:w-auto"
                asChild
              >
                <Link href="/admin/user-group/new">
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

      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-slate-500 uppercase">
              Query Result Panel
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">
              User Group results
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Click the internal ID to open the detail page for a user group.
            </p>
          </div>
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
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {groups.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      No user groups matched the current query.
                    </td>
                  </tr>
                ) : null}

                {groups.map((group) => {
                  const resourceKey = buildUserGroupRouteResourceKey(
                    session.organizationCode,
                    group.groupCode
                  );
                  const pendingRequest =
                    pendingRequestByResourceKey.get(resourceKey);

                  return (
                    <tr key={group.id} className="align-top">
                      <td className="px-4 py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          asChild
                        >
                          <Link href={`/admin/user-group/${group.id}`}>
                            {group.id}
                          </Link>
                        </Button>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {group.groupName}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {group.groupCode}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {pendingRequest ? (
                          <div className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                            Pending request
                          </div>
                        ) : (
                          <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            No pending request
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
      </section>
    </div>
  );
}
