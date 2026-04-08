import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { requireNavigationItemAccess } from '@/lib/auth/authorization';

import { createUserGroupRequestAction } from '../actions';

type NewUserGroupPageProps = {
  searchParams: Promise<{
    notice?: string;
    error?: string;
  }>;
};

export default async function NewUserGroupPage({
  searchParams,
}: NewUserGroupPageProps) {
  const params = await searchParams;
  const { permissionCodes } = await requireNavigationItemAccess(
    'admin',
    'user-group'
  );

  if (!permissionCodes.includes('USER_GROUP_WRITE')) {
    notFound();
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase">
              Add User Group
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Create a new user group request
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              This form creates a maker request. The user group is only added to
              the live table after approval.
            </p>
          </div>

          <Button variant="outline" className="rounded-2xl" asChild>
            <Link href="/admin/user-group">
              <ArrowLeft className="size-4" />
              Back to search
            </Link>
          </Button>
        </div>

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

        <form
          action={createUserGroupRequestAction}
          className="mt-6 grid gap-4 lg:grid-cols-2"
        >
          <input
            name="redirectTo"
            type="hidden"
            value="/admin/user-group/new"
          />

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Group Code</span>
            <input
              name="groupCode"
              type="text"
              placeholder="UserGroupMaker"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Group Name</span>
            <input
              name="groupName"
              type="text"
              placeholder="User Group Maker"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Status</span>
            <select
              name="status"
              defaultValue="ACTIVE"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </label>

          <div className="flex items-end">
            <Button
              type="submit"
              className="w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-800 lg:w-auto"
            >
              <Plus className="size-4" />
              Submit request
            </Button>
          </div>

          <label className="space-y-2 text-sm font-medium text-slate-700 lg:col-span-2">
            <span>Description</span>
            <textarea
              name="description"
              rows={4}
              placeholder="Describe what this user group is for."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
            />
          </label>
        </form>
      </section>
    </div>
  );
}
