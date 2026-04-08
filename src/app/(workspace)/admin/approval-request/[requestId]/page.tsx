import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { requireNavigationItemAccess } from '@/lib/auth/authorization';
import { getApprovalRequestById } from '@/lib/approval-requests';
import { interpretChange } from '@/lib/change-interpreters';

type ApprovalRequestDetailPageProps = {
  params: Promise<{
    requestId: string;
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

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
  CANCELLED: 'border-slate-200 bg-slate-50 text-slate-500',
};

export default async function ApprovalRequestDetailPage({
  params,
  searchParams,
}: ApprovalRequestDetailPageProps) {
  const [{ requestId }, queryParams] = await Promise.all([
    params,
    searchParams,
  ]);

  const { session } = await requireNavigationItemAccess(
    'admin',
    'approval-request'
  );

  const resolvedId = Number(requestId);
  const request = await getApprovalRequestById(
    session.organizationId,
    resolvedId
  );

  if (!request) {
    notFound();
  }

  const interpreted = interpretChange(
    request.resourceType,
    request.actionType,
    request.changedFields,
    request.beforeState,
    request.afterState
  );

  return (
    <div className="grid gap-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase">
              Approval Request Detail
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
            <Button variant="outline" className="rounded-2xl" asChild>
              <Link href="/admin/approval-request">
                <ArrowLeft className="size-4" />
                Back
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
      </section>

      {/* Request metadata */}
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Request ID
              </td>
              <td className="py-3 pr-8 font-semibold text-slate-950">
                {request.id}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Status
              </td>
              <td className="py-3">
                <div
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                    STATUS_STYLE[request.status] ??
                    'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  {request.status}
                </div>
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Resource Type
              </td>
              <td className="py-3 pr-8 font-semibold text-slate-950">
                {request.resourceType}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Action
              </td>
              <td className="py-3 font-semibold text-slate-950">
                {request.actionType}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Resource Key
              </td>
              <td colSpan={3} className="py-3 font-semibold text-slate-950">
                {request.resourceKey}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Summary
              </td>
              <td colSpan={3} className="py-3 leading-6 text-slate-600">
                {request.summary}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Submitted By
              </td>
              <td className="py-3 pr-8 font-semibold text-slate-950">
                {request.submittedByDisplayName ?? '—'}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Submitted At
              </td>
              <td className="py-3 font-semibold text-slate-950">
                {formatDate(request.submittedAt)}
              </td>
            </tr>
            {request.reviewedByDisplayName || request.reviewedAt ? (
              <tr className="border-b border-slate-200">
                <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                  Reviewed By
                </td>
                <td className="py-3 pr-8 font-semibold text-slate-950">
                  {request.reviewedByDisplayName ?? '—'}
                </td>
                <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                  Reviewed At
                </td>
                <td className="py-3 font-semibold text-slate-950">
                  {request.reviewedAt ? formatDate(request.reviewedAt) : '—'}
                </td>
              </tr>
            ) : null}
            {request.reviewComment ? (
              <tr className="border-b border-slate-200">
                <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                  Review Comment
                </td>
                <td colSpan={3} className="py-3 leading-6 text-slate-600">
                  {request.reviewComment}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      {/* Interpreted change details */}
      {interpreted && interpreted.fields.length > 0 ? (
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase">
            {interpreted.resourceTypeLabel} — Change Details
          </h3>

          <div className="overflow-hidden rounded-[24px] border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                      Field
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                      Before
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                      After
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {interpreted.fields.map((field) => (
                    <tr key={field.label}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {field.label}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {field.before ?? (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {field.after ?? (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      {/* Workflow history */}
      {request.actions.length > 0 ? (
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase">
            Workflow History
          </h3>

          <div className="overflow-hidden rounded-[24px] border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                      By
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                      Comment
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {request.actions.map((action) => (
                    <tr key={action.id}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {action.actionType}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {action.actedByDisplayName ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatDate(action.actedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {action.commentText ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
