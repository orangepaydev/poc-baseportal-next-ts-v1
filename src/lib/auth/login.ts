import 'server-only';

import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';

import { db } from '@/lib/db';
import type { AuthenticationResult } from '@/lib/auth/types';

type LoginInput = {
  organizationCode: string;
  username: string;
  password: string;
};

type OrganizationRow = {
  organization_id: number | bigint | string;
  organization_code: string;
};

type UserLoginRow = {
  user_id: number | bigint | string;
  username: string;
  display_name: string;
  password_sha256: string;
  password_algo: string;
  password_reset_required: number;
  user_type: 'ADMIN' | 'NORMAL';
};

function buildFailureResult(
  input: LoginInput,
  overrides: Partial<AuthenticationResult>
): AuthenticationResult {
  return {
    session: null,
    organizationId: null,
    userId: null,
    organizationCode: input.organizationCode,
    username: input.username,
    displayName: null,
    failureReason: 'user-not-found',
    ...overrides,
  };
}

function createPasswordDigest(password: string) {
  return createHash('sha256').update(password).digest('hex');
}

function normalizeDatabaseId(value: number | bigint | string, field: string) {
  const numericValue =
    typeof value === 'bigint'
      ? Number(value)
      : typeof value === 'string'
        ? Number(value)
        : value;

  if (!Number.isSafeInteger(numericValue)) {
    throw new Error(`Invalid ${field} value returned from database.`);
  }

  return numericValue;
}

function passwordsMatch(password: string, storedDigest: string) {
  const submittedBuffer = Buffer.from(createPasswordDigest(password), 'utf8');
  const storedBuffer = Buffer.from(storedDigest, 'utf8');

  if (submittedBuffer.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(submittedBuffer, storedBuffer);
}

export async function authenticateUser({
  organizationCode,
  username,
  password,
}: LoginInput): Promise<AuthenticationResult> {
  const organization = await db.queryOne<OrganizationRow>(
    `
      select
        id as organization_id,
        organization_code
      from organizations
      where organization_code = ?
        and status = 'ACTIVE'
    `,
    [organizationCode]
  );

  if (!organization) {
    return buildFailureResult(
      { organizationCode, username, password },
      { failureReason: 'organization-not-found' }
    );
  }

  const organizationId = normalizeDatabaseId(
    organization.organization_id,
    'organization_id'
  );

  const user = await db.queryOne<UserLoginRow>(
    `
      select
        id as user_id,
        user.username,
        user.display_name,
        user.password_sha256,
        user.password_algo,
        user.password_reset_required,
        user.user_type
      from users user
      where user.organization_id = ?
        and user.username = ?
        and user.status = 'ACTIVE'
    `,
    [organizationId, username]
  );

  if (!user) {
    return buildFailureResult(
      { organizationCode, username, password },
      {
        organizationId,
        organizationCode: organization.organization_code,
        failureReason: 'user-not-found',
      }
    );
  }

  const userId = normalizeDatabaseId(user.user_id, 'user_id');

  if (user.password_algo !== 'SHA256') {
    return buildFailureResult(
      { organizationCode, username, password },
      {
        organizationId,
        userId,
        organizationCode: organization.organization_code,
        displayName: user.display_name,
        failureReason: 'unsupported-password-algorithm',
      }
    );
  }

  if (!passwordsMatch(password, user.password_sha256)) {
    return buildFailureResult(
      { organizationCode, username, password },
      {
        organizationId,
        userId,
        organizationCode: organization.organization_code,
        displayName: user.display_name,
        failureReason: 'password-mismatch',
      }
    );
  }

  await db.execute(
    `
      update users
      set last_login_at = current_timestamp
      where id = ?
    `,
    [userId]
  );

  const session = {
    sessionId: randomUUID(),
    userId,
    organizationId,
    organizationCode: organization.organization_code,
    username: user.username,
    displayName: user.display_name,
    passwordResetRequired: user.password_reset_required === 1,
    userType: user.user_type,
    issuedAt: new Date().toISOString(),
  };

  return {
    session,
    organizationId,
    userId,
    organizationCode: organization.organization_code,
    username: user.username,
    displayName: user.display_name,
    failureReason: null,
  };
}
