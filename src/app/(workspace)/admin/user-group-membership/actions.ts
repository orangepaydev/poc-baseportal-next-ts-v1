'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { submitUpdateUserGroupMembershipRequest } from '@/lib/user-group-memberships';

const USER_GROUP_MEMBERSHIP_PAGE_PATH = '/admin/user-group-membership';

function buildRedirectPath(
  basePath: string,
  key: 'notice' | 'error',
  message: string
) {
  const params = new URLSearchParams({ [key]: message });

  return `${basePath}?${params.toString()}`;
}

function resolveRedirectTarget(formData: FormData) {
  const redirectTo = String(formData.get('redirectTo') ?? '').trim();

  if (redirectTo.startsWith('/admin/user-group-membership')) {
    return redirectTo;
  }

  return USER_GROUP_MEMBERSHIP_PAGE_PATH;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'The request could not be completed.';
}

function readPositiveInteger(formData: FormData, key: string) {
  return Number(formData.get(key) ?? 0);
}

function parseNumberArray(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => Number(value ?? 0))
    .filter((value) => Number.isInteger(value) && value > 0);
}

export async function updateUserGroupMembershipRequestAction(
  formData: FormData
) {
  const redirectTarget = resolveRedirectTarget(formData);
  let redirectPath = buildRedirectPath(
    redirectTarget,
    'notice',
    'User group membership update request submitted for review.'
  );

  try {
    await submitUpdateUserGroupMembershipRequest({
      groupId: readPositiveInteger(formData, 'groupId'),
      addUserIds: parseNumberArray(formData, 'addUserIds'),
      removeUserIds: parseNumberArray(formData, 'removeUserIds'),
    });
  } catch (error) {
    redirectPath = buildRedirectPath(
      redirectTarget,
      'error',
      getErrorMessage(error)
    );
  }

  revalidatePath(USER_GROUP_MEMBERSHIP_PAGE_PATH);
  revalidatePath('/admin/approval-request');
  revalidatePath(redirectTarget);
  redirect(redirectPath);
}