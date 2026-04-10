import Link from 'next/link';
import { ArrowLeft, FilePenLine, ShieldCheck } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { requireNavigationItemAccess } from '@/lib/auth/authorization';
import {
  buildUserRouteResourceKey,
  getApprovedUserById,
  listPendingUserRequests,
} from '@/lib/users';

import { DeleteUserRequestButton } from './delete-user-request-button';
import { ResetUserPasswordRequestButton } from './reset-user-password-request-button';

type UserDetailPageProps = {
  params: Promise<{
    userId: string;
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

export default async function UserDetailPage({
  params,
  searchParams,
}: UserDetailPageProps) {
  const [{ userId }, queryParams] = await Promise.all([params, searchParams]);
  const { permissionCodes, session } = await requireNavigationItemAccess(
    'admin',
    'users'
  );
  const resolvedUserId = Number(userId);
  const user = await getApprovedUserById(
    session.organizationId,
    resolvedUserId
  );

  if (!user) {
    notFound();
  }

  const pendingRequests = await listPendingUserRequests(
    session.organizationId
  );
  const resourceKey = buildUserRouteResourceKey(
    session.organizationCode,
    user.username
  );
  const pendingRequest = pendingRequests.find(
    (request) => request.resourceKey === resourceKey
  );
  const canManage = permissionCodes.includes('USER_WRITE');
  const canApprove = permissionCodes.includes('USER_APPROVE');
  const canOpenApproveRequest =
    Boolean(pendingRequest) && (canManage || canApprove);
  const canEditOrDelete =
    !pendingRequest && user.status === 'ACTIVE' && canManage;
  const canResetPassword =
    !pendingRequest &&
    user.status === 'ACTIVE' &&
    canManage &&
    Boolean(user.email);
  const detailPath = `/admin/users/${user.id}`;

  return (
    <div className="grid gap-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase">
              User Detail
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
            <Button variant="outline" className="rounded-2xl" asChild>
              <Link href="/admin/users">
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

            {canEditOrDelete ? (
              <>
                <Button variant="outline" className="rounded-2xl" asChild>
                  <Link href={`${detailPath}/edit`}>
                    <FilePenLine className="size-4" />
                    Edit
                  </Link>
                </Button>
                <DeleteUserRequestButton
                  userId={user.id}
                  displayName={user.displayName}
                  redirectTo={detailPath}
                />
              </>
            ) : null}

            {canResetPassword ? (
              <ResetUserPasswordRequestButton
                userId={user.id}
                displayName={user.displayName}
                email={user.email!}
                redirectTo={detailPath}
              />
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
                {user.id}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Username
              </td>
              <td className="py-3 font-semibold text-slate-950">
                {user.username}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Display Name
              </td>
              <td className="py-3 pr-8 font-semibold text-slate-950">
                {user.displayName}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Email
              </td>
              <td className="py-3 font-semibold text-slate-950">
                {user.email || 'No email provided.'}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                User Type
              </td>
              <td className="py-3 pr-8 font-semibold text-slate-950">
                {user.userType}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Record Status
              </td>
              <td className="py-3 font-semibold text-slate-950">
                {user.status}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Last Login
              </td>
              <td className="py-3 pr-8 font-semibold text-slate-950">
                {user.lastLoginAt
                  ? formatDate(user.lastLoginAt)
                  : 'Never'}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Updated
              </td>
              <td className="py-3 font-semibold text-slate-950">
                {formatDate(user.updatedAt)}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Approval Request
              </td>
              <td colSpan={3} className="py-3 font-semibold text-slate-950">
                {pendingRequest
                  ? pendingRequest.actionType === 'CREATE'
                    ? 'Pending create approval'
                    : pendingRequest.summary.startsWith('Reset password')
                      ? 'Pending password reset approval'
                      : pendingRequest.actionType === 'UPDATE'
                      ? 'Pending edit approval'
                      : 'Pending delete approval'
                  : 'No approval'}
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
