'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  approveOrganizationRequest,
  rejectOrganizationRequest,
  submitCreateOrganizationRequest,
  submitDeleteOrganizationRequest,
  submitUpdateOrganizationRequest,
} from '@/lib/organizations';

const ORGANIZATION_PAGE_PATH = '/admin/organization';

function buildRedirectPath(key: 'notice' | 'error', message: string) {
  const params = new URLSearchParams({ [key]: message });

  return `${ORGANIZATION_PAGE_PATH}?${params.toString()}`;
}

function resolveRedirectTarget(formData: FormData) {
  const redirectTo = String(formData.get('redirectTo') ?? '').trim();

  if (redirectTo.startsWith('/admin/organization')) {
    return redirectTo;
  }

  return ORGANIZATION_PAGE_PATH;
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

export async function createOrganizationRequestAction(formData: FormData) {
  const redirectTarget = resolveRedirectTarget(formData);
  let succeeded = false;
  let redirectPath = buildRedirectPath(
    'notice',
    'Organization create request submitted for review.'
  );

  try {
    await submitCreateOrganizationRequest({
      organizationCode: String(formData.get('organizationCode') ?? ''),
      organizationName: String(formData.get('organizationName') ?? ''),
      adminUser1Username: String(formData.get('adminUser1Username') ?? ''),
      adminUser1Email: String(formData.get('adminUser1Email') ?? ''),
      adminUser2Username: String(formData.get('adminUser2Username') ?? ''),
      adminUser2Email: String(formData.get('adminUser2Email') ?? ''),
    });
    succeeded = true;
  } catch (error) {
    redirectPath = buildRedirectPathForTarget(
      redirectTarget,
      'error',
      getErrorMessage(error)
    );
  }

  revalidatePath(ORGANIZATION_PAGE_PATH);
  revalidatePath(redirectTarget);
  if (succeeded && redirectTarget !== ORGANIZATION_PAGE_PATH) {
    redirectPath = buildRedirectPathForTarget(
      redirectTarget,
      'notice',
      'Organization create request submitted for review.'
    );
  }
  redirect(redirectPath);
}

export async function updateOrganizationRequestAction(formData: FormData) {
  const redirectTarget = resolveRedirectTarget(formData);
  let succeeded = false;
  let redirectPath = buildRedirectPath(
    'notice',
    'Organization update request submitted for review.'
  );

  try {
    await submitUpdateOrganizationRequest({
      organizationId: readPositiveInteger(formData, 'organizationId'),
      organizationName: String(formData.get('organizationName') ?? ''),
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

  revalidatePath(ORGANIZATION_PAGE_PATH);
  revalidatePath(redirectTarget);
  if (succeeded && redirectTarget !== ORGANIZATION_PAGE_PATH) {
    redirectPath = buildRedirectPathForTarget(
      redirectTarget,
      'notice',
      'Organization update request submitted for review.'
    );
  }
  redirect(redirectPath);
}

export async function deleteOrganizationRequestAction(formData: FormData) {
  const redirectTarget = resolveRedirectTarget(formData);
  let succeeded = false;
  let redirectPath = buildRedirectPath(
    'notice',
    'Organization delete request submitted for review.'
  );

  try {
    await submitDeleteOrganizationRequest({
      organizationId: readPositiveInteger(formData, 'organizationId'),
    });
    succeeded = true;
  } catch (error) {
    redirectPath = buildRedirectPathForTarget(
      redirectTarget,
      'error',
      getErrorMessage(error)
    );
  }

  revalidatePath(ORGANIZATION_PAGE_PATH);
  revalidatePath(redirectTarget);
  if (succeeded && redirectTarget !== ORGANIZATION_PAGE_PATH) {
    redirectPath = buildRedirectPathForTarget(
      redirectTarget,
      'notice',
      'Organization delete request submitted for review.'
    );
  }
  redirect(redirectPath);
}

export async function approveOrganizationRequestAction(formData: FormData) {
  const redirectTarget = resolveRedirectTarget(formData);
  let succeeded = false;
  let redirectPath = buildRedirectPath(
    'notice',
    'Organization request approved.'
  );

  try {
    await approveOrganizationRequest({
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

  revalidatePath(ORGANIZATION_PAGE_PATH);
  revalidatePath(redirectTarget);
  if (succeeded && redirectTarget !== ORGANIZATION_PAGE_PATH) {
    redirectPath = buildRedirectPathForTarget(
      redirectTarget,
      'notice',
      'Organization request approved.'
    );
  }
  redirect(redirectPath);
}

export async function rejectOrganizationRequestAction(formData: FormData) {
  const redirectTarget = resolveRedirectTarget(formData);
  let succeeded = false;
  let redirectPath = buildRedirectPath(
    'notice',
    'Organization request rejected.'
  );

  try {
    await rejectOrganizationRequest({
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

  revalidatePath(ORGANIZATION_PAGE_PATH);
  revalidatePath(redirectTarget);
  if (succeeded && redirectTarget !== ORGANIZATION_PAGE_PATH) {
    redirectPath = buildRedirectPathForTarget(
      redirectTarget,
      'notice',
      'Organization request rejected.'
    );
  }
  redirect(redirectPath);
}
