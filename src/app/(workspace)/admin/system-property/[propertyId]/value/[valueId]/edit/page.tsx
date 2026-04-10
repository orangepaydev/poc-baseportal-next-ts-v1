import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { requireNavigationItemAccess } from '@/lib/auth/authorization';
import {
  buildSystemPropertyValueRouteResourceKey,
  getApprovedSystemPropertyById,
  getApprovedSystemPropertyValueById,
  listPendingSystemPropertyRequests,
} from '@/lib/system-properties';

import { updateSystemPropertyValueRequestAction } from '../../../../actions';
import { DeleteSystemPropertyValueRequestButton } from '../delete-system-property-value-request-button';

type EditSystemPropertyValuePageProps = {
  params: Promise<{
    propertyId: string;
    valueId: string;
  }>;
  searchParams: Promise<{
    notice?: string;
    error?: string;
  }>;
};

export default async function EditSystemPropertyValuePage({
  params,
  searchParams,
}: EditSystemPropertyValuePageProps) {
  const [{ propertyId, valueId }, queryParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const { permissionCodes } = await requireNavigationItemAccess(
    'system',
    'system-property'
  );

  if (!permissionCodes.includes('SYSTEM_PROPERTY_WRITE')) {
    notFound();
  }

  const resolvedPropertyId = Number(propertyId);
  const resolvedValueId = Number(valueId);
  const [systemProperty, systemPropertyValue] = await Promise.all([
    getApprovedSystemPropertyById(resolvedPropertyId),
    getApprovedSystemPropertyValueById(resolvedPropertyId, resolvedValueId),
  ]);

  if (!systemProperty || !systemPropertyValue) {
    notFound();
  }

  const pendingRequests = await listPendingSystemPropertyRequests();
  const resourceKey = buildSystemPropertyValueRouteResourceKey(
    systemProperty.propertyCode,
    systemPropertyValue.id
  );
  const pendingRequest = pendingRequests.find(
    (request) => request.resourceKey === resourceKey
  );
  const canManage = permissionCodes.includes('SYSTEM_PROPERTY_WRITE');
  const canApprove = permissionCodes.includes('SYSTEM_PROPERTY_APPROVE');
  const canOpenApproveRequest =
    Boolean(pendingRequest) && (canManage || canApprove);
  const canEditOrDelete = !pendingRequest && canManage;
  const detailPath = `/admin/system-property/${systemProperty.id}`;
  const editPath = `${detailPath}/value/${systemPropertyValue.id}/edit`;

  return (
    <div className="grid gap-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase">
              Edit System Property Value
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
            <Button variant="outline" className="rounded-2xl" asChild>
              <Link href={detailPath}>
                <ArrowLeft className="size-4" />
                Back to detail
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
              <DeleteSystemPropertyValueRequestButton
                systemPropertyId={systemProperty.id}
                valueId={systemPropertyValue.id}
                valueCode={systemPropertyValue.propertyItemCode}
                redirectTo={editPath}
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

        {pendingRequest ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
            Editing is unavailable because a pending request already exists for this System Property Value.
          </div>
        ) : (
          <form action={updateSystemPropertyValueRequestAction} className="mt-6 grid gap-4">
            <input name="systemPropertyId" type="hidden" value={systemProperty.id} />
            <input name="valueId" type="hidden" value={systemPropertyValue.id} />
            <input name="redirectTo" type="hidden" value={editPath} />

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
                defaultValue={systemPropertyValue.propertyItemCode}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>System Property Value</span>
              <input
                name="propertyValue"
                type="text"
                defaultValue={systemPropertyValue.propertyValue}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Description</span>
              <input
                name="description"
                type="text"
                defaultValue={systemPropertyValue.description}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
              />
            </label>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
              >
                Edit
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}