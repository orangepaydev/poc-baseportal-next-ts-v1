import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { requireNavigationItemAccess } from '@/lib/auth/authorization';
import {
  buildUserGroupRouteResourceKey,
  getApprovedUserGroupById,
  listPendingUserGroupRequests,
} from '@/lib/user-groups';

type ApproveUserGroupRequestPageProps = {
  params: Promise<{
    groupId: string;
  }>;
};

export default async function ApproveUserGroupRequestPage({
  params,
}: ApproveUserGroupRequestPageProps) {
  const { groupId } = await params;
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
  const canOpenPlaceholder =
    permissionCodes.includes('USER_GROUP_WRITE') ||
    permissionCodes.includes('USER_GROUP_APPROVE');

  if (!pendingRequest || !canOpenPlaceholder) {
    notFound();
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase">
              Approve Request
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Approval page placeholder
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              This page is reserved for the future approval experience. The
              pending request for {group.groupName} is ready to be wired here.
            </p>
          </div>

          <Button variant="outline" className="rounded-2xl" asChild>
            <Link href={`/admin/user-group/${group.id}`}>
              <ArrowLeft className="size-4" />
              Back to detail
            </Link>
          </Button>
        </div>

        <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center gap-2 text-slate-900">
            <ShieldCheck className="size-4" />
            <p className="font-medium">Pending request found</p>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            {pendingRequest.summary}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Submitted by {pendingRequest.submittedByDisplayName ?? 'Unknown'}.
          </p>
        </div>
      </section>
    </div>
  );
}
