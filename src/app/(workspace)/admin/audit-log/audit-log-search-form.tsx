'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';

type AuditLogSearchFormProps = {
  action: string;
  eventTypeFilter: string;
  resourceTypeFilter: string;
  occurredAtStartFilter: string;
  occurredAtEndFilter: string;
};

function padDateTimePart(value: number) {
  return String(value).padStart(2, '0');
}

function formatLocalDateTimeValue(date: Date) {
  return `${date.getFullYear()}-${padDateTimePart(
    date.getMonth() + 1
  )}-${padDateTimePart(date.getDate())}T${padDateTimePart(
    date.getHours()
  )}:${padDateTimePart(date.getMinutes())}:${padDateTimePart(
    date.getSeconds()
  )}`;
}

function formatUtcDateTimeForLocalInput(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return formatLocalDateTimeValue(date);
}

function formatLocalDateTimeAsUtc(value: string) {
  const localDate = new Date(value);

  if (Number.isNaN(localDate.getTime())) {
    return '';
  }

  return localDate.toISOString();
}

export function AuditLogSearchForm({
  action,
  eventTypeFilter,
  resourceTypeFilter,
  occurredAtStartFilter,
  occurredAtEndFilter,
}: AuditLogSearchFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localOccurredAtStart, setLocalOccurredAtStart] = useState('');
  const [localOccurredAtEnd, setLocalOccurredAtEnd] = useState('');

  useEffect(() => {
    setLocalOccurredAtStart(
      formatUtcDateTimeForLocalInput(occurredAtStartFilter)
    );
    setLocalOccurredAtEnd(formatUtcDateTimeForLocalInput(occurredAtEndFilter));
  }, [occurredAtEndFilter, occurredAtStartFilter]);

  return (
    <form
      action={action}
      className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]"
      onSubmit={(event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const params = new URLSearchParams();
        const submittedEventTypeFilter = String(
          formData.get('eventType') ?? ''
        ).trim();
        const submittedResourceTypeFilter = String(
          formData.get('resourceType') ?? ''
        ).trim();
        const occurredAtStartUtc = formatLocalDateTimeAsUtc(localOccurredAtStart);
        const occurredAtEndUtc = formatLocalDateTimeAsUtc(localOccurredAtEnd);

        if (submittedEventTypeFilter) {
          params.set('eventType', submittedEventTypeFilter);
        }

        if (submittedResourceTypeFilter) {
          params.set('resourceType', submittedResourceTypeFilter);
        }

        if (occurredAtStartUtc) {
          params.set('occurredAtStart', occurredAtStartUtc);
        }

        if (occurredAtEndUtc) {
          params.set('occurredAtEnd', occurredAtEndUtc);
        }

        const href = params.toString() ? `${action}?${params.toString()}` : action;

        startTransition(() => {
          router.push(href);
        });
      }}
    >
      <label className="space-y-2 text-sm font-medium text-slate-700">
        <span>Event Type</span>
        <input
          name="eventType"
          type="text"
          defaultValue={eventTypeFilter}
          placeholder="e.g. AUTH_LOGIN_SUCCEEDED"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
        />
      </label>

      <label className="space-y-2 text-sm font-medium text-slate-700">
        <span>Resource Type</span>
        <input
          name="resourceType"
          type="text"
          defaultValue={resourceTypeFilter}
          placeholder="e.g. USER"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
        />
      </label>

      <label className="space-y-2 text-sm font-medium text-slate-700">
        <span>Event Time Start</span>
        <input
          name="occurredAtStart"
          type="datetime-local"
          step="1"
          value={localOccurredAtStart}
          onChange={(event) => {
            setLocalOccurredAtStart(event.target.value);
          }}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
        />
      </label>

      <label className="space-y-2 text-sm font-medium text-slate-700">
        <span>Event Time End</span>
        <input
          name="occurredAtEnd"
          type="datetime-local"
          step="1"
          value={localOccurredAtEnd}
          onChange={(event) => {
            setLocalOccurredAtEnd(event.target.value);
          }}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
        />
      </label>

      <div className="flex items-end">
        <Button
          type="submit"
          disabled={isPending}
          className="w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-800 lg:w-auto"
        >
          <Search className="size-4" />
          Search
        </Button>
      </div>
    </form>
  );
}
