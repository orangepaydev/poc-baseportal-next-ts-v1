'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  submitCreateSystemCodeRequest,
  submitUpdateSystemCodeRequest,
  type NewSystemCodeValueInput,
} from '@/lib/system-codes';

const SYSTEM_CODE_PAGE_PATH = '/admin/system-code';

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

  if (redirectTo.startsWith('/admin/system-code')) {
    return redirectTo;
  }

  return SYSTEM_CODE_PAGE_PATH;
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

function parseStringArray(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => String(value ?? ''));
}

function parseNumberArray(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => Number(value ?? 0));
}

function parseNewValues(formData: FormData): NewSystemCodeValueInput[] {
  const codes = parseStringArray(formData, 'newValueCode');
  const descriptions = parseStringArray(formData, 'newValueDescription');
  const statuses = parseStringArray(formData, 'newValueStatus');
  const sortOrders = parseNumberArray(formData, 'newValueSortOrder');
  const length = Math.max(
    codes.length,
    descriptions.length,
    statuses.length,
    sortOrders.length
  );

  return Array.from({ length }, (_, index) => ({
    systemCodeValue: codes[index] ?? '',
    description: descriptions[index] ?? '',
    status: statuses[index] ?? 'ACTIVE',
    sortOrder: Number.isFinite(sortOrders[index]) ? sortOrders[index] : 0,
  }));
}

export async function createSystemCodeRequestAction(formData: FormData) {
  const redirectTarget = resolveRedirectTarget(formData);
  let redirectPath = buildRedirectPath(
    redirectTarget,
    'notice',
    'System Code create request submitted for review.'
  );

  try {
    await submitCreateSystemCodeRequest({
      systemCode: String(formData.get('systemCode') ?? ''),
      description: String(formData.get('description') ?? ''),
      status: String(formData.get('status') ?? 'ACTIVE'),
    });
  } catch (error) {
    redirectPath = buildRedirectPath(
      redirectTarget,
      'error',
      getErrorMessage(error)
    );
  }

  revalidatePath(SYSTEM_CODE_PAGE_PATH);
  revalidatePath('/admin/approval-request');
  revalidatePath(redirectTarget);
  redirect(redirectPath);
}

export async function updateSystemCodeRequestAction(formData: FormData) {
  const redirectTarget = resolveRedirectTarget(formData);
  let redirectPath = buildRedirectPath(
    redirectTarget,
    'notice',
    'System Code update request submitted for review.'
  );

  try {
    await submitUpdateSystemCodeRequest({
      systemCodeId: readPositiveInteger(formData, 'systemCodeId'),
      description: String(formData.get('description') ?? ''),
      status: String(formData.get('status') ?? 'ACTIVE'),
      removeValueIds: formData
        .getAll('removeValueIds')
        .map((value) => Number(value ?? 0))
        .filter((value) => Number.isInteger(value) && value > 0),
      newValues: parseNewValues(formData),
    });
  } catch (error) {
    redirectPath = buildRedirectPath(
      redirectTarget,
      'error',
      getErrorMessage(error)
    );
  }

  revalidatePath(SYSTEM_CODE_PAGE_PATH);
  revalidatePath('/admin/approval-request');
  revalidatePath(redirectTarget);
  redirect(redirectPath);
}