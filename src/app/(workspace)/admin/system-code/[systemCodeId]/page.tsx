import Link from 'next/link';
import { ArrowLeft, FilePenLine, ShieldCheck } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { requireNavigationItemAccess } from '@/lib/auth/authorization';
import {
  buildSystemCodeRouteResourceKey,
  getApprovedSystemCodeById,
  listPendingSystemCodeRequests,
} from '@/lib/system-codes';

type SystemCodeDetailPageProps = {
  params: Promise<{
    systemCodeId: string;
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

export default async function SystemCodeDetailPage({
  params,
  searchParams,
}: SystemCodeDetailPageProps) {
  const [{ systemCodeId }, queryParams] = await Promise.all([params, searchParams]);
  const { permissionCodes } = await requireNavigationItemAccess(
    'system',
    'system-code'
  );
  const resolvedSystemCodeId = Number(systemCodeId);
  const systemCode = await getApprovedSystemCodeById(resolvedSystemCodeId);

  if (!systemCode) {
    notFound();
  }

  const pendingRequests = await listPendingSystemCodeRequests();
  const resourceKey = buildSystemCodeRouteResourceKey(systemCode.systemCode);
  const pendingRequest = pendingRequests.find(
    (request) => request.resourceKey === resourceKey
  );
  const canManage = permissionCodes.includes('SYSTEM_CODE_WRITE');
  const canApprove = permissionCodes.includes('SYSTEM_CODE_APPROVE');
  const canOpenApproveRequest =
    Boolean(pendingRequest) && (canManage || canApprove);
  const canEdit = !pendingRequest && canManage;
  const detailPath = `/admin/system-code/${systemCode.id}`;

  return (
    <div className="grid gap-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase">
              System Code Detail
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
            <Button variant="outline" className="rounded-2xl" asChild>
              <Link href="/admin/system-code">
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

            {canEdit ? (
              <Button variant="outline" className="rounded-2xl" asChild>
                <Link href={`${detailPath}/edit`}>
                  <FilePenLine className="size-4" />
                  Edit
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
                {systemCode.id}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                System Code
              </td>
              <td className="py-3 font-semibold text-slate-950">
                {systemCode.systemCode}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Status
              </td>
              <td className="py-3 pr-8 font-semibold text-slate-950">
                {systemCode.status}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Approval Request
              </td>
              <td className="py-3 font-semibold text-slate-950">
                {pendingRequest
                  ? pendingRequest.actionType === 'CREATE'
                    ? 'Pending create approval'
                    : 'Pending edit approval'
                  : 'No approval'}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Description
              </td>
              <td className="py-3 pr-8 leading-6 text-slate-600">
                {systemCode.description}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Updated
              </td>
              <td className="py-3 font-semibold text-slate-950">
                {formatDate(systemCode.updatedAt)}
              </td>
            </tr>
            <tr>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Value Count
              </td>
              <td className="py-3 pr-8 font-semibold text-slate-950">
                {systemCode.values.length}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Pending Request
              </td>
              <td className="py-3 font-semibold text-amber-700">
                {pendingRequest ? pendingRequest.summary : 'None'}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-[1.05rem] font-semibold tracking-tight text-slate-950">
              System Code Values
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Values currently associated with this System Code.
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                    Sort Order
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {systemCode.values.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      No System Code Values are defined yet.
                    </td>
                  </tr>
                ) : null}

                {systemCode.values.map((value) => (
                  <tr key={value.id}>
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">
                      {value.systemCodeValue}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {value.description}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {value.status}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {value.sortOrder}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}