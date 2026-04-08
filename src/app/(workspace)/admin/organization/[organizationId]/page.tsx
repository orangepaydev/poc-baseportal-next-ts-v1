import Link from 'next/link';
import { ArrowLeft, FilePenLine, ShieldCheck } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { requireNavigationItemAccess } from '@/lib/auth/authorization';
import {
  buildOrganizationRouteResourceKey,
  getOrganizationById,
  listPendingOrganizationRequests,
} from '@/lib/organizations';

import { DeleteOrganizationRequestButton } from './delete-organization-request-button';

type OrganizationDetailPageProps = {
  params: Promise<{
    organizationId: string;
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

export default async function OrganizationDetailPage({
  params,
  searchParams,
}: OrganizationDetailPageProps) {
  const [{ organizationId }, queryParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const { permissionCodes } = await requireNavigationItemAccess(
    'admin',
    'organization'
  );
  const resolvedOrganizationId = Number(organizationId);
  const organization = await getOrganizationById(resolvedOrganizationId);

  if (!organization) {
    notFound();
  }

  const pendingRequests = await listPendingOrganizationRequests();
  const resourceKey = buildOrganizationRouteResourceKey(
    organization.organizationCode
  );
  const pendingRequest = pendingRequests.find(
    (request) => request.resourceKey === resourceKey
  );
  const canManage = permissionCodes.includes('ORGANIZATION_WRITE');
  const canApprove = permissionCodes.includes('ORGANIZATION_APPROVE');
  const canOpenApproveRequest =
    Boolean(pendingRequest) && (canManage || canApprove);
  const canEditOrDelete =
    !pendingRequest && organization.status === 'ACTIVE' && canManage;
  const detailPath = `/admin/organization/${organization.id}`;

  return (
    <div className="grid gap-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase">
              Organization Detail
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
            <Button variant="outline" className="rounded-2xl" asChild>
              <Link href="/admin/organization">
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
                <DeleteOrganizationRequestButton
                  organizationId={organization.id}
                  organizationName={organization.organizationName}
                  redirectTo={detailPath}
                />
              </>
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
                {organization.id}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Organization Code
              </td>
              <td className="py-3 font-semibold text-slate-950">
                {organization.organizationCode}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Organization Name
              </td>
              <td className="py-3 pr-8 font-semibold text-slate-950">
                {organization.organizationName}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Users
              </td>
              <td className="py-3 font-semibold text-slate-950">
                {organization.userCount}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Record Status
              </td>
              <td className="py-3 pr-8 font-semibold text-slate-950">
                {organization.status}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Updated
              </td>
              <td className="py-3 font-semibold text-slate-950">
                {formatDate(organization.updatedAt)}
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
