import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { requireNavigationItemAccess } from '@/lib/auth/authorization';
import { getAuditEventById } from '@/lib/audit-events';

import { LocalDateTimeText } from '../local-datetime-text';

type AuditLogDetailPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function AuditLogDetailPage({
  params,
}: AuditLogDetailPageProps) {
  const { eventId } = await params;

  const { session } = await requireNavigationItemAccess(
    'admin',
    'audit-log'
  );

  const resolvedId = Number(eventId);
  const event = await getAuditEventById(session.organizationId, resolvedId);

  if (!event) {
    notFound();
  }

  console.log('event detail:', event);

  return (
    <div className="grid gap-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase">
              Audit Event Detail
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
            <Button variant="outline" className="rounded-2xl" asChild>
              <Link href="/admin/audit-log">
                <ArrowLeft className="size-4" />
                Back
              </Link>
            </Button>

            {event.approvalRequestId ? (
              <Button variant="outline" className="rounded-2xl" asChild>
                <Link
                  href={`/admin/approval-request/${event.approvalRequestId}`}
                >
                  View Approval Request
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Event ID
              </td>
              <td className="py-3 pr-8 font-semibold text-slate-950">
                {event.id}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Event Type
              </td>
              <td className="py-3 font-semibold text-slate-950">
                {event.eventType}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Resource Type
              </td>
              <td className="py-3 pr-8 font-semibold text-slate-950">
                {event.resourceType}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Resource Key
              </td>
              <td className="py-3 font-semibold text-slate-950">
                {event.resourceKey}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Actor
              </td>
              <td className="py-3 pr-8 font-semibold text-slate-950">
                {event.actorDisplayName ?? '—'}
                {event.actorUsername ? (
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    ({event.actorUsername})
                  </span>
                ) : null}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Organization
              </td>
              <td className="py-3 font-semibold text-slate-950">
                {event.organizationCode ?? '—'}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Occurred At
              </td>
              <td className="py-3 pr-8 font-semibold text-slate-950">
                <LocalDateTimeText value={event.occurredAt} />
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                Approval Request
              </td>
              <td className="py-3 font-semibold text-slate-950">
                {event.approvalRequestId ? (
                  <Link
                    href={`/admin/approval-request/${event.approvalRequestId}`}
                    className="text-cyan-700 underline underline-offset-2 hover:text-cyan-900"
                  >
                    {event.approvalRequestId}
                  </Link>
                ) : (
                  '—'
                )}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                IP Address
              </td>
              <td className="py-3 pr-8 font-semibold text-slate-950">
                {event.ipAddress ?? '—'}
              </td>
              <td className="py-3 pr-4 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                User Agent
              </td>
              <td className="py-3 leading-6 text-slate-600">
                {event.userAgent ?? '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {event.eventData ? (
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase">
            Event Data
          </h3>

          <pre className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            {JSON.stringify(event.eventData, null, 2)}
          </pre>
        </section>
      ) : null}
    </div>
  );
}
