import 'server-only';

import { db } from '@/lib/db';
import type { AuthenticationResult } from '@/lib/auth/types';

type LoginAuditMetadata = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

function buildLoginResourceKey(result: AuthenticationResult) {
  const organizationCode = result.organizationCode || 'unknown';
  const username = result.username || 'unknown';

  return `ORG:${organizationCode}:USER:${username}`;
}

export async function recordLoginAuditEvent(
  result: AuthenticationResult,
  metadata: LoginAuditMetadata = {}
) {
  const eventData = JSON.stringify({
    outcome: result.session ? 'SUCCESS' : 'FAILED',
    failureReason: result.failureReason,
    organizationCode: result.organizationCode,
    username: result.username,
    sessionId: result.session?.sessionId ?? null,
  });

  await db.execute(
    `
      insert into audit_events (
        organization_id,
        actor_user_id,
        event_type,
        resource_type,
        resource_key,
        event_data,
        ip_address,
        user_agent
      )
      values (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      result.organizationId,
      result.userId,
      result.session ? 'AUTH_LOGIN_SUCCEEDED' : 'AUTH_LOGIN_FAILED',
      'USER',
      buildLoginResourceKey(result),
      eventData,
      metadata.ipAddress ?? null,
      metadata.userAgent?.slice(0, 255) ?? null,
    ]
  );
}
