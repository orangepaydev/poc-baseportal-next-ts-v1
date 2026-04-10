import { KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { completePasswordResetAction } from '@/lib/auth/actions';
import { readSession } from '@/lib/auth/session';

type ChangePasswordPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function ChangePasswordPage({
  searchParams,
}: ChangePasswordPageProps) {
  const session = await readSession();

  if (!session) {
    redirect('/login');
  }

  if (!session.passwordResetRequired) {
    redirect('/');
  }

  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,116,144,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.18),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-[32px] border border-white/70 bg-white/75 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative flex flex-col justify-between overflow-hidden bg-slate-950 px-6 py-8 text-slate-50 sm:px-8 lg:px-10 lg:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(148,163,184,0.18),transparent_26%)]" />

          <div className="relative">
            <p className="text-xs font-semibold tracking-[0.28em] text-cyan-200 uppercase">
              Password Rotation
            </p>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white">
              Change your temporary password
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Your account has been flagged to require a password change before
              entering the workspace. Set a new password now. After the change,
              the current session will be closed and you will sign in again.
            </p>
          </div>

          <div className="relative grid gap-4 md:grid-cols-3">
            <article className="rounded-[24px] border border-white/10 bg-white/6 p-5 backdrop-blur">
              <ShieldCheck className="size-5 text-cyan-200" />
              <h2 className="mt-4 text-lg font-semibold text-white">
                Login verified
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                You already authenticated successfully with your current password.
              </p>
            </article>
            <article className="rounded-[24px] border border-white/10 bg-white/6 p-5 backdrop-blur">
              <KeyRound className="size-5 text-cyan-200" />
              <h2 className="mt-4 text-lg font-semibold text-white">
                One-time rotation
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                This clears the reset-required flag and replaces the temporary password.
              </p>
            </article>
            <article className="rounded-[24px] border border-white/10 bg-white/6 p-5 backdrop-blur">
              <LockKeyhole className="size-5 text-cyan-200" />
              <h2 className="mt-4 text-lg font-semibold text-white">
                Session reset
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                After the password change, the app signs you out and returns you to login.
              </p>
            </article>
          </div>
        </section>

        <section className="flex items-center justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.98))] px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_50px_rgba(15,23,42,0.08)] sm:p-8">
            <div>
              <p className="text-xs font-semibold tracking-[0.24em] text-cyan-700 uppercase">
                Change Password
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Signed in as <strong>{session.username}</strong> in{' '}
                <strong>{session.organizationCode}</strong>.
              </p>
            </div>

            <form action={completePasswordResetAction} className="mt-8 space-y-5">
              <label className="block space-y-2 text-sm font-medium text-slate-700">
                <span>New Password</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition focus-within:border-cyan-500 focus-within:bg-white">
                  <LockKeyhole className="size-4 text-slate-400" />
                  <input
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 12 characters"
                    className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>

              <label className="block space-y-2 text-sm font-medium text-slate-700">
                <span>Confirm New Password</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition focus-within:border-cyan-500 focus-within:bg-white">
                  <KeyRound className="size-4 text-slate-400" />
                  <input
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Re-enter the new password"
                    className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>

              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
                The new password must be 12 to 200 characters and include at least one letter and one number.
              </div>

              {params.error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {params.error}
                </div>
              ) : null}

              <Button
                type="submit"
                size="lg"
                className="w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
              >
                Update Password
              </Button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}