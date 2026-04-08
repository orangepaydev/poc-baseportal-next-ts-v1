import Link from 'next/link';
import { ArrowLeft, FilePenLine } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { requireNavigationItemAccess } from '@/lib/auth/authorization';
import {
  buildUserRouteResourceKey,
  getApprovedUserById,
  listPendingUserRequests,
} from '@/lib/users';

import { updateUserRequestAction } from '../../actions';

type EditUserPageProps = {
  params: Promise<{
    userId: string;
  }>;
  searchParams: Promise<{
    notice?: string;
    error?: string;
  }>;
};

export default async function EditUserPage({
  params,
  searchParams,
}: EditUserPageProps) {
  const [{ userId }, queryParams] = await Promise.all([params, searchParams]);
  const { permissionCodes, session } = await requireNavigationItemAccess(
    'admin',
    'users'
  );

  if (!permissionCodes.includes('USER_WRITE')) {
    notFound();
  }

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
  const detailPath = `/admin/users/${user.id}`;

  return (
    <div className="grid gap-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase">
              Edit User
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
            this user.
          </div>
        ) : (
          <form
            action={updateUserRequestAction}
            className="mt-6 grid gap-4"
          >
            <input name="userId" type="hidden" value={user.id} />
            <input name="redirectTo" type="hidden" value={detailPath} />

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Display Name</span>
              <input
                name="displayName"
                type="text"
                defaultValue={user.displayName}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Email</span>
              <input
                name="email"
                type="email"
                defaultValue={user.email ?? ''}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>User Type</span>
              <select
                name="userType"
                defaultValue={user.userType}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="NORMAL">NORMAL</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Status</span>
              <select
                name="status"
                defaultValue={user.status}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="LOCKED">LOCKED</option>
                <option value="DISABLED">DISABLED</option>
              </select>
            </label>

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
