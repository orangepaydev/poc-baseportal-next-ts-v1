import Link from 'next/link';
import { ArrowLeft, FilePenLine } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { requireNavigationItemAccess } from '@/lib/auth/authorization';
import {
  buildUserGroupMembershipRouteResourceKey,
  getApprovedUserGroupMembershipDetailById,
  listAvailableUsersForUserGroup,
  listPendingUserGroupMembershipRequests,
} from '@/lib/user-group-memberships';

import { updateUserGroupMembershipRequestAction } from '../../actions';
import { UserGroupMembershipEditor } from '../user-group-membership-editor';

type EditUserGroupMembershipPageProps = {
  params: Promise<{
    groupId: string;
  }>;
  searchParams: Promise<{
    notice?: string;
    error?: string;
  }>;
};

export default async function EditUserGroupMembershipPage({
  params,
  searchParams,
}: EditUserGroupMembershipPageProps) {
  const [{ groupId }, queryParams] = await Promise.all([params, searchParams]);
  const { permissionCodes, session } = await requireNavigationItemAccess(
    'admin',
    'user-group-membership'
  );

  if (!permissionCodes.includes('GROUP_MEMBERSHIP_WRITE')) {
    notFound();
  }

  const resolvedGroupId = Number(groupId);
  const detail = await getApprovedUserGroupMembershipDetailById(
    session.organizationId,
    resolvedGroupId
  );

  if (!detail) {
    notFound();
  }

  const [pendingRequests, availableUsers] = await Promise.all([
    listPendingUserGroupMembershipRequests(session.organizationId),
    listAvailableUsersForUserGroup(session.organizationId, detail.group.id),
  ]);
  const resourceKey = buildUserGroupMembershipRouteResourceKey(
    session.organizationCode,
    detail.group.groupCode
  );
  const pendingRequest = pendingRequests.find(
    (request) => request.resourceKey === resourceKey
  );
  const detailPath = `/admin/user-group-membership/${detail.group.id}`;

  return (
    <div className="grid gap-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase">
              Edit User Group Membership
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center justify-end gap-3 md:w-auto">
            <Button variant="outline" className="rounded-2xl" asChild>
              <Link href={detailPath}>
                <ArrowLeft className="size-4" />
                Back to detail
              </Link>
            </Button>
          </div>
        </div>

        {queryParams.notice ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {queryParams.notice}
          </div>
        ) : null}

        {queryParams.error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {queryParams.error}
          </div>
        ) : null}

        {pendingRequest ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
            Editing is unavailable because a pending request already exists for
            this user group membership set.
          </div>
        ) : (
          <form
            action={updateUserGroupMembershipRequestAction}
            className="mt-6 grid gap-6"
          >
            <input name="groupId" type="hidden" value={detail.group.id} />
            <input name="redirectTo" type="hidden" value={detailPath} />

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>User Group</span>
                <input
                  type="text"
                  value={`${detail.group.groupName} (${detail.group.groupCode})`}
                  readOnly
                  className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 font-normal text-slate-600 outline-none"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Status</span>
                <input
                  type="text"
                  value={detail.group.status}
                  readOnly
                  className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 font-normal text-slate-600 outline-none"
                />
              </label>
            </div>

            <UserGroupMembershipEditor
              existingMembers={detail.members}
              availableUsers={availableUsers}
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
              >
                <FilePenLine className="size-4" />
                Submit edit request
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}