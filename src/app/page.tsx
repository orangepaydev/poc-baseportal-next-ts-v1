import Link from 'next/link';
import { ArrowRight, FileText, FolderClosed } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { navigationGroups } from '@/lib/navigation';

export default function Home() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {navigationGroups.map((group) => (
        <article
          key={group.slug}
          className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-slate-500 uppercase">
                Folder
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                {group.title}
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                {group.description}
              </p>
            </div>
            <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700">
              <FolderClosed className="size-5" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {group.items.map((item) => (
              <div
                key={item.slug}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white p-2 text-slate-600 shadow-sm">
                    <FileText className="size-4" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={item.href}>
                    Open
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
