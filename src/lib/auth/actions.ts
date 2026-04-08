'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { recordLoginAuditEvent } from '@/lib/auth/audit';
import { authenticateUser } from '@/lib/auth/login';
import { clearSessionCookie, setSessionCookie } from '@/lib/auth/session';

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
  redirect('/');
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect('/login');
}
