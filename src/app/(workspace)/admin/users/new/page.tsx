import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { requireNavigationItemAccess } from '@/lib/auth/authorization';

import { createUserRequestAction } from '../actions';

type NewUserPageProps = {
  searchParams: Promise<{
    notice?: string;
    error?: string;
  }>;
};

export default async function NewUserPage({
  searchParams,
}: NewUserPageProps) {
  const params = await searchParams;
  const { permissionCodes } = await requireNavigationItemAccess(
    'admin',
    'users'
  );

  if (!permissionCodes.includes('USER_WRITE')) {
    notFound();
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase">
              Add User
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center justify-end gap-3 md:w-auto">
            <Button variant="outline" className="rounded-2xl" asChild>
              <Link href="/admin/users">
                <ArrowLeft className="size-4" />
                Back to search
              </Link>
            </Button>
          </div>
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

        <form action={createUserRequestAction} className="mt-6 grid gap-4">
          <input
            name="redirectTo"
            type="hidden"
            value="/admin/users/new"
          />

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Username</span>
            <input
              name="username"
              type="text"
              placeholder="jdoe"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Display Name</span>
            <input
              name="displayName"
              type="text"
              placeholder="Jane Doe"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Email</span>
            <input
              name="email"
              type="email"
              placeholder="jane@example.com"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Password</span>
            <input
              name="password"
              type="password"
              placeholder="Enter password"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>User Type</span>
            <select
              name="userType"
              defaultValue="NORMAL"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="NORMAL">NORMAL</option>
            </select>
          </label>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
            >
              <Plus className="size-4" />
              Submit create request
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
