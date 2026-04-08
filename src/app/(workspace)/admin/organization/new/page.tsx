import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { requireNavigationItemAccess } from '@/lib/auth/authorization';

import { createOrganizationRequestAction } from '../actions';

type NewOrganizationPageProps = {
  searchParams: Promise<{
    notice?: string;
    error?: string;
  }>;
};

export default async function NewOrganizationPage({
  searchParams,
}: NewOrganizationPageProps) {
  const params = await searchParams;
  const { permissionCodes } = await requireNavigationItemAccess(
    'admin',
    'organization'
  );

  if (!permissionCodes.includes('ORGANIZATION_WRITE')) {
    notFound();
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase">
              Add Organization
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center justify-end gap-3 md:w-auto">
            <Button variant="outline" className="rounded-2xl" asChild>
              <Link href="/admin/organization">
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

        <form
          action={createOrganizationRequestAction}
          className="mt-6 grid gap-4"
        >
          <input
            name="redirectTo"
            type="hidden"
            value="/admin/organization/new"
          />

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Organization Code</span>
            <input
              name="organizationCode"
              type="text"
              placeholder="acme-corp"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Organization Name</span>
            <input
              name="organizationName"
              type="text"
              placeholder="Acme Corporation"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
            />
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
