'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { deleteUserRequestAction } from '../actions';

type DeleteUserRequestButtonProps = {
  userId: number;
  displayName: string;
  redirectTo: string;
};

export function DeleteUserRequestButton({
  userId,
  displayName,
  redirectTo,
}: DeleteUserRequestButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        className="rounded-2xl"
        onClick={() => setOpen(true)}
      >
        Delete
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <p className="text-xs font-semibold tracking-[0.22em] text-rose-600 uppercase">
              Confirm Delete
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">
              Submit delete request?
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This will submit a maker request to delete {displayName}. The live
              user record will remain until a reviewer approves the request.
            </p>

            <form
              action={deleteUserRequestAction}
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
                variant="destructive"
                className="rounded-2xl"
              >
                Delete
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
