import Link from 'next/link';
import { ArrowLeft, FilePenLine, ShieldCheck } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { requireNavigationItemAccess } from '@/lib/auth/authorization';
import {
  buildUserGroupRouteResourceKey,
  getApprovedUserGroupById,
  listPendingUserGroupRequests,
} from '@/lib/user-groups';

import { DeleteUserGroupRequestButton } from './delete-user-group-request-button';

type UserGroupDetailPageProps = {
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

export default async function UserGroupDetailPage({
  params,
  searchParams,
}: UserGroupDetailPageProps) {
  const [{ groupId }, queryParams] = await Promise.all([params, searchParams]);
  const { permissionCodes, session } = await requireNavigationItemAccess(
    'admin',
    'user-group'
  );
  const resolvedGroupId = Number(groupId);
  const group = await getApprovedUserGroupById(
    session.organizationId,
    resolvedGroupId
  );

  if (!group) {
    notFound();
  }

  const pendingRequests = await listPendingUserGroupRequests(
    session.organizationId
  );
  const resourceKey = buildUserGroupRouteResourceKey(
    session.organizationCode,
    group.groupCode
  );
  const pendingRequest = pendingRequests.find(
    (request) => request.resourceKey === resourceKey
  );
  const canManage = permissionCodes.includes('USER_GROUP_WRITE');
  const canApprove = permissionCodes.includes('USER_GROUP_APPROVE');
  const canOpenApproveRequest =
    Boolean(pendingRequest) && (canManage || canApprove);
  const canEditOrDelete =
    !pendingRequest && group.status === 'ACTIVE' && canManage;
  const detailPath = `/admin/user-group/${group.id}`;

  return (
    <div className="grid gap-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase">
              User Group Detail
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
            <Button variant="outline" className="rounded-2xl" asChild>
              <Link href="/admin/user-group">
                <ArrowLeft className="size-4" />
                Back
              </Link>
            </Button>

            {canOpenApproveRequest ? (
              <Button
                className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
                asChild
              >
                <Link href={`${detailPath}/approve-request`}>
                  <ShieldCheck className="size-4" />
                  Approve Request
                </Link>
              </Button>
            ) : null}

            {canEditOrDelete ? (
              <>
                <Button variant="outline" className="rounded-2xl" asChild>
                  <Link href={`${detailPath}/edit`}>
                    <FilePenLine className="size-4" />
                    Edit
                  </Link>
                </Button>
                <DeleteUserGroupRequestButton
                  groupId={group.id}
                  groupName={group.groupName}
                  redirectTo={detailPath}
                />
              </>
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
                {group.id}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Group Code
              </td>
              <td className="py-3 font-semibold text-slate-950">
                {group.groupCode}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Record Status
              </td>
              <td className="py-3 pr-8 font-semibold text-slate-950">
                {group.status}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Approval Request
              </td>
              <td className="py-3 font-semibold text-slate-950">
                {pendingRequest
                  ? pendingRequest.actionType === 'CREATE'
                    ? 'Pending create approval'
                    : pendingRequest.actionType === 'UPDATE'
                      ? 'Pending edit approval'
                      : 'Pending delete approval'
                  : 'No approval'}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Members
              </td>
              <td className="py-3 pr-8 font-semibold text-slate-950">
                {group.memberCount}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Permissions
              </td>
              <td className="py-3 font-semibold text-slate-950">
                {group.permissionCount}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Updated
              </td>
              <td className="py-3 pr-8 font-semibold text-slate-950">
                {formatDate(group.updatedAt)}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Description
              </td>
              <td className="py-3 leading-6 text-slate-600">
                {group.description || 'No description provided.'}
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
    </div>
  );
}
