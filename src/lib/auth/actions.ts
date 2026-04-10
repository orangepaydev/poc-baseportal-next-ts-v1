'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { recordLoginAuditEvent } from '@/lib/auth/audit';
import { authenticateUser } from '@/lib/auth/login';
import { clearSessionCookie, setSessionCookie } from '@/lib/auth/session';
import { completePasswordResetForCurrentUser } from '@/lib/users';

function getRequestIpAddress(headerList: Headers) {
  const forwardedFor = headerList.get('x-forwarded-for');

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() ?? null;
  }

  return headerList.get('x-real-ip');
}

function buildLoginRedirect(
  error: 'invalid' | 'missing',
  organizationCode = '',
  username = ''
) {
  const params = new URLSearchParams({ error });

  if (organizationCode) {
    params.set('organization', organizationCode);
  }

  if (username) {
    params.set('username', username);
  }

  return `/login?${params.toString()}`;
}

export async function loginAction(formData: FormData) {
  const headerList = await headers();
  const organizationCode = String(
    formData.get('organizationCode') ?? ''
  ).trim();
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!organizationCode || !username || !password) {
    redirect(buildLoginRedirect('missing', organizationCode, username));
  }

  const result = await authenticateUser({
    organizationCode,
    username,
    password,
  });

  await recordLoginAuditEvent(result, {
    ipAddress: getRequestIpAddress(headerList),
    userAgent: headerList.get('user-agent'),
  });

  if (!result.session) {
    redirect(buildLoginRedirect('invalid', organizationCode, username));
  }

  await setSessionCookie(result.session);
  redirect(result.session.passwordResetRequired ? '/change-password' : '/');
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect('/login');
}

export async function completePasswordResetAction(formData: FormData) {
  try {
    await completePasswordResetForCurrentUser({
      newPassword: String(formData.get('newPassword') ?? ''),
      confirmPassword: String(formData.get('confirmPassword') ?? ''),
    });
  } catch (error) {
    const params = new URLSearchParams({
      error:
        error instanceof Error && error.message
          ? error.message
          : 'The password change could not be completed.',
    });

    redirect(`/change-password?${params.toString()}`);
  }

  await clearSessionCookie();
  redirect('/login?notice=password-changed');
}
