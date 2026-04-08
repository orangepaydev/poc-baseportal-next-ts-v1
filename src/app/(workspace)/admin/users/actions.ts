'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  approveUserRequest,
  rejectUserRequest,
  submitCreateUserRequest,
  submitDeleteUserRequest,
  submitUpdateUserRequest,
} from '@/lib/users';

const USER_PAGE_PATH = '/admin/users';

function buildRedirectPath(key: 'notice' | 'error', message: string) {
  const params = new URLSearchParams({ [key]: message });

  return `${USER_PAGE_PATH}?${params.toString()}`;
}

function resolveRedirectTarget(formData: FormData) {
  const redirectTo = String(formData.get('redirectTo') ?? '').trim();

  if (redirectTo.startsWith('/admin/users')) {
    return redirectTo;
  }

  return USER_PAGE_PATH;
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

export async function createUserRequestAction(formData: FormData) {
  const redirectTarget = resolveRedirectTarget(formData);
  let succeeded = false;
  let redirectPath = buildRedirectPath(
    'notice',
    'User create request submitted for review.'
  );

  try {
    await submitCreateUserRequest({
      username: String(formData.get('username') ?? ''),
      displayName: String(formData.get('displayName') ?? ''),
      email: String(formData.get('email') ?? ''),
      userType: String(formData.get('userType') ?? 'NORMAL'),
      password: String(formData.get('password') ?? ''),
    });
    succeeded = true;
  } catch (error) {
    redirectPath = buildRedirectPathForTarget(
      redirectTarget,
      'error',
      getErrorMessage(error)
    );
  }

  revalidatePath(USER_PAGE_PATH);
  revalidatePath(redirectTarget);
  if (succeeded && redirectTarget !== USER_PAGE_PATH) {
    redirectPath = buildRedirectPathForTarget(
      redirectTarget,
      'notice',
      'User create request submitted for review.'
    );
  }
  redirect(redirectPath);
}

export async function updateUserRequestAction(formData: FormData) {
  const redirectTarget = resolveRedirectTarget(formData);
  let succeeded = false;
  let redirectPath = buildRedirectPath(
    'notice',
    'User update request submitted for review.'
  );

  try {
    await submitUpdateUserRequest({
      userId: readPositiveInteger(formData, 'userId'),
      displayName: String(formData.get('displayName') ?? ''),
      email: String(formData.get('email') ?? ''),
      userType: String(formData.get('userType') ?? 'NORMAL'),
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

  revalidatePath(USER_PAGE_PATH);
  revalidatePath(redirectTarget);
  if (succeeded && redirectTarget !== USER_PAGE_PATH) {
    redirectPath = buildRedirectPathForTarget(
      redirectTarget,
      'notice',
      'User update request submitted for review.'
    );
  }
  redirect(redirectPath);
}

export async function deleteUserRequestAction(formData: FormData) {
  const redirectTarget = resolveRedirectTarget(formData);
  let succeeded = false;
  let redirectPath = buildRedirectPath(
    'notice',
    'User delete request submitted for review.'
  );

  try {
    await submitDeleteUserRequest({
      userId: readPositiveInteger(formData, 'userId'),
    });
    succeeded = true;
  } catch (error) {
    redirectPath = buildRedirectPathForTarget(
      redirectTarget,
      'error',
      getErrorMessage(error)
    );
  }

  revalidatePath(USER_PAGE_PATH);
  revalidatePath(redirectTarget);
  if (succeeded && redirectTarget !== USER_PAGE_PATH) {
    redirectPath = buildRedirectPathForTarget(
      redirectTarget,
      'notice',
      'User delete request submitted for review.'
    );
  }
  redirect(redirectPath);
}

export async function approveUserRequestAction(formData: FormData) {
  const redirectTarget = resolveRedirectTarget(formData);
  let succeeded = false;
  let redirectPath = buildRedirectPath(
    'notice',
    'User request approved.'
  );

  try {
    await approveUserRequest({
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

  revalidatePath(USER_PAGE_PATH);
  revalidatePath(redirectTarget);
  if (succeeded && redirectTarget !== USER_PAGE_PATH) {
    redirectPath = buildRedirectPathForTarget(
      redirectTarget,
      'notice',
      'User request approved.'
    );
  }
  redirect(redirectPath);
}

export async function rejectUserRequestAction(formData: FormData) {
  const redirectTarget = resolveRedirectTarget(formData);
  let succeeded = false;
  let redirectPath = buildRedirectPath(
    'notice',
    'User request rejected.'
  );

  try {
    await rejectUserRequest({
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

  revalidatePath(USER_PAGE_PATH);
  revalidatePath(redirectTarget);
  if (succeeded && redirectTarget !== USER_PAGE_PATH) {
    redirectPath = buildRedirectPathForTarget(
      redirectTarget,
      'notice',
      'User request rejected.'
    );
  }
  redirect(redirectPath);
}
