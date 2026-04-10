import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { requireNavigationItemAccess } from '@/lib/auth/authorization';
import {
  buildSystemPropertyValueRouteResourceKey,
  getApprovedSystemPropertyById,
  listPendingSystemPropertyRequests,
} from '@/lib/system-properties';

type SystemPropertyDetailPageProps = {
  params: Promise<{
    propertyId: string;
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

export default async function SystemPropertyDetailPage({
  params,
  searchParams,
}: SystemPropertyDetailPageProps) {
  const [{ propertyId }, queryParams] = await Promise.all([params, searchParams]);
  const { permissionCodes } = await requireNavigationItemAccess(
    'admin',
    'system-property'
  );
  const resolvedPropertyId = Number(propertyId);
  const systemProperty = await getApprovedSystemPropertyById(resolvedPropertyId);

  if (!systemProperty) {
    notFound();
  }

  const pendingRequests = await listPendingSystemPropertyRequests();
  const pendingRequestByValueKey = new Map(
    pendingRequests.map((request) => [request.resourceKey, request])
  );
  const canManage = permissionCodes.includes('SYSTEM_PROPERTY_WRITE');
  const detailPath = `/admin/system-property/${systemProperty.id}`;

  return (
    <div className="grid gap-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase">
              System Property Detail
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
            <Button variant="outline" className="rounded-2xl" asChild>
              <Link href="/admin/system-property">
                <ArrowLeft className="size-4" />
                Back
              </Link>
            </Button>

            {canManage ? (
              <Button variant="outline" className="rounded-2xl" asChild>
                <Link href={`${detailPath}/value/new`}>
                  <Plus className="size-4" />
                  Add
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
                {systemProperty.id}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                System Property
              </td>
              <td className="py-3 font-semibold text-slate-950">
                {systemProperty.propertyCode}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Description
              </td>
              <td className="py-3 pr-8 leading-6 text-slate-600">
                {systemProperty.description}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Updated
              </td>
              <td className="py-3 font-semibold text-slate-950">
                {formatDate(systemProperty.updatedAt)}
              </td>
            </tr>
            <tr>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Value Count
              </td>
              <td className="py-3 pr-8 font-semibold text-slate-950">
                {systemProperty.values.length}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Scope
              </td>
              <td className="py-3 font-semibold text-slate-950">
                Owner organization only
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-[1.05rem] font-semibold tracking-tight text-slate-950">
              System Property Values
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Approved value rows currently associated with this System Property.
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Approval Request
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {systemProperty.values.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      No System Property Values are defined yet.
                    </td>
                  </tr>
                ) : null}

                {systemProperty.values.map((value) => {
                  const pendingRequest = pendingRequestByValueKey.get(
                    buildSystemPropertyValueRouteResourceKey(
                      systemProperty.propertyCode,
                      value.id
                    )
                  );

                  return (
                    <tr key={value.id}>
                      <td className="px-4 py-4 text-sm font-medium text-slate-900">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          asChild
                        >
                          <Link
                            href={`${detailPath}/value/${value.id}/edit`}
                          >
                            {value.propertyItemCode}
                          </Link>
                        </Button>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {value.propertyValue}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {value.description}
                      </td>
                      <td className="px-4 py-4">
                        {pendingRequest ? (
                          <div className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                            {pendingRequest.actionType === 'UPDATE'
                              ? 'Pending edit approval'
                              : 'Pending delete approval'}
                          </div>
                        ) : (
                          <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            No approval
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}