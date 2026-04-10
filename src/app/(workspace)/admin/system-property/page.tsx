import Link from 'next/link';
import { Plus, Search } from 'lucide-react';

import {
  SortableQueryTable,
  type SortableQueryTableColumn,
  type SortableQueryTableRow,
} from '@/components/sortable-query-table';
import { Button } from '@/components/ui/button';
import { requireNavigationItemAccess } from '@/lib/auth/authorization';
import { searchApprovedSystemPropertiesPage } from '@/lib/system-properties';

type SystemPropertyPageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    notice?: string;
    error?: string;
  }>;
};

const PAGE_SIZE = 10;

const SYSTEM_PROPERTY_TABLE_COLUMNS: readonly SortableQueryTableColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'systemProperty', label: 'System Property' },
  { key: 'values', label: 'Values', align: 'right' },
  { key: 'updatedAt', label: 'Updated' },
];

function buildPageHref(searchQuery: string, page: number) {
  const params = new URLSearchParams();

  if (searchQuery) {
    params.set('q', searchQuery);
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  const query = params.toString();

  return query ? `/admin/system-property?${query}` : '/admin/system-property';
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-SG', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatDate(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

export default async function SystemPropertyPage({
  searchParams,
}: SystemPropertyPageProps) {
  const params = await searchParams;
  const searchQuery = (params.q ?? '').trim();
  const currentPage = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);
  const { permissionCodes } = await requireNavigationItemAccess(
    'system',
    'system-property'
  );
  const canManage = permissionCodes.includes('SYSTEM_PROPERTY_WRITE');
  const result = await searchApprovedSystemPropertiesPage({
    propertyQuery: searchQuery,
    page: currentPage,
    pageSize: PAGE_SIZE,
  });
  const { rows: systemProperties, totalCount, page, pageSize } = result;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const systemPropertyRows: SortableQueryTableRow[] = systemProperties.map(
    (systemProperty) => ({
      id: systemProperty.id,
      cells: {
        id: {
          kind: 'link',
          href: `/admin/system-property/${systemProperty.id}`,
          primary: String(systemProperty.id),
          sortValue: systemProperty.id,
        },
        systemProperty: {
          kind: 'text',
          primary: systemProperty.propertyCode,
          secondary: systemProperty.description,
          sortValue: systemProperty.propertyCode,
        },
        values: {
          kind: 'text',
          primary: String(systemProperty.valueCount),
          sortValue: systemProperty.valueCount,
          align: 'right',
        },
        updatedAt: {
          kind: 'text',
          primary: formatDate(systemProperty.updatedAt),
          sortValue: new Date(systemProperty.updatedAt).getTime(),
        },
      },
    })
  );

  return (
    <div className="grid gap-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[1.05rem] font-semibold tracking-tight text-slate-950">
              System Property search
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Manage owner-only system property sets. System Property Values are created and maintained from the detail flow.
            </p>
          </div>
        </div>

        <form
          action="/admin/system-property"
          className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto_auto]"
        >
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>System Property / Description</span>
            <input
              name="q"
              type="text"
              defaultValue={searchQuery}
              placeholder="Search by code or description"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
            />
          </label>

          <div className="flex items-end">
            <Button
              type="submit"
              className="w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-800 lg:w-auto"
            >
              <Search className="size-4" />
              Search
            </Button>
          </div>

          <div className="flex items-end">
            {canManage ? (
              <Button
                variant="outline"
                className="w-full rounded-2xl lg:w-auto"
                asChild
              >
                <Link href="/admin/system-property/new">
                  <Plus className="size-4" />
                  Add
                </Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full rounded-2xl lg:w-auto"
                disabled
              >
                <Plus className="size-4" />
                Add
              </Button>
            )}
          </div>
        </form>

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
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-1 shadow-sm">
        <div className="flex flex-wrap items-center justify-end gap-3 px-5 pt-5 text-sm text-slate-600">
          <p>
            Page {page} of {totalPages}
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200">
          <SortableQueryTable
            columns={SYSTEM_PROPERTY_TABLE_COLUMNS}
            rows={systemPropertyRows}
            emptyMessage="No System Properties matched the current query."
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 px-5 py-5">
          {page > 1 ? (
            <Button variant="outline" className="rounded-2xl" asChild>
              <Link href={buildPageHref(searchQuery, page - 1)}>Previous</Link>
            </Button>
          ) : (
            <Button variant="outline" className="rounded-2xl" disabled>
              Previous
            </Button>
          )}

          {page < totalPages ? (
            <Button variant="outline" className="rounded-2xl" asChild>
              <Link href={buildPageHref(searchQuery, page + 1)}>Next</Link>
            </Button>
          ) : (
            <Button variant="outline" className="rounded-2xl" disabled>
              Next
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}