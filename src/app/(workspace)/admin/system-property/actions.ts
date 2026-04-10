'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  submitCreateSystemPropertyRequest,
  submitCreateSystemPropertyValueRequest,
  submitDeleteSystemPropertyValueRequest,
  submitUpdateSystemPropertyValueRequest,
} from '@/lib/system-properties';

const SYSTEM_PROPERTY_PAGE_PATH = '/admin/system-property';

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

  if (redirectTo.startsWith('/admin/system-property')) {
    return redirectTo;
  }

  return SYSTEM_PROPERTY_PAGE_PATH;
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

export async function createSystemPropertyRequestAction(formData: FormData) {
  const redirectTarget = resolveRedirectTarget(formData);
  let redirectPath = buildRedirectPath(
    redirectTarget,
    'notice',
    'System Property create request submitted for review.'
  );

  try {
    await submitCreateSystemPropertyRequest({
      propertyCode: String(formData.get('propertyCode') ?? ''),
      description: String(formData.get('description') ?? ''),
    });
  } catch (error) {
    redirectPath = buildRedirectPath(
      redirectTarget,
      'error',
      getErrorMessage(error)
    );
  }

  revalidatePath(SYSTEM_PROPERTY_PAGE_PATH);
  revalidatePath('/admin/approval-request');
  revalidatePath(redirectTarget);
  redirect(redirectPath);
}

export async function createSystemPropertyValueRequestAction(formData: FormData) {
  const redirectTarget = resolveRedirectTarget(formData);
  let redirectPath = buildRedirectPath(
    redirectTarget,
    'notice',
    'System Property Value create request submitted for review.'
  );

  try {
    await submitCreateSystemPropertyValueRequest({
      systemPropertyId: readPositiveInteger(formData, 'systemPropertyId'),
      propertyItemCode: String(formData.get('propertyItemCode') ?? ''),
      propertyValue: String(formData.get('propertyValue') ?? ''),
      description: String(formData.get('description') ?? ''),
    });
  } catch (error) {
    redirectPath = buildRedirectPath(
      redirectTarget,
      'error',
      getErrorMessage(error)
    );
  }

  revalidatePath(SYSTEM_PROPERTY_PAGE_PATH);
  revalidatePath('/admin/approval-request');
  revalidatePath(redirectTarget);
  redirect(redirectPath);
}

export async function updateSystemPropertyValueRequestAction(formData: FormData) {
  const redirectTarget = resolveRedirectTarget(formData);
  let redirectPath = buildRedirectPath(
    redirectTarget,
    'notice',
    'System Property Value update request submitted for review.'
  );

  try {
    await submitUpdateSystemPropertyValueRequest({
      systemPropertyId: readPositiveInteger(formData, 'systemPropertyId'),
      valueId: readPositiveInteger(formData, 'valueId'),
      propertyItemCode: String(formData.get('propertyItemCode') ?? ''),
      propertyValue: String(formData.get('propertyValue') ?? ''),
      description: String(formData.get('description') ?? ''),
    });
  } catch (error) {
    redirectPath = buildRedirectPath(
      redirectTarget,
      'error',
      getErrorMessage(error)
    );
  }

  revalidatePath(SYSTEM_PROPERTY_PAGE_PATH);
  revalidatePath('/admin/approval-request');
  revalidatePath(redirectTarget);
  redirect(redirectPath);
}

export async function deleteSystemPropertyValueRequestAction(formData: FormData) {
  const redirectTarget = resolveRedirectTarget(formData);
  let redirectPath = buildRedirectPath(
    redirectTarget,
    'notice',
    'System Property Value delete request submitted for review.'
  );

  try {
    await submitDeleteSystemPropertyValueRequest({
      systemPropertyId: readPositiveInteger(formData, 'systemPropertyId'),
      valueId: readPositiveInteger(formData, 'valueId'),
    });
  } catch (error) {
    redirectPath = buildRedirectPath(
      redirectTarget,
      'error',
      getErrorMessage(error)
    );
  }

  revalidatePath(SYSTEM_PROPERTY_PAGE_PATH);
  revalidatePath('/admin/approval-request');
  revalidatePath(redirectTarget);
  redirect(redirectPath);
}