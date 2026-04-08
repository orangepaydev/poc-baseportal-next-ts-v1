import { Clock3, FileText, FolderClosed, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { requireNavigationItemAccess } from '@/lib/auth/authorization';

type MenuItemPageProps = {
  params: Promise<{
    group: string;
    item: string;
  }>;
};

export default async function MenuItemPage({ params }: MenuItemPageProps) {
  const { group: groupSlug, item: itemSlug } = await params;
  const { entry } = await requireNavigationItemAccess(groupSlug, itemSlug);
  const { group, item } = entry;

  return (
    <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
      <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-slate-500 uppercase">
              {group.title}
            </p>
            <h3 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {item.title}
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              {item.description} This is a placeholder page wired to the sidebar
              so the workspace has real navigation targets while the final
              feature content is still being built.
            </p>
          </div>

          <div className="rounded-2xl bg-cyan-50 px-4 py-3 text-sm text-cyan-700">
            Active route placeholder
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-700">
              <Sparkles className="size-4" />
              <span className="text-sm font-medium">Summary</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Use this card for the top-level KPI or narrative summary for{' '}
              {item.title}.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-700">
              <Clock3 className="size-4" />
              <span className="text-sm font-medium">Recent Activity</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Add a feed, jobs list, or system events related to {group.title}{' '}
              here.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-700">
              <FileText className="size-4" />
              <span className="text-sm font-medium">Next Actions</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Reserve this space for tables, forms, or approval steps for{' '}
              {item.title}.
            </p>
          </div>
        </div>
      </article>

      <aside className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
            <FolderClosed className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-slate-500 uppercase">
              Placeholder Notes
            </p>
            <h4 className="text-xl font-semibold text-slate-900">
              Build-out checklist
            </h4>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Define the primary data module for {item.title}.
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Add table, filters, or cards based on the final product
            requirements.
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Replace placeholder copy with live states and empty-state handling.
          </div>
        </div>

        <Button className="mt-6 w-full">Placeholder action</Button>
      </aside>
    </div>
  );
}
