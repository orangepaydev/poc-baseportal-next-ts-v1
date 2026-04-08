import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import type { AuthenticatedSession } from '@/lib/auth/types';

const SESSION_COOKIE_NAME = 'portal_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function getSessionSecret() {
  return process.env.AUTH_SESSION_SECRET ?? 'local-dev-session-secret';
}

function createSignature(value: string) {
  return createHmac('sha256', getSessionSecret())
    .update(value)
    .digest('base64url');
}

function encodeSession(session: AuthenticatedSession) {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = createSignature(payload);

  return `${payload}.${signature}`;
}

function decodeSession(cookieValue: string) {
  const [payload, signature] = cookieValue.split('.');

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = createSignature(payload);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    ) as Partial<AuthenticatedSession>;

    if (
      typeof decoded.sessionId !== 'string' ||
      typeof decoded.userId !== 'number' ||
      typeof decoded.organizationId !== 'number' ||
      typeof decoded.organizationCode !== 'string' ||
      typeof decoded.username !== 'string' ||
      typeof decoded.displayName !== 'string' ||
      typeof decoded.issuedAt !== 'string'
    ) {
      return null;
    }

    return decoded as AuthenticatedSession;
  } catch {
    return null;
  }
}

export async function setSessionCookie(session: AuthenticatedSession) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, encodeSession(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function readSession() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!cookieValue) {
    return null;
  }

  return decodeSession(cookieValue);
}

export async function requireSession() {
  const session = await readSession();

  if (!session) {
    redirect('/login');
  }

  return session;
}

export { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS };
