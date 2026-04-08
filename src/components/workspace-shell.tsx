'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  FolderClosed,
  FolderOpen,
  LayoutGrid,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  User,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { logoutAction } from '@/lib/auth/actions';
import type { AuthenticatedSession } from '@/lib/auth/types';
import { cn } from '@/lib/utils';
import type { NavigationGroup } from '@/lib/navigation';

type WorkspaceShellProps = {
  session: AuthenticatedSession;
  navigationGroups: NavigationGroup[];
  navigationItemCount: number;
  children: React.ReactNode;
};

export function WorkspaceShell({
  session,
  navigationGroups,
  navigationItemCount,
  children,
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >(
    () =>
      Object.fromEntries(
        navigationGroups.map((group) => [group.slug, true])
      ) as Record<string, boolean>
  );

  function toggleFolder(folderSlug: string) {
    setExpandedFolders((current) => ({
      ...current,
      [folderSlug]: !current[folderSlug],
    }));
  }

  function closeMobileMenu() {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setMenuOpen(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,116,144,0.12),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-3 text-slate-900 sm:p-5">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-7xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white/70 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:min-h-[calc(100vh-2.5rem)]">
        <header className="border-b border-slate-200/80 bg-white/85 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label={menuOpen ? 'Collapse menu' : 'Expand menu'}
              >
                {menuOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
              </Button>
              <div>
                <p className="text-xs font-semibold tracking-[0.28em] text-cyan-700 uppercase">
                  Workspace
                </p>
                <Link href="/" className="block">
                  <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
                    BasePortal Control Panel
                  </h1>
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-right sm:block">
                <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                  {session.organizationCode}
                </p>
                <p className="text-sm font-medium text-slate-900">
                  {session.displayName}
                </p>
              </div>
              <Button variant="outline" className="gap-2">
                <User />
                <span className="hidden sm:inline">Profile</span>
              </Button>
              <Button variant="outline" className="gap-2">
                <Settings />
                <span className="hidden sm:inline">Setting</span>
              </Button>
              <form action={logoutAction}>
                <Button type="submit" variant="outline" className="gap-2">
                  <LogOut />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </form>
            </div>
          </div>
        </header>

        <div className="relative flex min-h-0 flex-1">
          {menuOpen ? (
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 z-10 bg-slate-950/30 sm:hidden"
              onClick={() => setMenuOpen(false)}
            />
          ) : null}

          <aside
            className={cn(
              'relative z-20 overflow-hidden bg-slate-950 text-slate-50 transition-all duration-300 ease-out',
              menuOpen
                ? 'absolute inset-y-0 left-0 w-72 translate-x-0 border-r border-slate-200/80 px-4 py-5 opacity-100 sm:static sm:w-72 sm:px-5'
                : 'pointer-events-none w-0 -translate-x-full border-r-0 px-0 py-0 opacity-0 sm:static sm:translate-x-0'
            )}
            aria-hidden={!menuOpen}
          >
            <div className="flex h-full flex-col gap-6 overflow-hidden">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200">
                    <LayoutGrid className="size-5" />
                  </div>
                  {menuOpen ? (
                    <div>
                      <p className="text-sm font-semibold">Navigation</p>
                      <p className="text-xs text-slate-400">
                        Folders and linked menu items
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              <nav className="flex flex-1 flex-col gap-5 overflow-y-auto">
                {navigationGroups.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-slate-300">
                    No menu items are available for this account.
                  </div>
                ) : null}
                {navigationGroups.map((group) => {
                  const isExpanded = expandedFolders[group.slug];

                  return (
                    <section
                      key={group.slug}
                      className="rounded-2xl border border-white/8 bg-white/4 p-3"
                    >
                      <button
                        type="button"
                        className={cn(
                          'flex w-full items-center gap-2 text-left text-slate-200',
                          menuOpen ? 'justify-between' : 'justify-center'
                        )}
                        onClick={() => toggleFolder(group.slug)}
                        aria-expanded={isExpanded}
                        aria-controls={`${group.slug}-menu`}
                      >
                        <span className="flex items-center gap-2">
                          {isExpanded && menuOpen ? (
                            <FolderOpen className="size-4" />
                          ) : (
                            <FolderClosed className="size-4" />
                          )}
                          {menuOpen ? (
                            <span className="text-sm font-medium">
                              {group.title}
                            </span>
                          ) : null}
                        </span>
                        {menuOpen ? (
                          isExpanded ? (
                            <ChevronDown className="size-4 opacity-70" />
                          ) : (
                            <ChevronRight className="size-4 opacity-70" />
                          )
                        ) : null}
                      </button>

                      {menuOpen && isExpanded ? (
                        <ul
                          id={`${group.slug}-menu`}
                          className="mt-3 space-y-1"
                        >
                          {group.items.map((item) => {
                            const isActive = pathname === item.href;

                            return (
                              <li key={item.slug}>
                                <Link
                                  href={item.href}
                                  className={cn(
                                    'flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm transition',
                                    isActive
                                      ? 'bg-cyan-400/15 text-white'
                                      : 'text-slate-300 hover:bg-white/8 hover:text-white'
                                  )}
                                  onClick={closeMobileMenu}
                                >
                                  <FileText className="size-4" />
                                  <span className="flex-1">{item.title}</span>
                                  <ChevronRight className="size-4 opacity-60" />
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </section>
                  );
                })}
              </nav>
            </div>
          </aside>

          <section className="min-w-0 flex-1 bg-white/65 p-4 sm:p-6">
            <div className="flex h-full flex-col gap-6">
              <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-7">
                <p className="text-sm font-semibold tracking-[0.24em] text-cyan-700 uppercase">
                  Main Panel
                </p>
                <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-2xl">
                    <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                      Menu-driven workspace overview
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                      The right panel renders the active page content while
                      keeping the sidebar folders and menu items reusable across
                      the workspace.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
                    {navigationGroups.length} folders · {navigationItemCount}{' '}
                    menu items · collapsible sidebar
                  </div>
                </div>
              </div>

              {children}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
