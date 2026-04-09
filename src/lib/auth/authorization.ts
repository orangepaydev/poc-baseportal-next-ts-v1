import 'server-only';

import { cache } from 'react';
import { notFound } from 'next/navigation';

import {
  countNavigationItems,
  findNavigationItem,
  navigationGroups,
  type NavigationGroup,
} from '@/lib/navigation';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import type { AuthenticatedSession, PermissionGrant } from '@/lib/auth/types';

const OWNER_ORGANIZATION_CODE = 'owner';

type PermissionGrantRow = {
  permission_code: string;
  permission_name: string;
  action_code: string;
  resource_code: string;
  resource_instance_key: string | null;
};

export type AuthenticatedUserContext = {
  session: AuthenticatedSession;
  permissions: PermissionGrant[];
  permissionCodes: string[];
  visibleNavigationGroups: NavigationGroup[];
  visibleNavigationItemCount: number;
};

function mapPermissionRow(row: PermissionGrantRow): PermissionGrant {
  return {
    permissionCode: row.permission_code,
    permissionName: row.permission_name,
    actionCode: row.action_code,
    resourceCode: row.resource_code,
    resourceInstanceKey: row.resource_instance_key,
  };
}

function hasRequiredPermissions(
  permissionCodes: string[],
  requiredPermissionCodes: string[] = []
) {
  return requiredPermissionCodes.every((permissionCode) =>
    permissionCodes.includes(permissionCode)
  );
}

function hasNavigationSessionAccess(
  session: AuthenticatedSession,
  groupSlug: string,
  itemSlug: string
) {
  const entry = findNavigationItem(groupSlug, itemSlug);

  if (!entry) {
    return false;
  }

  if (
    entry.item.access.ownerOrganizationOnly &&
    session.organizationCode !== OWNER_ORGANIZATION_CODE
  ) {
    return false;
  }

  return true;
}

function hasNavigationAccess(
  permissionCodes: string[],
  session: AuthenticatedSession,
  groupSlug: string,
  itemSlug: string,
  bypassPermissionChecks = false
) {
  const entry = findNavigationItem(groupSlug, itemSlug);

  if (!entry) {
    return false;
  }

  if (!hasNavigationSessionAccess(session, groupSlug, itemSlug)) {
    return false;
  }

  if (bypassPermissionChecks) {
    return true;
  }

  return (
    permissionCodes.includes(entry.item.access.menuPermissionCode) &&
    hasRequiredPermissions(
      permissionCodes,
      entry.item.access.requiredPermissionCodes
    )
  );
}

function buildVisibleNavigationGroups(
  permissionCodes: string[],
  session: AuthenticatedSession,
  bypassPermissionChecks = false
) {
  return navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        hasNavigationAccess(
          permissionCodes,
          session,
          group.slug,
          item.slug,
          bypassPermissionChecks
        )
      ),
    }))
    .filter((group) => group.items.length > 0);
}

const loadAuthenticatedUserContext = cache(
  async (): Promise<AuthenticatedUserContext> => {
    const session = await requireSession();
    const isAdmin = session.userType === 'ADMIN';

    const permissionRows = await db.query<PermissionGrantRow>(
      isAdmin
        ? `
            select distinct
              permission.permission_code,
              permission.permission_name,
              permission.action_code,
              resource_type.resource_code,
              permission.resource_instance_key
            from permissions permission
            inner join permission_resource_types resource_type
              on resource_type.id = permission.resource_type_id
            order by permission.permission_code
          `
        : `
            select distinct
              permission.permission_code,
              permission.permission_name,
              permission.action_code,
              resource_type.resource_code,
              permission.resource_instance_key
            from users user
            inner join user_group_memberships membership
              on membership.user_id = user.id
            inner join user_groups user_group
              on user_group.id = membership.user_group_id
            inner join user_group_permissions group_permission
              on group_permission.user_group_id = user_group.id
            inner join permissions permission
              on permission.id = group_permission.permission_id
            inner join permission_resource_types resource_type
              on resource_type.id = permission.resource_type_id
            where user.id = ?
              and user.organization_id = ?
              and user.status = 'ACTIVE'
              and user_group.organization_id = ?
              and user_group.status = 'ACTIVE'
            order by permission.permission_code
          `,
      isAdmin
        ? []
        : [session.userId, session.organizationId, session.organizationId]
    );

    const permissions = permissionRows.map(mapPermissionRow);
    const permissionCodes = permissions.map(
      (permission) => permission.permissionCode
    );
    const visibleNavigationGroups = buildVisibleNavigationGroups(
      permissionCodes,
      session,
      isAdmin
    );

    return {
      session,
      permissions,
      permissionCodes,
      visibleNavigationGroups,
      visibleNavigationItemCount: countNavigationItems(visibleNavigationGroups),
    };
  }
);

export async function getAuthenticatedUserContext() {
  return loadAuthenticatedUserContext();
}

export async function userHasPermission(permissionCode: string) {
  const context = await getAuthenticatedUserContext();

  return context.permissionCodes.includes(permissionCode);
}

export async function requireNavigationItemAccess(
  groupSlug: string,
  itemSlug: string
) {
  const context = await getAuthenticatedUserContext();
  const entry = findNavigationItem(groupSlug, itemSlug);

  if (!entry) {
    notFound();
  }

  // Admin users bypass permission checks entirely.
  if (
    !hasNavigationAccess(
      context.permissionCodes,
      context.session,
      groupSlug,
      itemSlug,
      context.session.userType === 'ADMIN'
    )
  ) {
    notFound();
  }

  return {
    ...context,
    entry,
  };
}
