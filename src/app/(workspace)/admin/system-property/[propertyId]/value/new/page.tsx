import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { requireNavigationItemAccess } from '@/lib/auth/authorization';
import { getApprovedSystemPropertyById } from '@/lib/system-properties';

import { createSystemPropertyValueRequestAction } from '../../../actions';

type NewSystemPropertyValuePageProps = {
  params: Promise<{
    propertyId: string;
  }>;
  searchParams: Promise<{
    notice?: string;
    error?: string;
  }>;
};

export default async function NewSystemPropertyValuePage({
  params,
  searchParams,
}: NewSystemPropertyValuePageProps) {
  const [{ propertyId }, queryParams] = await Promise.all([params, searchParams]);
  const { permissionCodes } = await requireNavigationItemAccess(
    'system',
    'system-property'
  );

  if (!permissionCodes.includes('SYSTEM_PROPERTY_WRITE')) {
    notFound();
  }

  const resolvedPropertyId = Number(propertyId);
  const systemProperty = await getApprovedSystemPropertyById(resolvedPropertyId);

  if (!systemProperty) {
    notFound();
  }

  const detailPath = `/admin/system-property/${systemProperty.id}`;

  return (
    <div className="grid gap-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase">
              Add System Property Value
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

        <form action={createSystemPropertyValueRequestAction} className="mt-6 grid gap-4">
          <input name="systemPropertyId" type="hidden" value={systemProperty.id} />
          <input name="redirectTo" type="hidden" value={detailPath} />

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>System Property</span>
            <input
              type="text"
              value={systemProperty.propertyCode}
              readOnly
              className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 font-normal text-slate-600 outline-none"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>System Property Value Code</span>
            <input
              name="propertyItemCode"
              type="text"
              placeholder="SecurityEnforcement"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>System Property Value</span>
            <input
              name="propertyValue"
              type="text"
              placeholder="strict"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Description</span>
            <input
              name="description"
              type="text"
              placeholder="Enforce the security"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
            />
          </label>

          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 px-4 py-3 text-sm text-cyan-900">
            This request is submitted for approval first. The System Property Value will appear in the live list only after approval.
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
            >
              <Plus className="size-4" />
              Submit request
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}