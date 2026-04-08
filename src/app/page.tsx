'use client';

import { useState } from 'react';
import {
  ChevronRight,
  FileText,
  FolderClosed,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  User,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

const navigationGroups = [
  {
    folder: 'Transactin',
    items: ['Overview', 'Invoices', 'Payments'],
  },
  {
    folder: 'Admin',
    items: ['Users', 'Roles', 'Audit Log'],
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(true);

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
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">
                  Workspace
                </p>
                <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
                  BasePortal Control Panel
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2">
                <User />
                <span className="hidden sm:inline">Profile</span>
              </Button>
              <Button variant="outline" className="gap-2">
                <Settings />
                <span className="hidden sm:inline">Setting</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <aside
            className={[
              'border-r border-slate-200/80 bg-slate-950 text-slate-50 transition-all duration-300 ease-out',
              menuOpen
                ? 'w-72 translate-x-0 px-4 py-5 sm:px-5'
                : 'w-0 -translate-x-full overflow-hidden px-0 py-5 sm:w-24 sm:translate-x-0 sm:px-3',
            ].join(' ')}
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
                {navigationGroups.map((group) => (
                  <section
                    key={group.folder}
                    className="rounded-2xl border border-white/8 bg-white/4 p-3"
                  >
                    <div className="flex items-center gap-2 text-slate-200">
                      <FolderClosed className="size-4" />
                      {menuOpen ? (
                        <span className="text-sm font-medium">{group.folder}</span>
                      ) : null}
                    </div>
                    <ul className="mt-3 space-y-1">
                      {group.items.map((item) => (
                        <li key={item}>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm text-slate-300 transition hover:bg-white/8 hover:text-white"
                          >
                            <FileText className="size-4" />
                            {menuOpen ? (
                              <>
                                <span className="flex-1">{item}</span>
                                <ChevronRight className="size-4 opacity-60" />
                              </>
                            ) : null}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </nav>
            </div>
          </aside>

          <section className="min-w-0 flex-1 bg-white/65 p-4 sm:p-6">
            <div className="flex h-full flex-col gap-6">
              <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-7">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">
                  Main Panel
                </p>
                <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-2xl">
                    <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                      Menu-driven workspace overview
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                      The right panel renders the active page content while reflecting
                      the folders and menu items defined in the navigation.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
                    2 folders · 6 menu items · collapsible sidebar
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {navigationGroups.map((group) => (
                  <article
                    key={group.folder}
                    className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                          Folder
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                          {group.folder}
                        </h3>
                      </div>
                      <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700">
                        <FolderClosed className="size-5" />
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      {group.items.map((item) => (
                        <div
                          key={item}
                          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-white p-2 text-slate-600 shadow-sm">
                              <FileText className="size-4" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{item}</p>
                              <p className="text-sm text-slate-500">
                                Available from the {group.folder} menu
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            Open
                          </Button>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
