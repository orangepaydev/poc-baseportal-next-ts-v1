'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  approveUserGroupRequest,
  rejectUserGroupRequest,
  submitCreateUserGroupRequest,
  submitDeleteUserGroupRequest,
  submitUpdateUserGroupRequest,
} from '@/lib/user-groups';

const USER_GROUP_PAGE_PATH = '/admin/user-group';

function buildRedirectPath(key: 'notice' | 'error', message: string) {
  const params = new URLSearchParams({ [key]: message });

  return `${USER_GROUP_PAGE_PATH}?${params.toString()}`;
}

function resolveRedirectTarget(formData: FormData) {
  const redirectTo = String(formData.get('redirectTo') ?? '').trim();

  if (redirectTo.startsWith('/admin/user-group')) {
    return redirectTo;
  }

  return USER_GROUP_PAGE_PATH;
}

function buildRedirectPathForTarget(
  targetPath: string,
  key: 'notice' | 'error',
  message: string
) {
  const params = new URLSearchParams({ [key]: message });

  return `${targetPath}?${params.toString()}`;
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

export async function createUserGroupRequestAction(formData: FormData) {
  const redirectTarget = resolveRedirectTarget(formData);
  let succeeded = false;
  let redirectPath = buildRedirectPath(
    'notice',
    'User group create request submitted for review.'
  );

  try {
    await submitCreateUserGroupRequest({
      groupCode: String(formData.get('groupCode') ?? ''),
      groupName: String(formData.get('groupName') ?? ''),
      description: String(formData.get('description') ?? ''),
      status: String(formData.get('status') ?? 'ACTIVE'),
    });
    succeeded = true;
  } catch (error) {
    redirectPath = buildRedirectPathForTarget(
      redirectTarget,
      'error',
      getErrorMessage(error)
    );
  }

  revalidatePath(USER_GROUP_PAGE_PATH);
  revalidatePath(redirectTarget);
  if (succeeded && redirectTarget !== USER_GROUP_PAGE_PATH) {
    redirectPath = buildRedirectPathForTarget(
      redirectTarget,
      'notice',
      'User group create request submitted for review.'
    );
  }
  redirect(redirectPath);
}

export async function updateUserGroupRequestAction(formData: FormData) {
  const redirectTarget = resolveRedirectTarget(formData);
  let succeeded = false;
  let redirectPath = buildRedirectPath(
    'notice',
    'User group update request submitted for review.'
  );

  try {
    await submitUpdateUserGroupRequest({
      groupId: readPositiveInteger(formData, 'groupId'),
      groupName: String(formData.get('groupName') ?? ''),
      description: String(formData.get('description') ?? ''),
      status: String(formData.get('status') ?? 'ACTIVE'),
    });
    succeeded = true;
  } catch (error) {
    redirectPath = buildRedirectPathForTarget(
      redirectTarget,
      'error',
      getErrorMessage(error)
    );
  }

  revalidatePath(USER_GROUP_PAGE_PATH);
  revalidatePath(redirectTarget);
  if (succeeded && redirectTarget !== USER_GROUP_PAGE_PATH) {
    redirectPath = buildRedirectPathForTarget(
      redirectTarget,
      'notice',
      'User group update request submitted for review.'
    );
  }
  redirect(redirectPath);
}

export async function deleteUserGroupRequestAction(formData: FormData) {
  const redirectTarget = resolveRedirectTarget(formData);
  let succeeded = false;
  let redirectPath = buildRedirectPath(
    'notice',
    'User group delete request submitted for review.'
  );

  try {
    await submitDeleteUserGroupRequest({
      groupId: readPositiveInteger(formData, 'groupId'),
    });
    succeeded = true;
  } catch (error) {
    redirectPath = buildRedirectPathForTarget(
      redirectTarget,
      'error',
      getErrorMessage(error)
    );
  }

  revalidatePath(USER_GROUP_PAGE_PATH);
  revalidatePath(redirectTarget);
  if (succeeded && redirectTarget !== USER_GROUP_PAGE_PATH) {
    redirectPath = buildRedirectPathForTarget(
      redirectTarget,
      'notice',
      'User group delete request submitted for review.'
    );
  }
  redirect(redirectPath);
}

export async function approveUserGroupRequestAction(formData: FormData) {
  const redirectTarget = resolveRedirectTarget(formData);
  let succeeded = false;
  let redirectPath = buildRedirectPath(
    'notice',
    'User group request approved.'
  );

  try {
    await approveUserGroupRequest({
      requestId: readPositiveInteger(formData, 'requestId'),
      comment: String(formData.get('comment') ?? ''),
    });
    succeeded = true;
  } catch (error) {
    redirectPath = buildRedirectPathForTarget(
      redirectTarget,
      'error',
      getErrorMessage(error)
    );
  }

  revalidatePath(USER_GROUP_PAGE_PATH);
  revalidatePath(redirectTarget);
  if (succeeded && redirectTarget !== USER_GROUP_PAGE_PATH) {
    redirectPath = buildRedirectPathForTarget(
      redirectTarget,
      'notice',
      'User group request approved.'
    );
  }
  redirect(redirectPath);
}

export async function rejectUserGroupRequestAction(formData: FormData) {
  const redirectTarget = resolveRedirectTarget(formData);
  let succeeded = false;
  let redirectPath = buildRedirectPath(
    'notice',
    'User group request rejected.'
  );

  try {
    await rejectUserGroupRequest({
      requestId: readPositiveInteger(formData, 'requestId'),
      comment: String(formData.get('comment') ?? ''),
    });
    succeeded = true;
  } catch (error) {
    redirectPath = buildRedirectPathForTarget(
      redirectTarget,
      'error',
      getErrorMessage(error)
    );
  }

  revalidatePath(USER_GROUP_PAGE_PATH);
  revalidatePath(redirectTarget);
  if (succeeded && redirectTarget !== USER_GROUP_PAGE_PATH) {
    redirectPath = buildRedirectPathForTarget(
      redirectTarget,
      'notice',
      'User group request rejected.'
    );
  }
  redirect(redirectPath);
}
