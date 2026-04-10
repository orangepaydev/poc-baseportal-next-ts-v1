import { Building2, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { loginAction } from '@/lib/auth/actions';
import { readSession } from '@/lib/auth/session';

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    notice?: string;
    organization?: string;
    username?: string;
  }>;
};

function getErrorMessage(error?: string) {
  switch (error) {
    case 'missing':
      return 'Enter organisation, user, and password to continue.';
    case 'invalid':
      return 'The supplied credentials could not be verified.';
    default:
      return null;
  }
}

function getNoticeMessage(notice?: string) {
  switch (notice) {
    case 'password-changed':
      return 'Your password has been changed. Sign in again with the new password.';
    default:
      return null;
  }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await readSession();

  if (session) {
    redirect(session.passwordResetRequired ? '/change-password' : '/');
  }

  const params = await searchParams;
  const errorMessage = getErrorMessage(params.error);
  const noticeMessage = getNoticeMessage(params.notice);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,116,144,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.18),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-[32px] border border-white/70 bg-white/75 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur lg:grid-cols-[1.15fr_0.85fr]">
        <section className="relative flex flex-col justify-between overflow-hidden bg-slate-950 px-6 py-8 text-slate-50 sm:px-8 lg:px-10 lg:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(148,163,184,0.18),transparent_26%)]" />

          <div className="relative">
            <p className="text-xs font-semibold tracking-[0.28em] text-cyan-200 uppercase">
              BasePortal Workspace
            </p>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Sign in with your organisation code, username, and password to
              open the same control workspace used for transaction and admin
              operations.
            </p>
          </div>

          <div className="relative grid gap-4 md:grid-cols-3">
            <article className="rounded-[24px] border border-white/10 bg-white/6 p-5 backdrop-blur">
              <Building2 className="size-5 text-cyan-200" />
              <h2 className="mt-4 text-lg font-semibold text-white">
                Tenant scoped
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Every login resolves the organisation first so access stays
                isolated per tenant.
              </p>
            </article>
            <article className="rounded-[24px] border border-white/10 bg-white/6 p-5 backdrop-blur">
              <ShieldCheck className="size-5 text-cyan-200" />
              <h2 className="mt-4 text-lg font-semibold text-white">
                Session ready
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Successful login issues a signed session cookie that includes a
                session ID for follow-on authorization work.
              </p>
            </article>
            <article className="rounded-[24px] border border-white/10 bg-white/6 p-5 backdrop-blur">
              <LockKeyhole className="size-5 text-cyan-200" />
              <h2 className="mt-4 text-lg font-semibold text-white">
                Workspace gated
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                The landing page and menu routes stay hidden until a valid
                session is present.
              </p>
            </article>
          </div>
        </section>

        <section className="flex items-center justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.98))] px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_50px_rgba(15,23,42,0.08)] sm:p-8">
            <div>
              <p className="text-xs font-semibold tracking-[0.24em] text-cyan-700 uppercase">
                Sign In
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Use the credentials assigned to your organisation.
              </p>
            </div>

            <form action={loginAction} className="mt-8 space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="organizationCode"
                  className="text-sm font-medium text-slate-700"
                >
                  Organisation
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition focus-within:border-cyan-500 focus-within:bg-white">
                  <Building2 className="size-4 text-slate-400" />
                  <input
                    id="organizationCode"
                    name="organizationCode"
                    type="text"
                    defaultValue={params.organization ?? ''}
                    className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="text-sm font-medium text-slate-700"
                >
                  User
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition focus-within:border-cyan-500 focus-within:bg-white">
                  <UserRound className="size-4 text-slate-400" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    defaultValue={params.username ?? ''}
                    className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition focus-within:border-cyan-500 focus-within:bg-white">
                  <LockKeyhole className="size-4 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter password"
                    className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {noticeMessage ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {noticeMessage}
                </div>
              ) : null}

              {errorMessage ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </div>
              ) : null}

              <Button
                type="submit"
                size="lg"
                className="w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
              >
                Sign in
              </Button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
