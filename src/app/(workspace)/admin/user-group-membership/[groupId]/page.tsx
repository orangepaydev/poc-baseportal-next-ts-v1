import Link from 'next/link';
import { ArrowLeft, FilePenLine, ShieldCheck } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { requireNavigationItemAccess } from '@/lib/auth/authorization';
import {
  buildUserGroupMembershipRouteResourceKey,
  getApprovedUserGroupMembershipDetailById,
  listPendingUserGroupMembershipRequests,
} from '@/lib/user-group-memberships';

type UserGroupMembershipDetailPageProps = {
  params: Promise<{
    groupId: string;
  }>;
  searchParams: Promise<{
    notice?: string;
    error?: string;
  }>;
};

const dateTimeFormatter = new Intl.DateTimeFormat('en-SG', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatDate(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

export default async function UserGroupMembershipDetailPage({
  params,
  searchParams,
}: UserGroupMembershipDetailPageProps) {
  const [{ groupId }, queryParams] = await Promise.all([params, searchParams]);
  const { permissionCodes, session } = await requireNavigationItemAccess(
    'admin',
    'user-group-membership'
  );
  const resolvedGroupId = Number(groupId);
  const detail = await getApprovedUserGroupMembershipDetailById(
    session.organizationId,
    resolvedGroupId
  );

  if (!detail) {
    notFound();
  }

  const pendingRequests = await listPendingUserGroupMembershipRequests(
    session.organizationId
  );
  const resourceKey = buildUserGroupMembershipRouteResourceKey(
    session.organizationCode,
    detail.group.groupCode
  );
  const pendingRequest = pendingRequests.find(
    (request) => request.resourceKey === resourceKey
  );
  const canManage = permissionCodes.includes('GROUP_MEMBERSHIP_WRITE');
  const canApprove = permissionCodes.includes('GROUP_MEMBERSHIP_APPROVE');
  const canOpenApproveRequest =
    Boolean(pendingRequest) && (canManage || canApprove);
  const canEdit = !pendingRequest && detail.group.status === 'ACTIVE' && canManage;
  const detailPath = `/admin/user-group-membership/${detail.group.id}`;

  return (
    <div className="grid gap-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase">
              User Group Membership Detail
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
            <Button variant="outline" className="rounded-2xl" asChild>
              <Link href="/admin/user-group-membership">
                <ArrowLeft className="size-4" />
                Back
              </Link>
            </Button>

            {canOpenApproveRequest ? (
              <Button
                className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
                asChild
              >
                <Link href={`/admin/approval-request/${pendingRequest!.id}`}>
                  <ShieldCheck className="size-4" />
                  Approve Request
                </Link>
              </Button>
            ) : null}

            {canEdit ? (
              <Button variant="outline" className="rounded-2xl" asChild>
                <Link href={`${detailPath}/edit`}>
                  <FilePenLine className="size-4" />
                  Edit
                </Link>
              </Button>
            ) : null}
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
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Internal ID
              </td>
              <td className="py-3 pr-8 font-semibold text-slate-950">
                {detail.group.id}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Group Code
              </td>
              <td className="py-3 font-semibold text-slate-950">
                {detail.group.groupCode}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Record Status
              </td>
              <td className="py-3 pr-8 font-semibold text-slate-950">
                {detail.group.status}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Approval Request
              </td>
              <td className="py-3 font-semibold text-slate-950">
                {pendingRequest
                  ? 'Pending membership update approval'
                  : 'No approval'}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Members
              </td>
              <td className="py-3 pr-8 font-semibold text-slate-950">
                {detail.members.length}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Permissions
              </td>
              <td className="py-3 font-semibold text-slate-950">
                {detail.group.permissionCount}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Updated
              </td>
              <td className="py-3 pr-8 font-semibold text-slate-950">
                {formatDate(detail.group.updatedAt)}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Description
              </td>
              <td className="py-3 leading-6 text-slate-600">
                {detail.group.description || 'No description provided.'}
              </td>
            </tr>
            {pendingRequest ? (
              <tr>
                <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                  Pending Request
                </td>
                <td colSpan={3} className="py-3 font-semibold text-amber-700">
                  {pendingRequest.summary}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-[1.05rem] font-semibold tracking-tight text-slate-950">
              Assigned Members
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Current live user memberships for this user group.
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    User Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Display Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Email
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {detail.members.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      No users are assigned to this user group.
                    </td>
                  </tr>
                ) : null}

                {detail.members.map((member) => (
                  <tr key={member.userId}>
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">
                      {member.username}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {member.displayName}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {member.email ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}