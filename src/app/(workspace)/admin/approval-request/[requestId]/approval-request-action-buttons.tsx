'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { approveRequestAction, rejectRequestAction } from '../actions';

type ApprovalRequestActionButtonsProps = {
  requestId: number;
};

type DialogMode = 'approve' | 'reject' | null;

export function ApprovalRequestActionButtons({
  requestId,
}: ApprovalRequestActionButtonsProps) {
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);

  return (
    <>
      <Button
        type="button"
        className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
        onClick={() => setDialogMode('approve')}
      >
        Approve
      </Button>

      <Button
        type="button"
        variant="destructive"
        className="rounded-2xl"
        onClick={() => setDialogMode('reject')}
      >
        Reject
      </Button>

      {dialogMode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <p
              className={`text-xs font-semibold tracking-[0.22em] uppercase ${
                dialogMode === 'approve' ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {dialogMode === 'approve'
                ? 'Confirm Approve'
                : 'Confirm Reject'}
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">
              {dialogMode === 'approve'
                ? 'Approve this request?'
                : 'Reject this request?'}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {dialogMode === 'approve'
                ? 'Approving will apply the proposed change to the live data.'
                : 'Rejecting will decline the proposed change. For new records, the placeholder row will be removed.'}
            </p>

            <form
              action={
                dialogMode === 'approve'
                  ? approveRequestAction
                  : rejectRequestAction
              }
              className="mt-5 grid gap-4"
            >
              <input name="requestId" type="hidden" value={requestId} />

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Remark</span>
                <textarea
                  name="comment"
                  rows={3}
                  placeholder="Optional remark for this action"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-900 transition outline-none focus:border-cyan-500 focus:bg-white"
                />
              </label>

              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => setDialogMode(null)}
                >
                  Cancel
                </Button>

                {dialogMode === 'approve' ? (
                  <Button
                    type="submit"
                    className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Approve
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="destructive"
                    className="rounded-2xl"
                  >
                    Reject
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
