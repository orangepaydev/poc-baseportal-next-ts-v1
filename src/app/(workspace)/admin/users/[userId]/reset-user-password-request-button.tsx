'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { resetUserPasswordRequestAction } from '../actions';

type ResetUserPasswordRequestButtonProps = {
  userId: number;
  displayName: string;
  email: string;
  redirectTo: string;
};

export function ResetUserPasswordRequestButton({
  userId,
  displayName,
  email,
  redirectTo,
}: ResetUserPasswordRequestButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="rounded-2xl"
        onClick={() => setOpen(true)}
      >
        Reset Password
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <p className="text-xs font-semibold tracking-[0.22em] text-amber-600 uppercase">
              Confirm Reset Password
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">
              Submit password reset request?
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This will submit a maker request to reset the password for {displayName}. Once approved, a secure password will be generated and emailed to {email}.
            </p>

            <form
              action={resetUserPasswordRequestAction}
              className="mt-6 flex flex-wrap justify-end gap-3"
            >
              <input name="userId" type="hidden" value={userId} />
              <input name="redirectTo" type="hidden" value={redirectTo} />

              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={() => setOpen(false)}
              >
                Exit
              </Button>
              <Button
                type="submit"
                className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
              >
                Submit Request
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}