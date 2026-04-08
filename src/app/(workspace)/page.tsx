import Link from 'next/link';
import { ArrowRight, FileText, FolderClosed, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getAuthenticatedUserContext } from '@/lib/auth/authorization';

export default async function Home() {
  const {
    permissionCodes,
    session,
    visibleNavigationGroups,
    visibleNavigationItemCount,
  } = await getAuthenticatedUserContext();

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold tracking-[0.22em] text-cyan-700 uppercase">
            Signed In
          </p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h3 className="text-3xl font-semibold tracking-tight text-slate-950">
                Welcome back, {session.displayName}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                Your workspace is now scoped to the{' '}
                <strong>{session.organizationCode}</strong> organisation. Use
                the menu folders below to move into transaction and
                administration workflows.
              </p>
            </div>
            <div className="rounded-2xl bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
              {permissionCodes.length} effective permissions loaded.
            </div>
          </div>
        </article>

        <aside className="rounded-[24px] border border-slate-200 bg-slate-950 p-6 text-slate-50 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-cyan-400/15 p-3 text-cyan-200">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-cyan-200 uppercase">
                Session Context
              </p>
              <h3 className="mt-2 text-xl font-semibold">
                Authenticated workspace
              </h3>
            </div>
          </div>

          <dl className="mt-5 grid gap-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <dt className="text-xs tracking-[0.18em] text-slate-400 uppercase">
                Organisation
              </dt>
              <dd className="mt-1 text-base font-medium text-white">
                {session.organizationCode}
              </dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <dt className="text-xs tracking-[0.18em] text-slate-400 uppercase">
                User
              </dt>
              <dd className="mt-1 text-base font-medium text-white">
                {session.username}
              </dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <dt className="text-xs tracking-[0.18em] text-slate-400 uppercase">
                Menu Access
              </dt>
              <dd className="mt-1 text-base font-medium text-white">
                {visibleNavigationItemCount} visible menu items
              </dd>
            </div>
          </dl>
        </aside>
      </section>

      {visibleNavigationGroups.length === 0 ? (
        <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold tracking-[0.22em] text-slate-500 uppercase">
            Access
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-slate-950">
            No workspace menu items are assigned
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Your account is authenticated, but it does not currently hold any
            menu permissions for this workspace. An administrator can assign
            access through user groups and permissions.
          </p>
        </article>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleNavigationGroups.map((group) => (
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
                        <p className="font-medium text-slate-900">
                          {item.title}
                        </p>
                        <p className="text-sm text-slate-500">
                          {item.description}
                        </p>
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
      )}
    </div>
  );
}
