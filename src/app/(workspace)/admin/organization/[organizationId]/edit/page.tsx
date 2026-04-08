import Link from 'next/link';
import { ArrowLeft, FilePenLine } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { requireNavigationItemAccess } from '@/lib/auth/authorization';
import {
  buildOrganizationRouteResourceKey,
  getOrganizationById,
  listPendingOrganizationRequests,
} from '@/lib/organizations';

import { updateOrganizationRequestAction } from '../../actions';

type EditOrganizationPageProps = {
  params: Promise<{
    organizationId: string;
  }>;
  searchParams: Promise<{
    notice?: string;
    error?: string;
  }>;
};

export default async function EditOrganizationPage({
  params,
  searchParams,
}: EditOrganizationPageProps) {
  const [{ organizationId }, queryParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const { permissionCodes } = await requireNavigationItemAccess(
    'admin',
    'organization'
  );

  if (!permissionCodes.includes('ORGANIZATION_WRITE')) {
    notFound();
  }

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
  const detailPath = `/admin/organization/${organization.id}`;

  return (
    <div className="grid gap-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase">
              Edit Organization
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
            this organization.
          </div>
        ) : (
          <form
            action={updateOrganizationRequestAction}
            className="mt-6 grid gap-4"
          >
            <input
              name="organizationId"
              type="hidden"
              value={organization.id}
            />
            <input name="redirectTo" type="hidden" value={detailPath} />

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Organization Name</span>
              <input
                name="organizationName"
                type="text"
                defaultValue={organization.organizationName}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Status</span>
              <select
                name="status"
                defaultValue={organization.status}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
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
