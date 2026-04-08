'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { approveRequest, rejectRequest } from '@/lib/approval-requests';

const LIST_PATH = '/admin/approval-request';

function buildRedirectPath(
  basePath: string,
  key: 'notice' | 'error',
  message: string
) {
  const params = new URLSearchParams({ [key]: message });

  return `${basePath}?${params.toString()}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'The request could not be completed.';
}

export async function approveRequestAction(formData: FormData) {
  const requestId = Number(formData.get('requestId') ?? 0);
  const comment = String(formData.get('comment') ?? '');
  const detailPath = `${LIST_PATH}/${requestId}`;
  let redirectPath: string;

  try {
    await approveRequest({ requestId, comment });
    redirectPath = buildRedirectPath(detailPath, 'notice', 'Request approved.');
  } catch (error) {
    redirectPath = buildRedirectPath(detailPath, 'error', getErrorMessage(error));
  }

  revalidatePath(LIST_PATH);
  revalidatePath(detailPath);
  redirect(redirectPath);
}

export async function rejectRequestAction(formData: FormData) {
  const requestId = Number(formData.get('requestId') ?? 0);
  const comment = String(formData.get('comment') ?? '');
  const detailPath = `${LIST_PATH}/${requestId}`;
  let redirectPath: string;

  try {
    await rejectRequest({ requestId, comment });
    redirectPath = buildRedirectPath(detailPath, 'notice', 'Request rejected.');
  } catch (error) {
    redirectPath = buildRedirectPath(detailPath, 'error', getErrorMessage(error));
  }

  revalidatePath(LIST_PATH);
  revalidatePath(detailPath);
  redirect(redirectPath);
}
